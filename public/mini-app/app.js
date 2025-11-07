// Initialize Telegram Web App
const tg = window.Telegram.WebApp;

// App State
let appState = {
  userId: null,
  groupId: null,
  currentMonth: new Date(),
  selectedMood: null,
  exercises: [],
};

// Get URL parameters
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  appState.userId = params.get('user_id');
  appState.groupId = params.get('group_id');
  const tab = params.get('tab') || 'workout';

  if (tab === 'streaks') {
    switchTab('streaks');
  }
}

// Initialize app
function init() {
  getUrlParams();
  setupEventListeners();
  setupTabNavigation();
  initializeExerciseForm();
  initializeCalendar();

  // Configure Telegram Web App
  tg.ready();
  tg.setHeaderColor('#2196F3');
}

// Tab Navigation
function setupTabNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.target.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tabName) {
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    }
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  const activeTab = document.getElementById(`${tabName}-tab`);
  if (activeTab) {
    activeTab.classList.add('active');

    if (tabName === 'streaks') {
      // Refresh calendar when switching to streaks tab
      setTimeout(() => renderCalendar(), 100);
    }
  }
}

// Exercise Form
function initializeExerciseForm() {
  const addExerciseBtn = document.getElementById('addExerciseBtn');
  const workoutForm = document.getElementById('workoutForm');

  addExerciseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    addExerciseInput();
  });

  workoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitWorkout();
  });

  // Add initial exercise input
  addExerciseInput();

  // Mood selection
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      appState.selectedMood = btn.dataset.mood;
      document.getElementById('moodInput').value = appState.selectedMood;
    });
  });
}

function addExerciseInput() {
  const template = document.getElementById('exerciseTemplate');
  const clone = template.content.cloneNode(true);

  const removeBtn = clone.querySelector('.btn-remove');
  removeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.target.parentElement.remove();
  });

  const exercisesList = document.getElementById('exercisesList');
  exercisesList.appendChild(clone);
}

async function submitWorkout() {
  // Collect exercises
  const exercises = [];
  const exerciseItems = document.querySelectorAll('.exercise-item');

  for (const item of exerciseItems) {
    const name = item.querySelector('.exercise-name').value;
    const sets = item.querySelector('.exercise-sets').value;
    const reps = item.querySelector('.exercise-reps').value;
    const duration = item.querySelector('.exercise-duration').value;

    if (!name || !sets || !reps) {
      alert('Please fill in all required fields');
      return;
    }

    exercises.push({
      name,
      sets: parseInt(sets),
      reps: parseInt(reps),
      duration: duration ? parseInt(duration) : null,
    });
  }

  const notes = document.getElementById('notesInput').value;
  const mood = appState.selectedMood;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  try {
    const response = await fetch('/api/workouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: appState.userId,
        group_id: appState.groupId,
        exercises,
        mood,
        notes,
        timezone,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save workout');
    }

    const data = await response.json();

    // Reset form
    document.getElementById('exercisesList').innerHTML = '';
    document.getElementById('notesInput').value = '';
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    appState.selectedMood = null;

    // Add new exercise input
    addExerciseInput();

    // Show success message
    alert('Workout saved successfully!');

    // Send notification to Telegram
    if (tg.sendData) {
      tg.sendData(JSON.stringify({
        action: 'workout_logged',
        summary: `${exercises.length} exercises`,
      }));
    }
  } catch (error) {
    console.error('Error saving workout:', error);
    alert('Error saving workout. Please try again.');
  }
}

// Calendar
function initializeCalendar() {
  document.getElementById('prevMonthBtn').addEventListener('click', () => {
    appState.currentMonth = new Date(appState.currentMonth.getFullYear(), appState.currentMonth.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('nextMonthBtn').addEventListener('click', () => {
    appState.currentMonth = new Date(appState.currentMonth.getFullYear(), appState.currentMonth.getMonth() + 1);
    renderCalendar();
  });

  renderCalendar();
}

async function renderCalendar() {
  const year = appState.currentMonth.getFullYear();
  const month = appState.currentMonth.getMonth();

  // Update month display
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

  // Get workouts for this month
  let workouts = [];
  try {
    const response = await fetch(`/api/workouts/group/${appState.groupId}?month=${month + 1}&year=${year}`);
    if (response.ok) {
      workouts = await response.json();
    }
  } catch (error) {
    console.error('Error fetching workouts:', error);
  }

  // Create date map for quick lookup
  const dateMap = {};
  workouts.forEach(workout => {
    const date = new Date(workout.date).toDateString();
    if (!dateMap[date]) {
      dateMap[date] = [];
    }
    dateMap[date].push(workout);
  });

  // Generate calendar
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  let html = '<div class="calendar-header">';
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(day => {
    html += `<div class="calendar-header-day">${day}</div>`;
  });
  html += '</div><div class="calendar-grid">';

  let currentDate = new Date(startDate);
  for (let i = 0; i < 42; i++) {
    const isCurrentMonth = currentDate.getMonth() === month;
    const dateStr = currentDate.toDateString();
    const hasWorkout = dateMap[dateStr] && dateMap[dateStr].length > 0;

    let className = 'calendar-day';
    if (!isCurrentMonth) className += ' other-month';
    if (hasWorkout) className += ' has-workout';

    html += `<div class="${className}" data-date="${currentDate.toISOString().split('T')[0]}" data-has-workout="${hasWorkout}">
      ${currentDate.getDate()}
    </div>`;

    currentDate.setDate(currentDate.getDate() + 1);
  }
  html += '</div>';

  const calendarDiv = document.getElementById('calendar');
  calendarDiv.innerHTML = html;

  // Add click handlers to calendar days
  document.querySelectorAll('.calendar-day').forEach(day => {
    day.addEventListener('click', (e) => {
      const date = e.target.dataset.date;
      showDayDetails(date, dateMap);
    });
  });
}

async function showDayDetails(date, dateMap) {
  const dateStr = new Date(date).toDateString();
  const workouts = dateMap[dateStr] || [];

  const container = document.getElementById('dayDetailsContainer');
  const selectedDate = document.getElementById('selectedDate');
  const dayWorkoutsDiv = document.getElementById('dayWorkouts');

  selectedDate.textContent = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (workouts.length === 0) {
    dayWorkoutsDiv.innerHTML = '<p>No workouts logged for this date.</p>';
  } else {
    let html = '';
    for (const workout of workouts) {
      const userResponse = await fetch(`/api/users/${workout.user_id}`, { method: 'GET' }).catch(() => null);
      const username = userResponse ? (await userResponse.json()).username : 'Unknown';

      const exercises = JSON.parse(typeof workout.exercises === 'string' ? workout.exercises : JSON.stringify(workout.exercises));
      let exercisesHtml = exercises.map(ex =>
        `<div class="workout-exercise">• ${ex.name}: ${ex.sets} sets × ${ex.reps} reps${ex.duration ? ` (${ex.duration} min)` : ''}</div>`
      ).join('');

      html += `<div class="workout-card">
        <div class="workout-user">@${username}</div>
        ${exercisesHtml}
        ${workout.mood ? `<div class="workout-mood">${getMoodEmoji(workout.mood)}</div>` : ''}
        ${workout.notes ? `<div class="workout-exercise" style="margin-top: 8px; color: var(--text-secondary);"><em>"${workout.notes}"</em></div>` : ''}
      </div>`;
    }
    dayWorkoutsDiv.innerHTML = html;
  }

  container.style.display = 'block';
}

function getMoodEmoji(mood) {
  const moodMap = {
    terrible: '😫',
    bad: '😔',
    okay: '😐',
    good: '😊',
    amazing: '🔥',
  };
  return moodMap[mood] || mood;
}

function setupEventListeners() {
  // Additional event listeners can be added here
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
