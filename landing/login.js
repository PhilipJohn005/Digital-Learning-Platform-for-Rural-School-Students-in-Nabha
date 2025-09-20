    // Sample course data
    const courses = [
      {
        id: 1,
        title: "Basic Mathematics",
        description: "Learn fundamental math skills including arithmetic, fractions, and basic geometry.",
        level: "Beginner",
        language: "English",
        progress: 35,
        icon: "calculator",
        lessons: 12,
        students: 1450
      },
      {
        id: 2,
        title: "Agricultural Science",
        description: "Study modern farming techniques, crop rotation, and sustainable practices.",
        level: "Intermediate",
        language: "Hindi",
        progress: 0,
        icon: "leaf",
        lessons: 18,
        students: 892
      },
      {
        id: 3,
        title: "Financial Literacy",
        description: "Understand basic financial concepts, budgeting, and money management.",
        level: "Beginner",
        language: "Kannada",
        progress: 70,
        icon: "rupee-sign",
        lessons: 10,
        students: 2103
      },
      {
        id: 4,
        title: "Digital Skills",
        description: "Learn essential computer and smartphone skills for daily life.",
        level: "Beginner",
        language: "Telugu",
        progress: 20,
        icon: "laptop",
        lessons: 15,
        students: 3150
      },
      {
        id: 5,
        title: "English Communication",
        description: "Improve your English speaking, reading, and writing skills.",
        level: "Intermediate",
        language: "English",
        progress: 0,
        icon: "language",
        lessons: 24,
        students: 1876
      },
      {
        id: 6,
        title: "Health & Nutrition",
        description: "Learn about balanced diets, disease prevention, and family health.",
        level: "Beginner",
        language: "Hindi",
        progress: 100,
        icon: "heart",
        lessons: 14,
        students: 2765
      }
    ];

    // DOM elements
    const coursesGrid = document.getElementById('courses-grid');
    const coursesCount = document.getElementById('courses-count');
    const filterLevel = document.getElementById('filter-level');
    const filterLang = document.getElementById('filter-lang');
    const clearFilters = document.getElementById('clear-filters');
    const addCourseModal = document.getElementById('add-course-modal');
    const openAddBtn = document.getElementById('open-add');
    const closeModalBtns = document.querySelectorAll('.close-x');
    const loginBtn = document.getElementById('login-btn');
    const videoModal = document.getElementById('video-modal');
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('nav a, .topic-card button, .btn[data-page]');

    // Render courses
    function renderCourses(coursesToRender) {
      coursesGrid.innerHTML = '';
      coursesCount.textContent = `${coursesToRender.length} courses available`;
      
      coursesToRender.forEach(course => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="card-image">
            <i class="fas fa-${course.icon}"></i>
            <span class="card-badge">${course.level}</span>
          </div>
          <div class="card-content">
            <h3 class="card-title">${course.title}</h3>
            <p class="card-description">${course.description}</p>
            <div class="card-meta">
              <span><i class="fas fa-book"></i> ${course.lessons} lessons</span>
              <span><i class="fas fa-users"></i> ${course.students} students</span>
            </div>
            ${course.progress > 0 ? `
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${course.progress}%"></div>
                </div>
                <span>${course.progress}% complete</span>
              </div>
            ` : ''}
            <div class="card-actions">
              <button class="btn small btn-primary" style="flex:1">${course.progress > 0 ? 'Continue' : 'Start'}</button>
              <button class="btn small btn-outline">
                <i class="fas fa-info-circle"></i>
              </button>
            </div>
          </div>
        `;
        coursesGrid.appendChild(card);
      });
    }

    // Filter courses
    function filterCourses() {
      const levelValue = filterLevel.value;
      const langValue = filterLang.value;
      
      const filteredCourses = courses.filter(course => {
        return (!levelValue || course.level === levelValue) && 
               (!langValue || course.language === langValue);
      });
      
      renderCourses(filteredCourses);
    }

    // Show page function
    function showPage(pageId) {
      pages.forEach(page => {
        page.classList.remove('active');
      });
      
      const targetPage = document.getElementById(`${pageId}-page`);
      if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo(0, 0);
      }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
      // Render initial courses
      renderCourses(courses);
      
      // Set up event listeners
      filterLevel.addEventListener('change', filterCourses);
      filterLang.addEventListener('change', filterCourses);
      clearFilters.addEventListener('click', () => {
        filterLevel.value = '';
        filterLang.value = '';
        renderCourses(courses);
      });
      
      openAddBtn.addEventListener('click', () => {
        addCourseModal.classList.add('show');
      });
      
      closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          addCourseModal.classList.remove('show');
          videoModal.classList.remove('show');
        });
      });
      
      loginBtn.addEventListener('click', () => {
        showPage('login');
      });
      
      // Navigation
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const page = link.getAttribute('data-page') || link.closest('button').getAttribute('data-page');
          if (page) {
            showPage(page);
          }
        });
      });
      
      // Auth navigation
      document.getElementById('goto-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('register');
      });
      
      document.getElementById('goto-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('login');
      });
      
      document.getElementById('goto-student-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('student-login');
      });
      
      document.getElementById('goto-teacher-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('teacher-login');
      });
      
      // Explore button
      document.getElementById('explore-btn')?.addEventListener('click', () => {
        showPage('courses');
      });
    });
