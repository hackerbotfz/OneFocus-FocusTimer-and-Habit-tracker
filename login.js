class PomodoroTimer {
    constructor() {
        // defaults (in seconds)
        this.workDuration = 25 * 60;
        this.breakDuration = 5 * 60;

        // override from saved settings if available
        this.loadSettings();

        this.timeRemaining = this.workDuration;
        this.isRunning = false;
        this.isWorkSession = true;
        this.sessionCount = 0;
        this.interval = null;

        this.initElements();
        this.initEventListeners();
        this.updateSessionType();
        this.updateDisplay();
        this.initProgressRing();
    }

    initElements() {
        this.timerDisplay = document.getElementById('timer');
        this.sessionTypeDisplay = document.getElementById('sessionType');
        this.sessionCountDisplay = document.getElementById('sessionCount');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.progressCircle = document.querySelector('.progress-ring-circle');

        // settings UI
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsOverlay = document.getElementById('settingsOverlay');
        this.workDurationInput = document.getElementById('workDurationInput');
        this.breakDurationInput = document.getElementById('breakDurationInput');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        this.cancelSettingsBtn = document.getElementById('cancelSettings');
        this.closeSettingsBtn = document.getElementById('closeSettings');
    }

    initProgressRing() {
        const radius = this.progressCircle.r.baseVal.value;
        this.circumference = radius * 2 * Math.PI;
        this.progressCircle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        this.progressCircle.style.strokeDashoffset = 0;
    }

    setProgress(percent) {
        if (!isFinite(percent) || percent < 0) percent = 0;
        if (percent > 100) percent = 100;
        const offset = this.circumference - (percent / 100 * this.circumference);
        this.progressCircle.style.strokeDashoffset = offset;
    }

    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());

        // settings handlers
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.cancelSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());

        // overlay click to close
        this.settingsOverlay.addEventListener('click', (e) => {
            if (e.target === this.settingsOverlay) this.closeSettings();
        });

        // keyboard shortcuts but only when not typing in inputs
        document.addEventListener('keydown', (e) => {
            // don't intercept if user is typing in an input, textarea, select, or contenteditable
            if (this.isUserTyping()) return;

            if (e.code === 'Space') {
                // only when not typing
                e.preventDefault();
                if (this.isRunning) {
                    this.pause();
                } else {
                    this.start();
                }
            } else if (e.code === 'KeyR') {
                e.preventDefault();
                this.reset();
            }
        });
    }

    isUserTyping() {
        const el = document.activeElement;
        if (!el) return false;
        const tag = el.tagName ? el.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
        if (el.isContentEditable) return true;
        return false;
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;

            // if interval already exists clear to avoid duplicates
            if (this.interval) clearInterval(this.interval);

            this.interval = setInterval(() => {
                this.timeRemaining--;
                if (this.timeRemaining < 0) this.timeRemaining = 0;
                this.updateDisplay();

                if (this.timeRemaining <= 0) {
                    this.completeSession();
                }
            }, 1000);
        }
    }

    pause() {
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        clearInterval(this.interval);
        this.interval = null;
    }

    reset() {
        this.pause();
        this.timeRemaining = this.isWorkSession ? this.workDuration : this.breakDuration;
        this.updateDisplay();
    }

    completeSession() {
        this.pause();
        this.playSound();

        if (this.isWorkSession) {
            this.sessionCount++;
            this.sessionCountDisplay.textContent = this.sessionCount;
        }

        this.isWorkSession = !this.isWorkSession;
        this.timeRemaining = this.isWorkSession ? this.workDuration : this.breakDuration;
        this.updateSessionType();
        this.updateDisplay();
    }

    updateSessionType() {
        if (this.isWorkSession) {
            this.sessionTypeDisplay.textContent = 'Work Session';
            this.progressCircle.style.stroke = '#4CAF50';
        } else {
            this.sessionTypeDisplay.textContent = 'Break Time';
            this.progressCircle.style.stroke = '#2196F3';
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const totalDuration = this.isWorkSession ? this.workDuration : this.breakDuration;
        let progress = 0;
        if (totalDuration > 0) {
            progress = ((totalDuration - this.timeRemaining) / totalDuration) * 100;
        }
        this.setProgress(progress);
    }

    playSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (err) {
            // audio context might be blocked by browser autoplay policies; ignore silently
            console.warn('Sound play failed:', err);
        }
    }

    /* ---------- Settings (localStorage) ---------- */

    settingsStorageKey() {
        return 'focusflow-settings';
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem(this.settingsStorageKey());
            if (!saved) return;
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed.workMinutes === 'number' && typeof parsed.breakMinutes === 'number') {
                // convert minutes to seconds; ensure >0
                const w = Math.max(1, Math.floor(parsed.workMinutes));
                const b = Math.max(1, Math.floor(parsed.breakMinutes));
                this.workDuration = w * 60;
                this.breakDuration = b * 60;
            }
        } catch (err) {
            console.warn('Failed to load settings:', err);
        }
    }

    openSettings() {
        // populate inputs with current values in minutes
        this.workDurationInput.value = Math.round(this.workDuration / 60);
        this.breakDurationInput.value = Math.round(this.breakDuration / 60);

        this.settingsOverlay.classList.remove('hidden');
        this.settingsOverlay.setAttribute('aria-hidden', 'false');

        // set focus to first input so typing doesn't accidentally trigger shortcuts
        setTimeout(() => {
            this.workDurationInput.focus();
            this.workDurationInput.select();
        }, 50);
    }

    closeSettings() {
        this.settingsOverlay.classList.add('hidden');
        this.settingsOverlay.setAttribute('aria-hidden', 'true');
        // return focus to settings button
        this.settingsBtn.focus();
    }

    saveSettings() {
        // read and validate values (in minutes)
        let w = parseInt(this.workDurationInput.value, 10);
        let b = parseInt(this.breakDurationInput.value, 10);

        if (Number.isNaN(w) || w < 1) w = 25;
        if (Number.isNaN(b) || b < 1) b = 5;

        // save to localStorage
        const toSave = {
            workMinutes: w,
            breakMinutes: b
        };

        try {
            localStorage.setItem(this.settingsStorageKey(), JSON.stringify(toSave));
        } catch (err) {
            console.warn('Failed to save settings:', err);
        }

        // apply to timer (in seconds)
        this.workDuration = w * 60;
        this.breakDuration = b * 60;

        // If timer is not running, update the visible remaining time to the newly selected duration for current session type.
        if (!this.isRunning) {
            this.timeRemaining = this.isWorkSession ? this.workDuration : this.breakDuration;
        }

        this.updateSessionType();
        this.updateDisplay();
        this.closeSettings();
    }
}

class HabitTracker {
    constructor() {
        this.habits = this.loadHabits();
        this.initElements();
        this.initEventListeners();
        this.render();
    }

    initElements() {
        this.habitInput = document.getElementById('habitInput');
        this.addHabitBtn = document.getElementById('addHabitBtn');
        this.habitsList = document.getElementById('habitsList');
        this.emptyState = document.getElementById('emptyState');
    }

    initEventListeners() {
        this.addHabitBtn.addEventListener('click', () => this.addHabit());
        this.habitInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addHabit();
            }
        });
    }

    loadHabits() {
        const saved = localStorage.getItem('focusflow-habits');
        if (saved) {
            const habits = JSON.parse(saved);
            return habits.map(habit => {
                if (habit.lastChecked) {
                    const lastCheckedDate = new Date(habit.lastChecked);
                    if (!this.isToday(lastCheckedDate)) {
                        habit.checkedToday = false;
                        if (!this.isYesterday(lastCheckedDate)) {
                            habit.streak = 0;
                        }
                    }
                }
                return habit;
            });
        }
        return [];
    }

    saveHabits() {
        localStorage.setItem('focusflow-habits', JSON.stringify(this.habits));
    }

    addHabit() {
        const name = this.habitInput.value.trim();
        if (name) {
            const habit = {
                id: Date.now(),
                name: name,
                streak: 0,
                checkedToday: false,
                lastChecked: null,
                createdAt: new Date().toISOString()
            };
            this.habits.push(habit);
            this.habitInput.value = '';
            this.saveHabits();
            this.render();
        }
    }

    deleteHabit(id) {
        this.habits = this.habits.filter(h => h.id !== id);
        this.saveHabits();
        this.render();
    }

    toggleHabit(id) {
        const habit = this.habits.find(h => h.id === id);
        if (!habit) return;

        const today = new Date();
        const lastChecked = habit.lastChecked ? new Date(habit.lastChecked) : null;

        if (!habit.checkedToday) {
            habit.checkedToday = true;
            habit.lastChecked = today.toISOString();

            if (lastChecked && this.isYesterday(lastChecked)) {
                habit.streak++;
            } else if (!lastChecked || !this.isToday(lastChecked)) {
                habit.streak = 1;
            }
        } else {
            habit.checkedToday = false;
            if (habit.streak > 0) {
                habit.streak--;
            }
        }

        this.saveHabits();
        this.render();
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    isYesterday(date) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.getDate() === yesterday.getDate() &&
               date.getMonth() === yesterday.getMonth() &&
               date.getFullYear() === yesterday.getFullYear();
    }

    render() {
        this.habitsList.innerHTML = '';

        if (this.habits.length === 0) {
            this.emptyState.classList.remove('hidden');
        } else {
            this.emptyState.classList.add('hidden');

            this.habits.forEach(habit => {
                const habitItem = document.createElement('div');
                habitItem.className = 'habit-item';

                habitItem.innerHTML = `
                    <input 
                        type="checkbox" 
                        class="habit-checkbox" 
                        ${habit.checkedToday ? 'checked' : ''}
                        data-id="${habit.id}"
                    >
                    <div class="habit-info">
                        <div class="habit-name">${this.escapeHtml(habit.name)}</div>
                        <div class="habit-streak">
                            ❤️‍🔥 Streak: <span class="streak-count">${habit.streak} ${habit.streak === 1 ? 'day' : 'days'}</span>
                        </div>
                    </div>
                    <button class="delete-btn" data-id="${habit.id}">Delete</button>
                `;

                const checkbox = habitItem.querySelector('.habit-checkbox');
                checkbox.addEventListener('change', () => this.toggleHabit(habit.id));

                const deleteBtn = habitItem.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => this.deleteHabit(habit.id));

                this.habitsList.appendChild(habitItem);
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/*Spotify embed manager*/
class SpotifyEmbedManager {
    constructor() {
        this.storageKey = 'focusflow-spotify-playlist-id';
        this.input = document.getElementById('spotifyInput');
        this.updateBtn = document.getElementById('updatePlaylistBtn');
        this.iframe = document.getElementById('spotifyIframe');
        this.msg = document.getElementById('spotifyMessage');
        this._msgTimer = null;

        this.initEventListeners();
        this.loadSaved();
    }

    initEventListeners() {
        if (this.updateBtn) {
            this.updateBtn.addEventListener('click', () => this.updateFromInput());
        }
        if (this.input) {
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.updateFromInput();
                }
            });
        }
    }

    loadSaved() {
        try {
            const savedId = localStorage.getItem(this.storageKey);
            if (savedId && this.iframe) {
                this.setIframeById(savedId);
                // prefill input with a usable link
                if (this.input) {
                    this.input.value = `https://open.spotify.com/playlist/${savedId}`;
                }
                this.showMessage('Loaded saved playlist.', 'success');
            }
        } catch (err) {
            console.warn('Failed to load saved Spotify playlist:', err);
        }
    }

    updateFromInput() {
        const raw = this.input ? this.input.value.trim() : '';
        if (!raw) {
            this.showMessage('Please paste a Spotify playlist URL.', 'error');
            return;
        }
        const id = this.extractPlaylistId(raw);
        if (!id) {
            this.showMessage('Invalid Spotify playlist URL. Make sure it is a playlist link or share link.', 'error');
            return;
        }

        this.setIframeById(id);

        try {
            localStorage.setItem(this.storageKey, id);
            this.showMessage('Playlist updated and saved.', 'success');
        } catch (err) {
            console.warn('Failed to save spotify playlist id to localStorage:', err);
            this.showMessage('Playlist updated but could not be saved locally (storage error).', 'error');
        }
    }

    extractPlaylistId(str) {
        if (!str || typeof str !== 'string') return null;

        // Try spotify URI
        let m = str.match(/spotify:playlist:([A-Za-z0-9]+)/);
        if (m) return m[1];

        // Try open.spotify.com playlist path
        m = str.match(/open\.spotify\.com\/playlist\/([A-Za-z0-9]+)(?:[?\/]|$)/);
        if (m) return m[1];

        // Try user/.../playlist/{id}
        m = str.match(/open\.spotify\.com\/user\/.+?\/playlist\/([A-Za-z0-9]+)(?:[?\/]|$)/);
        if (m) return m[1];

        m = str.match(/([A-Za-z0-9]{20,})/);
        if (m) return m[1];

        return null;
    }

    setIframeById(id) {
        if (!id) return;
        const embed = `https://open.spotify.com/embed/playlist/${id}`;
        if (this.iframe) {
            this.iframe.src = embed;
        }
    }

    showMessage(text, type = 'info') {
        if (!this.msg) return;
        this.msg.textContent = text;
        this.msg.className = 'spotify-message ' + (type === 'error' ? 'error' : 'success');
        if (this._msgTimer) clearTimeout(this._msgTimer);
        this._msgTimer = setTimeout(() => {
            this.msg.textContent = '';
            this.msg.className = 'spotify-message';
        }, 4500);
    }
}

/*Tasks Section: Simple task list (title only) persistence to localStorage*/

class TaskList {
    constructor() {
        this.storageKey = 'focusflow-tasks';
        this.tasks = this.loadTasks();
        this.initElements();
        this.initEventListeners();
        this.render();
    }

    initElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('tasksEmptyState');
    }

    initEventListeners() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed;
            return [];
        } catch (err) {
            console.warn('Failed to load tasks:', err);
            return [];
        }
    }

    saveTasks() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
        } catch (err) {
            console.warn('Failed to save tasks:', err);
        }
    }

    addTask() {
        const title = this.taskInput.value.trim();
        if (!title) return;

        const task = {
            id: Date.now(),
            title: title,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.taskInput.value = '';
        this.saveTasks();
        this.render();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.render();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        task.completed = !task.completed;
        this.saveTasks();
        this.render();
    }

    render() {
        this.tasksList.innerHTML = '';

        if (this.tasks.length === 0) {
            this.emptyState.classList.remove('hidden');
        } else {
            this.emptyState.classList.add('hidden');

            this.tasks.forEach(task => {
                const taskItem = document.createElement('div');
                // reuse habit-item styles for consistent look; add task-item marker too
                taskItem.className = `habit-item task-item${task.completed ? ' completed' : ''}`;

                taskItem.innerHTML = `
                    <input 
                        type="checkbox" 
                        class="habit-checkbox task-checkbox" 
                        ${task.completed ? 'checked' : ''}
                        data-id="${task.id}"
                    >
                    <div class="habit-info">
                        <div class="habit-name">${this.escapeHtml(task.title)}</div>
                    </div>
                    <button class="delete-btn" data-id="${task.id}">Delete</button>
                `;

                const checkbox = taskItem.querySelector('.task-checkbox');
                checkbox.addEventListener('change', () => this.toggleTask(task.id));

                const deleteBtn = taskItem.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

                this.tasksList.appendChild(taskItem);
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
    new TaskList();     // instantiate tasks manager (new)
    new HabitTracker();
    // Spotify embed manager to allow users to update the embedded playlist
    try { new SpotifyEmbedManager(); } catch (err) { console.warn('Spotify manager init failed:', err); }
});
