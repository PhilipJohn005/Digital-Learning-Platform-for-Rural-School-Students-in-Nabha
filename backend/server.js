const express = require('express');
const supabase = require('./db');
const multer = require('multer');
const mammoth = require('mammoth');
const path = require("path");
const fs = require("fs");
const cors=require('cors')

const app = express();

const upload = multer({ dest: "uploads/" });
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.post('/upload', upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "no file uploaded" });

    const { title, subject, week, className } = req.body;
    const filePath = req.file.path;
    const origName = req.file.originalname || "";

    // Ensure it's a .docx
    const ext = path.extname(origName).toLowerCase();
    if (ext !== ".docx") {
      return res.status(400).json({ error: "please upload a .docx file", origName, ext });
    }

    const stats = await fs.promises.stat(filePath);
    if (!stats.size) return res.status(400).json({ error: "uploaded file is empty", size: stats.size });

    // Convert Word -> HTML
    const buffer = await fs.promises.readFile(filePath);
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value;

    console.log("Mammoth messages:", result.messages);
    console.log("Generated HTML length:", (html || "").length);

    // Save to Supabase
    const { data, error } = await supabase
      .from("lessons")
      .insert([{ title, content: html, week, subject, class:className }])
      .select();

    if (error) return res.status(400).json({ error: error.message });

    // cleanup file
    fs.unlink(filePath, () => {});

    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get("/lessons", async (req, res) => {
  const { data, error } = await supabase.from("lessons").select("*").order("id", { ascending: false }).limit(1);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Fetch single lesson
app.get("/lessons/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("lessons").select("*").eq("id", id).single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Save quiz
app.post("/quizzes", async (req, res) => {
  const { title, subject, week, className, data: quizData } = req.body;

  console.log("Incoming quiz payload:", { title, subject, week, className });

  // Step 1: Find the lesson
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id")
    .eq("title", title)
    .eq("subject", subject)
    .eq("week", week)
    .eq("class", className)  
    .single();

  if (lessonError || !lesson) {
    console.error("Lesson lookup failed:", lessonError, "Lesson:", lesson);
    return res.status(404).json({ error: "Lesson not found" });
  }

  console.log("Found lesson:", lesson);

  // Step 2: Save quiz
  const { data, error } = await supabase
    .from("quizzes")
    .insert([{
      lesson_id: lesson.id,
      class: className,   // ⚠️ check column name here too
      subject,
      data: quizData
    }])
    .select();

  if (error) {
    console.error("Quiz insert error:", error);
    return res.status(400).json({ error: error.message });
  }

  console.log("Quiz saved:", data);
  res.json(data[0]);
});



app.get("/quizzes/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("quizzes")
    .select("data")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ error: "Quiz not found" });
  res.json(data);
});

app.post("/quizzes/submit", async (req, res) => {
  const { quiz, student_id, answers } = req.body; // 'answers' is now an object: { "questionId1": "userAnswer1", ... }

  const { data: quizData, error: quizError } = await supabase
    .from("quizzes")
    .select("data")
    .eq("id", quiz)
    .single();

  if (quizError) {
    return res.status(404).json({ error: "Quiz not found" });
  }

  const quizContent = quizData.data;
  let score = 0;
  const results = [];
  const correctAnswers = {};

quizContent.forEach(q => {
  correctAnswers[q.id] = q.correctAnswer;
})

  for (const questionId in answers) {
    const userAnswer = answers[questionId];
    const correctAnswer = correctAnswers[questionId];
    const isCorrect = userAnswer === correctAnswer;
    if (isCorrect) {
      score++;
    }
    results.push({
      questionId,
      userAnswer,
      correctAnswer,
      isCorrect
    });
  }

  const { data, error } = await supabase
    .from("progress")
    .insert([{ student_id, quiz, score, answers: results }])
    .select();

  if (error) {
    console.error("Error saving progress:", error);
  }

  res.json({ score, total: quiz.length, results });
});

app.post("/publish", async (req, res) => {
  const { subject, week,className } = req.body;

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("subject", subject)
    .eq("week", week);

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*");

  const manifest = {
    subject,
    week,
    lessons,
    quizzes
  };

  const { data, error } = await supabase
    .from("manifests")
    .insert([{ subject, week, json: manifest }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(manifest);
});

app.get("/manifest/:subject/:week", async (req, res) => {
  const { subject, week } = req.params;
  const { data, error } = await supabase
    .from("manifests")
    .select("json")
    .eq("subject", subject)
    .eq("week", week)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return res.status(400).json({ error: error.message });
  if (data.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(data[0].json);
});

app.post("/progress", async (req, res) => {
  const { student_id, quiz, answers, score } = req.body;
  const { data, error } = await supabase
    .from("progress")
    .upsert([{ student_id, quiz, answers, score }], { onConflict: "student_id,quiz" })
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

app.listen(3000,()=>{
    console.log("Running on 3000")
})