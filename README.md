<div align="center">

# OneFocus

### Pomodoro · Tasks · Habits · Focus music

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![localStorage](https://img.shields.io/badge/localStorage-Persistent%20State-64748b?style=for-the-badge)]()
[![Spotify](https://img.shields.io/badge/Spotify-Embed-1DB954?style=for-the-badge&logo=spotify&logoColor=white)](https://developer.spotify.com/documentation/embeds)

<br/>

[![No build step](https://img.shields.io/badge/build-none%20required-success?style=flat-square)]()
[![No backend](https://img.shields.io/badge/backend-none-0ea5e9?style=flat-square)]()
[![Web Audio](https://img.shields.io/badge/Web%20Audio-session%20chime-8b5cf6?style=flat-square)]()
[![Keyboard shortcuts](https://img.shields.io/badge/shortcuts-Space%20%7C%20R-f59e0b?style=flat-square)]()

<br/>

[![GitHub last commit](https://img.shields.io/github/last-commit/hackerbotfz/OneFocus-FocusTimer-and-Habit-tracker?style=flat-square&logo=github)](https://github.com/hackerbotfz/OneFocus-FocusTimer-and-Habit-tracker/commits)
[![GitHub repo size](https://img.shields.io/github/repo-size/hackerbotfz/OneFocus-FocusTimer-and-Habit-tracker?style=flat-square&logo=github)](https://github.com/hackerbotfz/OneFocus-FocusTimer-and-Habit-tracker)
[![GitHub stars](https://img.shields.io/github/stars/hackerbotfz/OneFocus-FocusTimer-and-Habit-tracker?style=flat-square&logo=github)](https://github.com/hackerbotfz/OneFocus-FocusTimer-and-Habit-tracker/stargazers)

<br/>

**[Faiz Lawan](https://github.com/hackerbotfz)**

</div>

---

A single-page productivity app combining a Pomodoro timer, task list, daily habit streaks, and an embedded Spotify focus playlist. Vanilla JavaScript—no build step, no backend.

## Overview

OneFocus unifies timed work sessions, lightweight task capture, streak-based habit tracking, and ambient focus music. Responsive two-column layout on desktop, SVG progress ring for session feedback, and keyboard shortcuts for hands-free timer control.

| Module | Behaviour |
|--------|-----------|
| **Pomodoro** | Configurable work/break intervals, session counter, Web Audio completion chime |
| **Tasks** | Add, complete, and delete tasks with persistent storage |
| **Habits** | Daily check-ins with streak logic (today / yesterday rollover) |
| **Focus music** | Spotify embed with URL parsing and saved playlist preference |

## Architecture

```mermaid
flowchart TB
    subgraph UI["index.html + styles.css"]
        POM[PomodoroTimer]
        TASK[TaskList]
        HAB[HabitTracker]
        SPOT[SpotifyEmbedManager]
    end

    subgraph Storage["localStorage"]
        S1[onefocus-settings]
        S2[onefocus-tasks]
        S3[onefocus-habits]
        S4[onefocus-spotify-playlist-id]
    end

    POM --> S1
    TASK --> S2
    HAB --> S3
    SPOT --> S4
```

Four ES6 classes, each owning its DOM slice and storage key. Event-driven updates with XSS-safe `escapeHtml` on user input.

## Run

```bash
npx serve .
```

Keyboard shortcuts: **Space** start/pause · **R** reset

## Repository

```
OneFocus/
├── index.html
├── app.js
├── styles.css
├── assets/
│   └── background.jpg
└── README.md
```

## License

© Faiz Lawan.
