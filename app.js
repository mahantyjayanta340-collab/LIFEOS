/**
 * LIFEOS — Personal Life Operating System
 * Client-Side State Engine, Gamification Core & Telemetry
 */

// 1. Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('LIFEOS Service Worker active:', reg.scope))
      .catch(err => console.warn('Service Worker registration failed:', err));
  });
}

// 2. Default Seed State
const DEFAULT_STATE = {
  user: {
    username: 'Jayanta',
    level: 12,
    current_xp: 1420,
    lifetime_xp: 18450,
    coins: 485,
    momentum_score: 0.84, // 0.0 to 1.0
    deep_work_minutes_today: 150,
    attributes: {
      knowledge: 480,
      technical: 920,
      fitness: 410,
      communication: 280,
      creativity: 340,
      finance: 220,
      discipline: 650,
      social: 190
    }
  },
  tasks: [
    {
      id: 't1',
      title: 'Engineering Mathematics — Problem Set 3',
      project_id: 'p2',
      projectName: 'C & Math Fundamentals',
      difficulty: 'hard',
      estimated_minutes: 90,
      base_xp: 40,
      primary_attribute: 'technical',
      status: 'completed'
    },
    {
      id: 't2',
      title: 'C Programming — Dynamic Memory & Pointers',
      project_id: 'p2',
      projectName: 'C & Math Fundamentals',
      difficulty: 'medium',
      estimated_minutes: 60,
      base_xp: 35,
      primary_attribute: 'technical',
      status: 'completed'
    },
    {
      id: 't3',
      title: 'Running — 3 km Cadence Run',
      project_id: 'p3',
      projectName: 'Health Baseline',
      difficulty: 'medium',
      estimated_minutes: 30,
      base_xp: 25,
      primary_attribute: 'fitness',
      status: 'completed'
    },
    {
      id: 't4',
      title: 'Reading — Modern Operating Systems (20 mins)',
      project_id: 'p1',
      projectName: 'DSA Foundation',
      difficulty: 'easy',
      estimated_minutes: 20,
      base_xp: 15,
      primary_attribute: 'knowledge',
      status: 'todo'
    }
  ],
  habits: [
    {
      id: 'h1',
      title: 'Hydrate 2L Daily',
      current_streak: 14,
      is_completed_today: true,
      xp_reward: 10,
      attribute: 'fitness'
    },
    {
      id: 'h2',
      title: 'DSA Practice (1 LeetCode Problem)',
      current_streak: 6,
      is_completed_today: false,
      xp_reward: 25,
      attribute: 'technical'
    },
    {
      id: 'h3',
      title: 'Daily Technical Journal / Log',
      current_streak: 9,
      is_completed_today: true,
      xp_reward: 15,
      attribute: 'discipline'
    }
  ],
  goals: [
    {
      id: 'g1',
      title: 'Become a High-Impact Software Engineer',
      area: 'Career & Tech',
      progress: 68,
      milestones: [
        {
          id: 'm1',
          title: 'Master CS Fundamentals & Algorithms',
          completed: false,
          progress: 75,
          projects: [
            { id: 'p1', title: 'DSA Foundation & Problem Sets', taskCount: 8, completedCount: 6 },
            { id: 'p2', title: 'C Systems & Memory Architecture', taskCount: 6, completedCount: 5 }
          ]
        },
        {
          id: 'm2',
          title: 'Build & Ship 2 Production Systems',
          completed: false,
          progress: 50,
          projects: [
            { id: 'p4', title: 'CampusRide Distributed Backend', taskCount: 5, completedCount: 2 }
          ]
        }
      ]
    },
    {
      id: 'g2',
      title: 'Physical Health & High Stamina Baseline',
      area: 'Fitness',
      progress: 60,
      milestones: [
        {
          id: 'm3',
          title: 'Consistent 5km Under 25 Mins',
          completed: false,
          progress: 60,
          projects: [
            { id: 'p3', title: 'Weekly Cadence Running', taskCount: 4, completedCount: 3 }
          ]
        }
      ]
    }
  ],
  rewards: [
    { id: 'r1', title: 'Specialty Roast Coffee at Café', cost: 30, redemptions: 4 },
    { id: 'r2', title: 'Guilt-Free 60m Gaming Session', cost: 50, redemptions: 8 },
    { id: 'r3', title: 'Weekend Movie Night with Friends', cost: 120, redemptions: 2 },
    { id: 'r4', title: 'New Mechanical Keyboard Keycaps / Desk Mod', cost: 650, redemptions: 0 },
    { id: 'r5', title: 'Physical CS Classic Book Purchase', cost: 350, redemptions: 1 }
  ]
};

// 3. App State Container
class StateManager {
  constructor() {
    const saved = localStorage.getItem('lifeos_state_v1');
    if (saved) {
      try {
        this.data = JSON.parse(saved);
      } catch (e) {
        this.data = DEFAULT_STATE;
      }
    } else {
      this.data = DEFAULT_STATE;
      this.save();
    }
  }

  save() {
    localStorage.setItem('lifeos_state_v1', JSON.stringify(this.data));
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.save();
  }

  // Level Progression: XP = 150 * L^1.4 + 100
  getNextLevelXp(level) {
    return Math.round(150 * Math.pow(level, 1.4) + 100);
  }

  addXpAndCoins(xp, coins, attribute) {
    this.data.user.current_xp += xp;
    this.data.user.lifetime_xp += xp;
    this.data.user.coins += coins;

    if (attribute && this.data.user.attributes[attribute] !== undefined) {
      this.data.user.attributes[attribute] += xp;
    }

    // Level check
    let required = this.getNextLevelXp(this.data.user.level);
    while (this.data.user.current_xp >= required) {
      this.data.user.current_xp -= required;
      this.data.user.level += 1;
      required = this.getNextLevelXp(this.data.user.level);
      this.data.user.coins += 25; // Bonus coins on level up
      alert(`🎉 Level Up! You have reached Level ${this.data.user.level}! (+25 bonus coins granted)`);
    }

    // Momentum increment
    this.data.user.momentum_score = Math.min(1.0, +(this.data.user.momentum_score * 0.98 + 0.05).toFixed(3));
    this.save();
  }
}

const state = new StateManager();

// 4. UI Render Engines
function renderDashboard() {
  const user = state.data.user;
  const tasks = state.data.tasks;
  const habits = state.data.habits;

  // Sidebar mini telemetry
  const nextXp = state.getNextLevelXp(user.level);
  const xpPercent = Math.min(100, Math.round((user.current_xp / nextXp) * 100));
  document.getElementById('sideUserName').textContent = user.username;
  document.getElementById('sideLevelBadge').textContent = `LVL ${user.level}`;
  document.getElementById('sideXpFill').style.width = `${xpPercent}%`;
  document.getElementById('sideXpText').textContent = `${user.current_xp.toLocaleString()} / ${nextXp.toLocaleString()} XP`;
  document.getElementById('sideCoinText').textContent = `${user.coins} 🪙`;

  // Top header stat pills
  const momentumPercent = Math.round(user.momentum_score * 100);
  document.getElementById('topMomentumVal').textContent = `${momentumPercent}%`;
  document.getElementById('topCoinsVal').textContent = user.coins;

  // Daily Progress Hero
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const dailyProgressRatio = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  document.getElementById('dailyHeroPercent').textContent = `${dailyProgressRatio}% Done`;
  document.getElementById('dailyProgressFill').style.width = `${dailyProgressRatio}%`;
  document.getElementById('statCompletedRatio').textContent = `${completedTasks} / ${totalTasks}`;
  
  const hours = Math.floor(user.deep_work_minutes_today / 60);
  const mins = user.deep_work_minutes_today % 60;
  document.getElementById('statFocusTime').textContent = `${hours}h ${mins}m`;

  const completedHabits = habits.filter(h => h.is_completed_today).length;
  document.getElementById('statHabitRatio').textContent = `${completedHabits} / ${habits.length}`;

  // Task List
  const taskListEl = document.getElementById('todayTaskList');
  taskListEl.innerHTML = '';
  if (tasks.length === 0) {
    taskListEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 24px;">No tasks queued. Quick Add one!</div>`;
  } else {
    tasks.forEach(task => {
      const isDone = task.status === 'completed';
      const item = document.createElement('div');
      item.className = `task-item ${isDone ? 'completed' : ''}`;
      item.innerHTML = `
        <div class="task-left">
          <button class="checkbox-round" onclick="toggleTaskCompletion('${task.id}')">
            ${isDone ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
          </button>
          <div class="task-info">
            <span class="task-title">${task.title}</span>
            <div class="task-meta">
              <span class="badge badge-${task.difficulty}">${task.difficulty.toUpperCase()}</span>
              <span>&bull;</span>
              <span>~${task.estimated_minutes} min</span>
              <span>&bull;</span>
              <span style="color: var(--accent-primary);">#${task.primary_attribute}</span>
            </div>
          </div>
        </div>
        <div class="task-rewards">
          +${task.base_xp} XP
        </div>
      `;
      taskListEl.appendChild(item);
    });
  }

  // Habits List
  const habitListEl = document.getElementById('todayHabitList');
  habitListEl.innerHTML = '';
  habits.forEach(habit => {
    const isDone = habit.is_completed_today;
    const item = document.createElement('div');
    item.className = 'habit-item';
    item.innerHTML = `
      <div class="habit-details">
        <span class="habit-title">${habit.title}</span>
        <div class="streak-counter">
          <span>🔥</span>
          <span>${habit.current_streak} Day Streak</span>
          <span>&bull;</span>
          <span style="color: var(--accent-primary);">+${habit.xp_reward} XP</span>
        </div>
      </div>
      <button class="btn btn-sm ${isDone ? 'btn-success' : 'btn-secondary'}" onclick="toggleHabit('${habit.id}')">
        ${isDone ? 'Done ✓' : 'Check'}
      </button>
    `;
    habitListEl.appendChild(item);
  });
}

// Toggle Task Completion
window.toggleTaskCompletion = function(taskId) {
  const task = state.data.tasks.find(t => t.id === taskId);
  if (!task) return;

  if (task.status === 'completed') {
    task.status = 'todo';
  } else {
    task.status = 'completed';
    // Calculate rewards
    const xp = task.base_xp;
    const coins = Math.max(1, Math.round(xp / 10));
    state.addXpAndCoins(xp, coins, task.primary_attribute);
  }
  state.save();
  renderDashboard();
  renderCharacterProfile();
};

// Toggle Habit Check
window.toggleHabit = function(habitId) {
  const habit = state.data.habits.find(h => h.id === habitId);
  if (!habit) return;

  habit.is_completed_today = !habit.is_completed_today;
  if (habit.is_completed_today) {
    habit.current_streak += 1;
    state.addXpAndCoins(habit.xp_reward, 1, habit.attribute);
  } else {
    habit.current_streak = Math.max(0, habit.current_streak - 1);
  }
  state.save();
  renderDashboard();
  renderHabitsView();
};

// 5. Render Quests (Lineage Tree)
function renderQuestsTree() {
  const container = document.getElementById('questLineageTree');
  container.innerHTML = '';

  state.data.goals.forEach(goal => {
    const goalNode = document.createElement('div');
    goalNode.className = 'tree-node';
    goalNode.innerHTML = `
      <div class="tree-header">
        <div class="tree-title-group">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <strong>${goal.title}</strong>
          <span class="badge badge-medium">${goal.area}</span>
        </div>
        <span class="badge badge-epic">${goal.progress}% Achieved</span>
      </div>
      <div class="tree-children">
        ${goal.milestones.map(m => `
          <div style="background: var(--bg-elevated); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: 600; margin-bottom: 6px;">
              <span>🚩 Milestone: ${m.title}</span>
              <span style="color: var(--accent-success);">${m.progress}%</span>
            </div>
            <div class="progress-bar-bg" style="height: 4px; margin-bottom: 8px;">
              <div class="progress-bar-fill" style="width: ${m.progress}%;"></div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; padding-left: 12px;">
              ${m.projects.map(p => `
                <div style="font-size: 0.82rem; color: var(--text-secondary); display: flex; justify-content: space-between;">
                  <span>📂 Project: ${p.title}</span>
                  <span>${p.completedCount}/${p.taskCount} tasks</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(goalNode);
  });
}

// 6. Render Habits View
function renderHabitsView() {
  const container = document.getElementById('fullHabitManagerList');
  container.innerHTML = '';

  state.data.habits.forEach(habit => {
    const item = document.createElement('div');
    item.className = 'habit-item';
    item.innerHTML = `
      <div class="habit-details">
        <span class="habit-title" style="font-size: 1rem;">${habit.title}</span>
        <div class="streak-counter">
          <span>🔥 Current Streak: ${habit.current_streak} days</span>
          <span>&bull;</span>
          <span>Attribute: #${habit.attribute}</span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="badge badge-easy">+${habit.xp_reward} XP</span>
        <button class="btn btn-sm ${habit.is_completed_today ? 'btn-success' : 'btn-secondary'}" onclick="toggleHabit('${habit.id}')">
          ${habit.is_completed_today ? 'Completed Today ✓' : 'Mark Done'}
        </button>
      </div>
    `;
    container.appendChild(item);
  });
}

// 7. Character Profile & 8-Axis Radar Chart
function renderCharacterProfile() {
  const user = state.data.user;
  const attrs = user.attributes;

  // Render cards
  const grid = document.getElementById('attributeCardsGrid');
  grid.innerHTML = '';
  Object.keys(attrs).forEach(key => {
    const card = document.createElement('div');
    card.className = 'attr-card';
    card.innerHTML = `
      <span class="attr-name">${key}</span>
      <span class="attr-val">${attrs[key]} XP</span>
    `;
    grid.appendChild(card);
  });

  // Momentum meter
  const momentumPercent = Math.round(user.momentum_score * 100);
  document.getElementById('charMomentumFill').style.width = `${momentumPercent}%`;

  // Draw 8-Axis Radar Chart on Canvas
  drawRadarChart(attrs);
}

function drawRadarChart(attrs) {
  const canvas = document.getElementById('attributeRadar');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = w * 0.38;

  ctx.clearRect(0, 0, w, h);

  const keys = Object.keys(attrs);
  const totalAxes = keys.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Max scale calculation
  const maxVal = Math.max(1000, ...Object.values(attrs));

  // Draw concentric polygonal grid
  const levels = 4;
  ctx.strokeStyle = '#1e2235';
  ctx.lineWidth = 1;

  for (let l = 1; l <= levels; l++) {
    const r = (radius / levels) * l;
    ctx.beginPath();
    for (let i = 0; i < totalAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Draw axis spokes
  for (let i = 0; i < totalAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Axis Labels
    const labelX = cx + (radius + 20) * Math.cos(angle);
    const labelY = cy + (radius + 20) * Math.sin(angle);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(keys[i].toUpperCase(), labelX, labelY);
  }

  // Draw Data Polygon
  ctx.beginPath();
  for (let i = 0; i < totalAxes; i++) {
    const val = attrs[keys[i]];
    const r = (val / maxVal) * radius;
    const angle = i * angleStep - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
  ctx.fill();
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Highlight points
  for (let i = 0; i < totalAxes; i++) {
    const val = attrs[keys[i]];
    const r = (val / maxVal) * radius;
    const angle = i * angleStep - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#818cf8';
    ctx.fill();
  }
}

// 8. Reward Store Render & Redemption
function renderRewardStore() {
  const container = document.getElementById('rewardStoreGrid');
  container.innerHTML = '';

  state.data.rewards.forEach(reward => {
    const canAfford = state.data.user.coins >= reward.cost;
    const card = document.createElement('div');
    card.className = 'reward-card';
    card.innerHTML = `
      <div>
        <div class="reward-title">${reward.title}</div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
          Redeemed ${reward.redemptions} times
        </div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div class="reward-cost">🪙 ${reward.cost}</div>
        <button class="btn btn-sm ${canAfford ? 'btn-primary' : 'btn-secondary'}" 
          ${canAfford ? '' : 'disabled style="opacity: 0.5;"'} 
          onclick="redeemReward('${reward.id}')">
          Redeem
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

window.redeemReward = function(rewardId) {
  const reward = state.data.rewards.find(r => r.id === rewardId);
  if (!reward) return;

  if (state.data.user.coins < reward.cost) {
    alert('Insufficient Coins! Complete deep work tasks to earn more.');
    return;
  }

  state.data.user.coins -= reward.cost;
  reward.redemptions += 1;
  state.save();
  alert(`Enjoy your reward: "${reward.title}"! 🪙 ${reward.cost} coins deducted.`);
  renderRewardStore();
  renderDashboard();
};

// 9. Focus Timer Implementation
let timerInterval = null;
let timerSeconds = 25 * 60;
let isTimerRunning = false;

const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');

function updateTimerDisplay() {
  const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const secs = String(timerSeconds % 60).padStart(2, '0');
  timerDisplay.textContent = `${mins}:${secs}`;
}

startTimerBtn.addEventListener('click', () => {
  if (isTimerRunning) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    startTimerBtn.textContent = 'Resume';
    startTimerBtn.classList.remove('btn-success');
    startTimerBtn.classList.add('btn-primary');
  } else {
    isTimerRunning = true;
    startTimerBtn.textContent = 'Pause Focus';
    startTimerBtn.classList.remove('btn-primary');
    startTimerBtn.classList.add('btn-success');
    
    timerInterval = setInterval(() => {
      if (timerSeconds > 0) {
        timerSeconds--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        alert('🎯 Deep Work Block Complete! +35 Deep Work XP, +4 Coins added!');
        state.data.user.deep_work_minutes_today += 25;
        state.addXpAndCoins(35, 4, 'discipline');
        renderDashboard();
        resetTimer();
      }
    }, 1000);
  }
});

function resetTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timerSeconds = 25 * 60;
  updateTimerDisplay();
  startTimerBtn.textContent = 'Start Focus Block';
  startTimerBtn.classList.remove('btn-success');
  startTimerBtn.classList.add('btn-primary');
}

resetTimerBtn.addEventListener('click', resetTimer);

// Energy Chips
document.querySelectorAll('.energy-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.energy-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });
});

// Friction Chips in Review
document.querySelectorAll('.friction-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('selected');
  });
});

document.getElementById('btnLockWeeklyReview').addEventListener('click', () => {
  state.addXpAndCoins(100, 10, 'discipline');
  alert('✨ Weekly Review locked in! +100 Discipline XP and +10 Coins awarded.');
  renderDashboard();
});

// 10. Navigation Tabs
function setupNavigation() {
  const navItems = document.querySelectorAll('[data-view]');
  const views = document.querySelectorAll('.view-content');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.getAttribute('data-view');
      
      navItems.forEach(i => i.classList.remove('active'));
      document.querySelectorAll(`[data-view="${targetView}"]`).forEach(i => i.classList.add('active'));

      views.forEach(v => v.classList.remove('active'));
      const activeViewEl = document.getElementById(targetView);
      if (activeViewEl) activeViewEl.classList.add('active');

      if (targetView === 'view-quests') renderQuestsTree();
      if (targetView === 'view-habits') renderHabitsView();
      if (targetView === 'view-character') renderCharacterProfile();
      if (targetView === 'view-rewards') renderRewardStore();
    });
  });
}

// 11. Modal Setup
const quickAddModal = document.getElementById('quickAddModal');
const openQuickAddBtn = document.getElementById('openQuickAddBtn');
const addRewardModal = document.getElementById('addRewardModal');
const openAddRewardBtn = document.getElementById('openAddRewardBtn');

openQuickAddBtn.addEventListener('click', () => quickAddModal.classList.add('active'));
if (openAddRewardBtn) openAddRewardBtn.addEventListener('click', () => addRewardModal.classList.add('active'));

document.querySelectorAll('.closeModalBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
  });
});

// Form Submissions
document.getElementById('quickAddForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('taskTitleInput').value.trim();
  const difficulty = document.getElementById('taskDifficultyInput').value;
  const duration = parseInt(document.getElementById('taskDurationInput').value) || 30;
  const attribute = document.getElementById('taskAttributeInput').value;

  const xpMap = { easy: 15, medium: 35, hard: 70, epic: 150 };
  const newTask = {
    id: 't_' + Date.now(),
    title: title,
    project_id: 'p1',
    projectName: 'General Execution',
    difficulty: difficulty,
    estimated_minutes: duration,
    base_xp: xpMap[difficulty] || 25,
    primary_attribute: attribute,
    status: 'todo'
  };

  state.data.tasks.unshift(newTask);
  state.save();

  quickAddModal.classList.remove('active');
  document.getElementById('taskTitleInput').value = '';
  renderDashboard();
});

document.getElementById('addRewardForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('rewardTitleInput').value.trim();
  const cost = parseInt(document.getElementById('rewardCostInput').value) || 20;

  state.data.rewards.unshift({
    id: 'r_' + Date.now(),
    title: title,
    cost: cost,
    redemptions: 0
  });
  state.save();
  addRewardModal.classList.remove('active');
  document.getElementById('rewardTitleInput').value = '';
  renderRewardStore();
});

// 12. Data Export / Import
document.getElementById('btnExportData').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lifeos-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

const importFileInput = document.getElementById('importFileInput');
document.getElementById('btnImportData').addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (imported.user && imported.tasks) {
        state.data = imported;
        state.save();
        alert('Data imported successfully!');
        window.location.reload();
      } else {
        alert('Invalid LIFEOS backup format.');
      }
    } catch (err) {
      alert('Error parsing JSON backup file.');
    }
  };
  reader.readAsText(file);
});

document.getElementById('btnResetData').addEventListener('click', () => {
  if (confirm('Reset all LIFEOS data to demo seed state?')) {
    state.reset();
    window.location.reload();
  }
});

// Hotkey: Press 'q' or 'c' to Quick Add
window.addEventListener('keydown', (e) => {
  if ((e.key === 'q' || e.key === 'c') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    quickAddModal.classList.add('active');
    document.getElementById('taskTitleInput').focus();
  }
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
  }
});

// Initial boot
setupNavigation();
renderDashboard();
