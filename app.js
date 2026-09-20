/**
 * LIFEOS — Personal Life Operating System
 * Client-Side State Engine, Gamification Core, Personalized Routines & Work Reminders
 */

// 1. Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('LIFEOS Service Worker active:', reg.scope))
      .catch(err => console.warn('Service Worker registration failed:', err));
  });
}

// 2. In-App Toast Engine
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.1rem;">${type === 'reminder' ? '🔔' : type === 'success' ? '✓' : 'ℹ'}</span>
    <div style="flex: 1;">${message}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// 3. Audio Chime (Web Audio API Synthesizer)
function playChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Pleasant two-tone chime (587.33Hz D5 -> 880Hz A5)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.6);
  } catch (e) {
    // AudioContext blocked until user gesture
  }
}

// 4. Default Clean Seed State (No Random Fake Tasks!)
const DEFAULT_STATE = {
  user: {
    username: 'Jayanta',
    level: 1,
    current_xp: 0,
    lifetime_xp: 0,
    coins: 0,
    momentum_score: 0.50, // Starts at neutral 0.50
    deep_work_minutes_today: 0,
    attributes: {
      knowledge: 0,
      technical: 0,
      fitness: 0,
      communication: 0,
      creativity: 0,
      finance: 0,
      discipline: 0,
      social: 0
    }
  },
  // CLEAN SLATE: User adds their own tasks
  tasks: [],
  // Personalized Routines
  routines: [
    { id: 'r1', time: '06:30', title: 'Morning Hydration & Workout', area: 'Health', reminder: true, completedToday: false },
    { id: 'r2', time: '09:00', title: 'Deep Work: Core Engineering Block', area: 'Deep Work', reminder: true, completedToday: false },
    { id: 'r3', time: '14:00', title: 'Academic / Technical Studies', area: 'Academic', reminder: true, completedToday: false },
    { id: 'r4', time: '18:00', title: 'Skill Projects & Code Practice', area: 'Deep Work', reminder: true, completedToday: false },
    { id: 'r5', time: '21:30', title: 'Reading & Day Reflection', area: 'Reading', reminder: true, completedToday: false }
  ],
  // Core Starter Habits
  habits: [
    {
      id: 'h1',
      title: 'Daily Deep Work (At least 45 mins)',
      current_streak: 0,
      is_completed_today: false,
      xp_reward: 25,
      attribute: 'discipline'
    },
    {
      id: 'h2',
      title: 'Daily Technical Practice / Problem Solving',
      current_streak: 0,
      is_completed_today: false,
      xp_reward: 20,
      attribute: 'technical'
    }
  ],
  // Goals Lineage
  goals: [
    {
      id: 'g1',
      title: 'Become a High-Impact Software Engineer',
      area: 'Career',
      progress: 0,
      milestones: [
        {
          id: 'm1',
          title: 'Master Programming & Systems Fundamentals',
          completed: false,
          progress: 0,
          projects: [
            { id: 'p1', title: 'Algorithms & Data Structures', taskCount: 0, completedCount: 0 },
            { id: 'p2', title: 'Low-Level & Cloud Architecture', taskCount: 0, completedCount: 0 }
          ]
        }
      ]
    }
  ],
  // User-defined rewards store
  rewards: [
    { id: 'r1', title: 'Specialty Coffee at Café', cost: 30, redemptions: 0 },
    { id: 'r2', title: 'Guilt-Free 60m Gaming Session', cost: 50, redemptions: 0 },
    { id: 'r3', title: 'Weekend Movie Night', cost: 120, redemptions: 0 }
  ],
  remindersEnabled: false
};

// 5. App State Container
class StateManager {
  constructor() {
    const saved = localStorage.getItem('lifeos_state_v2');
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
    localStorage.setItem('lifeos_state_v2', JSON.stringify(this.data));
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.save();
  }

  // XP Formula: 150 * L^1.4 + 100
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
      playChime();
      showToast(`🎉 Level Up! You reached Level ${this.data.user.level}! (+25 bonus coins)`, 'success');
    }

    // Update momentum
    this.data.user.momentum_score = Math.min(1.0, +(this.data.user.momentum_score * 0.98 + 0.05).toFixed(3));
    this.save();
  }
}

const state = new StateManager();

// 6. UI Render Engines
function renderDashboard() {
  const user = state.data.user;
  const tasks = state.data.tasks;
  const habits = state.data.habits;
  const routines = state.data.routines || [];

  // Update date
  const now = new Date();
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  document.getElementById('currentDateDisplay').textContent = now.toLocaleDateString(undefined, options);

  // Sidebar mini telemetry
  const nextXp = state.getNextLevelXp(user.level);
  const xpPercent = Math.min(100, Math.round((user.current_xp / nextXp) * 100));
  document.getElementById('sideUserName').textContent = user.username;
  document.getElementById('sideLevelBadge').textContent = `LVL ${user.level}`;
  document.getElementById('sideXpFill').style.width = `${xpPercent}%`;
  document.getElementById('sideXpText').textContent = `${user.current_xp.toLocaleString()} / ${nextXp.toLocaleString()} XP`;
  document.getElementById('sideCoinText').textContent = `${user.coins} 🪙`;

  // Top header stats
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
  document.getElementById('statFocusTime').textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const completedHabits = habits.filter(h => h.is_completed_today).length;
  document.getElementById('statHabitRatio').textContent = `${completedHabits} / ${habits.length}`;

  // Task List Render
  const taskListEl = document.getElementById('todayTaskList');
  taskListEl.innerHTML = '';
  if (tasks.length === 0) {
    taskListEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <h3>Focus Queue is Ready</h3>
        <p>No tasks scheduled yet. Add your personalized high-priority tasks to begin today's execution.</p>
        <button class="btn btn-primary btn-sm" id="btnEmptyAddTask">+ Add Your First Task</button>
      </div>
    `;
    const btn = document.getElementById('btnEmptyAddTask');
    if (btn) btn.addEventListener('click', openQuickAddModal);
  } else {
    tasks.forEach(task => {
      const isDone = task.status === 'completed';
      const item = document.createElement('div');
      item.className = `task-item ${isDone ? 'completed' : ''}`;
      item.innerHTML = `
        <div class="task-left">
          <button class="checkbox-round" onclick="toggleTaskCompletion('${task.id}')" title="Check off task">
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
              ${task.reminderTime ? `<span>&bull;</span> <span style="color: #fbbf24;">🔔 ${task.reminderTime}</span>` : ''}
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="task-rewards">+${task.base_xp} XP</span>
          <button class="btn-icon danger" onclick="deleteTask('${task.id}')" title="Remove Task">&times;</button>
        </div>
      `;
      taskListEl.appendChild(item);
    });
  }

  // Habits List Render
  const habitListEl = document.getElementById('todayHabitList');
  habitListEl.innerHTML = '';
  if (habits.length === 0) {
    habitListEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px;">No habits configured. Click + Habit to create one.</div>`;
  } else {
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

  // Routine Timeline Render on Dashboard
  renderDashboardRoutines();
}

// 7. Personalized Routine Rendering
function renderDashboardRoutines() {
  const container = document.getElementById('dashboardRoutineList');
  if (!container) return;
  container.innerHTML = '';
  const routines = (state.data.routines || []).sort((a, b) => a.time.localeCompare(b.time));

  if (routines.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px;">
        No routine blocks configured yet. Click <strong>+ Add Block</strong> to organize your day.
      </div>
    `;
    return;
  }

  routines.forEach(item => {
    const row = document.createElement('div');
    row.className = `routine-row ${item.completedToday ? 'done' : ''}`;
    row.innerHTML = `
      <div class="routine-left">
        <button class="checkbox-round" onclick="toggleRoutineDone('${item.id}')" title="Check block done">
          ${item.completedToday ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
        </button>
        <span class="routine-time-badge">${item.time}</span>
        <span class="routine-title">${item.title}</span>
      </div>
      <div class="routine-actions">
        ${item.reminder ? '<span title="Reminder Active" style="font-size: 0.75rem; color: #fbbf24;">🔔</span>' : ''}
        <span class="badge badge-medium" style="font-size: 0.7rem;">${item.area}</span>
        <button class="btn-icon danger" onclick="deleteRoutine('${item.id}')" title="Delete block">&times;</button>
      </div>
    `;
    container.appendChild(row);
  });
}

function renderFullRoutineManager() {
  const container = document.getElementById('fullRoutineManagerList');
  if (!container) return;
  container.innerHTML = '';
  const routines = (state.data.routines || []).sort((a, b) => a.time.localeCompare(b.time));

  routines.forEach(item => {
    const row = document.createElement('div');
    row.className = `routine-row ${item.completedToday ? 'done' : ''}`;
    row.innerHTML = `
      <div class="routine-left">
        <button class="checkbox-round" onclick="toggleRoutineDone('${item.id}')">
          ${item.completedToday ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
        </button>
        <span class="routine-time-badge" style="font-size: 0.85rem;">${item.time}</span>
        <div>
          <div class="routine-title" style="font-size: 0.95rem;">${item.title}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${item.area} &bull; ${item.reminder ? '🔔 Notification Alert Active' : 'No notification'}</div>
        </div>
      </div>
      <div class="routine-actions">
        <button class="btn btn-secondary btn-sm" onclick="toggleRoutineReminder('${item.id}')">
          ${item.reminder ? 'Disable Alert' : 'Enable Alert'}
        </button>
        <button class="btn-icon danger" onclick="deleteRoutine('${item.id}')" title="Delete block">&times;</button>
      </div>
    `;
    container.appendChild(row);
  });
}

window.toggleRoutineDone = function(id) {
  const item = state.data.routines.find(r => r.id === id);
  if (!item) return;
  item.completedToday = !item.completedToday;
  if (item.completedToday) {
    state.addXpAndCoins(10, 1, 'discipline');
    playChime();
  }
  state.save();
  renderDashboardRoutines();
  renderFullRoutineManager();
};

window.toggleRoutineReminder = function(id) {
  const item = state.data.routines.find(r => r.id === id);
  if (!item) return;
  item.reminder = !item.reminder;
  state.save();
  renderFullRoutineManager();
  renderDashboardRoutines();
  showToast(item.reminder ? `Reminder enabled for ${item.title}` : `Reminder disabled for ${item.title}`);
};

window.deleteRoutine = function(id) {
  state.data.routines = state.data.routines.filter(r => r.id !== id);
  state.save();
  renderDashboardRoutines();
  renderFullRoutineManager();
};

// Toggle Task Completion
window.toggleTaskCompletion = function(taskId) {
  const task = state.data.tasks.find(t => t.id === taskId);
  if (!task) return;

  if (task.status === 'completed') {
    task.status = 'todo';
  } else {
    task.status = 'completed';
    const xp = task.base_xp;
    const coins = Math.max(1, Math.round(xp / 10));
    state.addXpAndCoins(xp, coins, task.primary_attribute);
    playChime();
    showToast(`Task Complete: +${xp} XP & +${coins} 🪙 earned!`, 'success');
  }
  state.save();
  renderDashboard();
  renderCharacterProfile();
};

window.deleteTask = function(taskId) {
  state.data.tasks = state.data.tasks.filter(t => t.id !== taskId);
  state.save();
  renderDashboard();
};

// Toggle Habit Check
window.toggleHabit = function(habitId) {
  const habit = state.data.habits.find(h => h.id === habitId);
  if (!habit) return;

  habit.is_completed_today = !habit.is_completed_today;
  if (habit.is_completed_today) {
    habit.current_streak += 1;
    state.addXpAndCoins(habit.xp_reward, 1, habit.attribute);
    playChime();
    showToast(`Habit Maintained: ${habit.title} (+${habit.xp_reward} XP)`, 'success');
  } else {
    habit.current_streak = Math.max(0, habit.current_streak - 1);
  }
  state.save();
  renderDashboard();
  renderHabitsView();
};

// 8. Quests Lineage Rendering
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

// 9. Habits View
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

// 10. Character Profile & 8-Axis Radar Chart
function renderCharacterProfile() {
  const user = state.data.user;
  const attrs = user.attributes;

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

  const momentumPercent = Math.round(user.momentum_score * 100);
  document.getElementById('charMomentumFill').style.width = `${momentumPercent}%`;

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
  const maxVal = Math.max(200, ...Object.values(attrs));

  // Concentric polygon grids
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

  // Draw axis spokes and labels
  for (let i = 0; i < totalAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();

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

  // Points
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

// 11. Reward Store
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
    showToast('Insufficient Coins! Complete focus blocks and tasks to earn coins.', 'reminder');
    return;
  }

  state.data.user.coins -= reward.cost;
  reward.redemptions += 1;
  state.save();
  playChime();
  showToast(`Reward unlocked: "${reward.title}" (🪙 -${reward.cost})`, 'success');
  renderRewardStore();
  renderDashboard();
};

// 12. Focus Timer
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
        playChime();
        showToast('🎯 Deep Work Block Complete! +35 Deep Work XP, +4 Coins added!', 'success');
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

// 13. Work Reminder Engine (Periodic Checks)
let lastNotifiedMinute = '';

function checkWorkReminders() {
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMins = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMins}`;

  if (currentTimeStr === lastNotifiedMinute) return; // Prevent duplicate alerts in the same minute

  // Check Routine Blocks with reminder enabled
  const matchingRoutines = (state.data.routines || []).filter(r => r.reminder && r.time === currentTimeStr);
  matchingRoutines.forEach(routine => {
    triggerWorkNotification(`Time for: ${routine.title} (${routine.area})`);
    lastNotifiedMinute = currentTimeStr;
  });

  // Check Tasks with reminderTime
  const matchingTasks = (state.data.tasks || []).filter(t => t.status !== 'completed' && t.reminderTime === currentTimeStr);
  matchingTasks.forEach(task => {
    triggerWorkNotification(`Work Reminder: ${task.title}`);
    lastNotifiedMinute = currentTimeStr;
  });
}

function triggerWorkNotification(alertText) {
  playChime();
  showToast(`🔔 ${alertText}`, 'reminder');

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('LIFEOS Work Alert', {
        body: alertText,
        icon: './icons/icon-192.png',
        badge: './icons/favicon.png'
      });
    } catch (e) {
      console.warn('System notification error:', e);
    }
  }
}

// Check every 25 seconds for reliable minute match
setInterval(checkWorkReminders, 25000);

// Reminder Permission Toggle Handler
const btnToggleReminders = document.getElementById('btnToggleReminders');
const reminderBtnText = document.getElementById('reminderBtnText');

async function setupReminderPermission() {
  if (!('Notification' in window)) {
    showToast('Notifications not supported on this browser.', 'reminder');
    return;
  }

  if (Notification.permission === 'granted') {
    showToast('Reminders are active! You will receive alerts for scheduled work.', 'success');
  } else {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      showToast('Notifications enabled! Reminders will chime on time.', 'success');
      playChime();
    } else {
      showToast('Notification permission was not granted.', 'reminder');
    }
  }
  updateReminderUi();
}

function updateReminderUi() {
  if ('Notification' in window && Notification.permission === 'granted') {
    reminderBtnText.textContent = 'Alerts: On ✓';
    btnToggleReminders.style.borderColor = 'var(--accent-success)';
  } else {
    reminderBtnText.textContent = 'Enable Alerts 🔔';
  }
}

btnToggleReminders.addEventListener('click', setupReminderPermission);
updateReminderUi();

// 14. In-Browser Installation Logic (PWA)
let deferredPrompt = null;
const btnInstallApp = document.getElementById('btnInstallApp');
const pwaInstallBanner = document.getElementById('pwaInstallBanner');
const btnBannerInstall = document.getElementById('btnBannerInstall');
const btnDismissBanner = document.getElementById('btnDismissBanner');
const installGuideModal = document.getElementById('installGuideModal');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Show prominent buttons
  if (btnInstallApp) btnInstallApp.style.display = 'inline-flex';
  if (pwaInstallBanner) pwaInstallBanner.style.display = 'flex';
});

async function triggerInstallFlow() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      showToast('Installing LIFEOS...', 'success');
    }
    deferredPrompt = null;
    if (btnInstallApp) btnInstallApp.style.display = 'none';
    if (pwaInstallBanner) pwaInstallBanner.style.display = 'none';
  } else {
    // Show instruction modal if already installed or on iOS/desktop where prompt isn't fired
    installGuideModal.classList.add('active');
  }
}

if (btnInstallApp) btnInstallApp.addEventListener('click', triggerInstallFlow);
if (btnBannerInstall) btnBannerInstall.addEventListener('click', triggerInstallFlow);
if (btnDismissBanner) btnDismissBanner.addEventListener('click', () => {
  pwaInstallBanner.style.display = 'none';
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  if (btnInstallApp) btnInstallApp.style.display = 'none';
  if (pwaInstallBanner) pwaInstallBanner.style.display = 'none';
  showToast('LIFEOS installed to your device successfully!', 'success');
});

// 15. Navigation Setup
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

      if (targetView === 'view-routine') renderFullRoutineManager();
      if (targetView === 'view-quests') renderQuestsTree();
      if (targetView === 'view-habits') renderHabitsView();
      if (targetView === 'view-character') renderCharacterProfile();
      if (targetView === 'view-rewards') renderRewardStore();
    });
  });
}

// 16. Modals & Forms
const quickAddModal = document.getElementById('quickAddModal');
const openQuickAddBtn = document.getElementById('openQuickAddBtn');
const btnOpenTaskModalDirect = document.getElementById('btnOpenTaskModalDirect');
const routineModal = document.getElementById('routineModal');
const btnOpenAddRoutineModal = document.getElementById('btnOpenAddRoutineModal');
const btnOpenAddRoutineModal2 = document.getElementById('btnOpenAddRoutineModal2');
const addHabitModal = document.getElementById('addHabitModal');
const openAddHabitBtn = document.getElementById('openAddHabitBtn');
const openAddHabitFullBtn = document.getElementById('openAddHabitFullBtn');
const addRewardModal = document.getElementById('addRewardModal');
const openAddRewardBtn = document.getElementById('openAddRewardBtn');

function openQuickAddModal() {
  quickAddModal.classList.add('active');
  document.getElementById('taskTitleInput').focus();
}

openQuickAddBtn.addEventListener('click', openQuickAddModal);
if (btnOpenTaskModalDirect) btnOpenTaskModalDirect.addEventListener('click', openQuickAddModal);

function openRoutineModal() {
  routineModal.classList.add('active');
  document.getElementById('routineTitleInput').focus();
}

if (btnOpenAddRoutineModal) btnOpenAddRoutineModal.addEventListener('click', openRoutineModal);
if (btnOpenAddRoutineModal2) btnOpenAddRoutineModal2.addEventListener('click', openRoutineModal);

if (openAddHabitBtn) openAddHabitBtn.addEventListener('click', () => addHabitModal.classList.add('active'));
if (openAddHabitFullBtn) openAddHabitFullBtn.addEventListener('click', () => addHabitModal.classList.add('active'));
if (openAddRewardBtn) openAddRewardBtn.addEventListener('click', () => addRewardModal.classList.add('active'));

document.querySelectorAll('.closeModalBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
  });
});

// Quick Add Task Form Submit
document.getElementById('quickAddForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('taskTitleInput').value.trim();
  const difficulty = document.getElementById('taskDifficultyInput').value;
  const duration = parseInt(document.getElementById('taskDurationInput').value) || 30;
  const attribute = document.getElementById('taskAttributeInput').value;
  const reminderTime = document.getElementById('taskReminderTimeInput').value;

  const xpMap = { easy: 15, medium: 35, hard: 70, epic: 150 };
  const newTask = {
    id: 't_' + Date.now(),
    title: title,
    difficulty: difficulty,
    estimated_minutes: duration,
    base_xp: xpMap[difficulty] || 25,
    primary_attribute: attribute,
    reminderTime: reminderTime || null,
    status: 'todo'
  };

  state.data.tasks.unshift(newTask);
  state.save();

  quickAddModal.classList.remove('active');
  document.getElementById('taskTitleInput').value = '';
  document.getElementById('taskReminderTimeInput').value = '';
  showToast(`Task added to focus queue: "${title}"`, 'success');
  renderDashboard();
});

// Routine Block Form Submit
document.getElementById('routineForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const time = document.getElementById('routineTimeInput').value;
  const title = document.getElementById('routineTitleInput').value.trim();
  const area = document.getElementById('routineAreaInput').value;
  const reminder = document.getElementById('routineReminderCheckbox').checked;

  state.data.routines.push({
    id: 'r_' + Date.now(),
    time: time,
    title: title,
    area: area,
    reminder: reminder,
    completedToday: false
  });
  state.save();

  routineModal.classList.remove('active');
  document.getElementById('routineTitleInput').value = '';
  showToast(`Added routine block at ${time}: "${title}"`, 'success');
  renderDashboardRoutines();
  renderFullRoutineManager();
});

// Add Habit Form Submit
document.getElementById('addHabitForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('habitTitleInput').value.trim();
  const attribute = document.getElementById('habitAttributeInput').value;
  const xp = parseInt(document.getElementById('habitXpInput').value) || 15;

  state.data.habits.push({
    id: 'h_' + Date.now(),
    title: title,
    current_streak: 0,
    is_completed_today: false,
    xp_reward: xp,
    attribute: attribute
  });
  state.save();

  addHabitModal.classList.remove('active');
  document.getElementById('habitTitleInput').value = '';
  showToast(`Habit created: "${title}"`, 'success');
  renderDashboard();
  renderHabitsView();
});

// Add Reward Form Submit
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
  showToast(`Custom reward added to shop!`, 'success');
  renderRewardStore();
});

// 17. Data Export / Import
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
      if (imported.user) {
        state.data = imported;
        state.save();
        showToast('Data imported successfully!', 'success');
        window.location.reload();
      } else {
        showToast('Invalid LIFEOS backup file format.', 'reminder');
      }
    } catch (err) {
      showToast('Error reading backup file.', 'reminder');
    }
  };
  reader.readAsText(file);
});

document.getElementById('btnResetData').addEventListener('click', () => {
  if (confirm('Clean reset LIFEOS to a fresh personalized slate?')) {
    state.reset();
    window.location.reload();
  }
});

// Weekly review lock
document.getElementById('btnLockWeeklyReview').addEventListener('click', () => {
  state.addXpAndCoins(100, 10, 'discipline');
  playChime();
  showToast('✨ Weekly Review locked in! +100 Discipline XP & +10 Coins awarded.', 'success');
  renderDashboard();
});

// Global hotkeys ('q' or 'c')
window.addEventListener('keydown', (e) => {
  if ((e.key === 'q' || e.key === 'c') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    openQuickAddModal();
  }
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
  }
});

// Initial Render
setupNavigation();
renderDashboard();
