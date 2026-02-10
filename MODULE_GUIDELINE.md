# AP1 Trainer — Modul Design-Guideline

Referenz fuer die Erstellung neuer Lernmodule. Alle Module muessen diesen Patterns folgen, damit Design und Verhalten konsistent bleiben.

---

## 1. Modul-Architektur

Jedes Modul ist eine **IIFE** (Immediately Invoked Function Expression), die `{ render, cleanup }` exportiert.

```javascript
const MeinModulView = (() => {
  let currentTab = 'explanation';
  let currentScenarioIdx = 0;
  let cleanup_fns = [];

  // --- Daten / Szenarien ---
  const SCENARIOS = [ /* ... */ ];

  // --- Render ---
  function render(container) { /* ... */ }
  function cleanup() {
    cleanup_fns.forEach(fn => fn());
    cleanup_fns = [];
  }

  return { render, cleanup };
})();

export default MeinModulView;
```

### Regeln

- **Kein `class`** — nur IIFE-Module mit Closures
- **`cleanup_fns`-Array** — jeder Event-Listener wird als Cleanup-Funktion registriert
- **`currentTab`** — steuert, welcher Tab aktiv ist
- **`currentScenarioIdx`** — Index des aktuellen Szenarios/Aufgabe (falls vorhanden)

---

## 2. HTML-Struktur-Template

Copy-Paste-Vorlage fuer die `render()`-Funktion:

```javascript
function render(container) {
  container.innerHTML = `
    <div class="view-enter">
      <div class="page-header">
        <div class="page-header-left">
          <div>
            <h1 class="page-title">Modul-Titel</h1>
            <p class="page-subtitle">Kurzbeschreibung des Moduls</p>
          </div>
        </div>
      </div>

      <nav class="module-tabs">
        <button class="module-tab ${currentTab === 'explanation' ? 'active' : ''}" data-tab="explanation">Erklaerung</button>
        <button class="module-tab ${currentTab === 'exercises' ? 'active' : ''}" data-tab="exercises">Aufgaben</button>
        <button class="module-tab ${currentTab === 'quiz' ? 'active' : ''}" data-tab="quiz">Quiz</button>
      </nav>

      <div id="meinmodulContent" class="view-enter"></div>
    </div>
  `;

  setupTabEvents(container);
  renderCurrentTab();
}
```

### Tab-System

```javascript
function setupTabEvents(container) {
  container.querySelectorAll('.module-tab').forEach(btn => {
    const handler = () => {
      currentTab = btn.dataset.tab;
      container.querySelectorAll('.module-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCurrentTab();
    };
    btn.addEventListener('click', handler);
    cleanup_fns.push(() => btn.removeEventListener('click', handler));
  });
}

function renderCurrentTab() {
  const content = document.getElementById('meinmodulContent');
  if (!content) return;
  switch (currentTab) {
    case 'explanation': renderExplanation(content); break;
    case 'exercises':   renderExercises(content); break;
    case 'quiz':        renderQuiz(content); break;
  }
}
```

---

## 3. CSS-Klassen-Referenz

### Layout & Struktur (modules.css)

| Klasse | Element | Beschreibung |
|--------|---------|--------------|
| `.view-enter` | `<div>` | Aeusserer Container mit Fade-In |
| `.page-header` | `<div>` | Seitenkopf |
| `.page-header-left` | `<div>` | Flex-Container fuer Titel-Bereich |
| `.page-title` | `<h1>` | Seitentitel |
| `.page-subtitle` | `<p>` | Untertitel |
| `.module-tabs` | `<nav>` | Tab-Leiste |
| `.module-tab` | `<button>` | Einzelner Tab (`.active` fuer aktiven) |

### Inhalts-Klassen (modules.css)

| Klasse | Element | Beschreibung |
|--------|---------|--------------|
| `.module-explanation` | `<div>` | Container fuer Erklaerung-Tab |
| `.module-section-title` | `<h3>` | Abschnitts-Ueberschrift |
| `.module-text` | `<p>` | Fliesstext / Beschreibung |
| `.module-info-box` | `<div>` | Hervorgehobene Info-Box (blau) |
| `.module-tip-box` | `<div>` | Tipp-Box (gelb/orange) |

### Uebungs-Klassen (modules.css)

| Klasse | Element | Beschreibung |
|--------|---------|--------------|
| `.module-exercise-card` | `<div>` | Container fuer eine Aufgabe |
| `.module-exercise-header` | `<div>` | Aufgaben-Kopf |
| `.module-exercise-badge` | `<span>` | Schwierigkeits-/Typ-Badge |
| `.module-exercise-question` | `<p>` | Aufgabentext |
| `.module-exercise-sublabel` | `<p>` | Unter-Label (z.B. "Berechne:") |

### Szenario-Navigation (modules.css)

| Klasse | Element | Beschreibung |
|--------|---------|--------------|
| `.scenario-nav` | `<div>` | Navigation-Container |
| `.scenario-nav-label` | `<span>` | Label (z.B. "Aufgaben") |
| `.scenario-nav-controls` | `<div>` | Pfeil-Buttons + Zaehler |
| `.scenario-nav-btn` | `<button>` | Vor/Zurueck-Button |
| `.scenario-nav-current` | `<span>` | "2 / 5" Zaehler |

### Input & Formulare (modules.css)

| Klasse | Element | Beschreibung |
|--------|---------|--------------|
| `.module-input-grid` | `<div>` | Grid fuer Input-Gruppen |
| `.module-input-group` | `<div>` | Label + Input Wrapper |
| `.module-input` | `<input>` | Text-Input |
| `.module-input-mono` | modifier | Monospace-Font fuer Code-Eingaben |
| `.module-input-correct` | modifier | Gruener Rand (richtig) |
| `.module-input-wrong` | modifier | Roter Rand (falsch) |
| `.module-label` | `<label>` | Input-Label |

### Feedback (modules.css)

| Klasse | Element | Beschreibung |
|--------|---------|--------------|
| `.module-feedback` | `<div>` | Feedback-Container |
| `.module-feedback-success` | modifier | Gruenes Feedback |
| `.module-feedback-error` | modifier | Rotes Feedback |

### Loesungsschritte (modules.css)

| Klasse | Element | Beschreibung |
|--------|---------|--------------|
| `.module-steps` | `<div>` | Container fuer Schritte |
| `.module-steps-title` | `<h4>` | "Loesungsweg" Titel |
| `.module-step` | `<div>` | Einzelner Schritt |
| `.module-step-title` | `<strong>` | Schritt-Titel |
| `.module-step-text` | `<p>` | Schritt-Beschreibung |
| `.module-step-detail` | `<pre>` | Code/Detail-Block |

### Quiz (modules.css)

| Klasse | Element | Beschreibung |
|--------|---------|--------------|
| `.module-quiz` | `<div>` | Quiz-Container |
| `.module-quiz-header` | `<div>` | Fortschritt + Score |
| `.module-quiz-progress` | `<div>` | Fortschritts-Container |
| `.module-quiz-progress-text` | `<span>` | "Quiz-Fortschritt" Label |
| `.module-quiz-progress-bar` | `<div>` | Fortschrittsbalken (Hintergrund) |
| `.module-quiz-progress-fill` | `<div>` | Fortschrittsbalken (Fuellung) |
| `.module-quiz-score` | `<span>` | Score-Anzeige |
| `.module-quiz-card` | `<div>` | Einzelne Frage (kombiniert mit `.module-exercise-card`) |
| `.module-quiz-options` | `<div>` | Options-Grid |
| `.module-quiz-option` | `<div>` | Einzelne Option |
| `.module-quiz-option.correct` | modifier | Richtige Antwort (gruen) |
| `.module-quiz-option.wrong` | modifier | Falsche Antwort (rot) |
| `.module-quiz-explanation` | `<div>` | Erklaerung nach Antwort |
| `.module-quiz-result` | `<div>` | Ergebnis-Card am Ende |
| `.module-quiz-result-title` | `<h2>` | "Quiz beendet!" |
| `.module-quiz-result-score` | `<div>` | Grosse Score-Anzeige |
| `.module-quiz-result-text` | `<p>` | Bewertungstext |

### Actions (modules.css)

| Klasse | Element | Beschreibung |
|--------|---------|--------------|
| `.module-actions` | `<div>` | Button-Container |
| `.btn-primary` | `<button>` | Primaerer Button |
| `.btn-secondary` | `<button>` | Sekundaerer Button |

---

## 4. Szenario-Datenstruktur

Standard-Schema fuer `SCENARIOS`-Array:

```javascript
const SCENARIOS = [
  {
    title: 'Szenario-Titel',
    description: 'Beschreibung der Aufgabe...',
    difficulty: 'leicht', // 'leicht' | 'mittel' | 'schwer'
    data: {
      // Modul-spezifische Daten
    },
    solution: {
      // Erwartete Loesungen
    },
    steps: [
      { title: 'Schritt 1', text: 'Erklaerung...', detail: 'Formel / Code' },
      { title: 'Schritt 2', text: 'Erklaerung...', detail: 'Formel / Code' }
    ]
  }
];
```

### Quiz-Datenstruktur

```javascript
const QUIZ_QUESTIONS = [
  {
    q: 'Frage-Text?',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correct: 1,      // Index der richtigen Antwort (0-basiert)
    explain: 'Erklaerung warum B richtig ist...'
  }
];
```

---

## 5. Naming-Konventionen

### CSS-Prefix

Jedes Modul hat einen **eigenen CSS-Prefix** fuer modul-spezifische Styles:

| Modul | Prefix | Beispiel |
|-------|--------|---------|
| Kommunikation | `comm-` | `.comm-square`, `.comm-ear` |
| Subnetting | `subnet-` | `.subnet-input`, `.subnet-table` |
| NWA | `nwa-` | `.nwa-table`, `.nwa-slider` |
| Netzplantechnik | `np-` | `.np-node`, `.np-canvas` |
| EPK | `epk-` | `.epk-element`, `.epk-canvas` |
| UML | `uml-` | `.uml-scenario`, `.uml-actor` |
| Gantt | `gantt-` | `.gantt-chart`, `.gantt-bar` |
| E-Technik | `elec-` | `.elec-circuit` |
| Zahlensysteme | `nums-` | `.nums-converter` |
| Mailprotokolle | `mail-` | `.mail-table`, `.mail-tab-btn` |

**Gemeinsame Klassen** (aus `modules.css`) verwenden den Prefix `module-`:
- `.module-section-title`, `.module-text`, `.module-quiz-*`, etc.

### ID-Schema

```
[modulkuerzel]Content     — Haupt-Content-Container
[modulkuerzel]Feedback    — Feedback-Bereich
[modulkuerzel]Steps       — Loesungsschritte
```

### localStorage-Keys

```
ap1_[modulname]_progress
```

Beispiele: `ap1_osi_progress`, `ap1_nwa_progress`, `ap1_uml_progress`

---

## 6. Component-Patterns

### 6.1 Erklaerung-Tab

```javascript
function renderExplanation(container) {
  container.innerHTML = `
    <div class="module-explanation">
      <div class="module-exercise-card">
        <h3 class="module-section-title">Was ist [Thema]?</h3>
        <p class="module-text">
          Erklaerungstext zum Thema...
        </p>
        <div class="module-info-box">
          Wichtige Information hervorgehoben.
        </div>
      </div>

      <div class="module-exercise-card">
        <h3 class="module-section-title">Wie funktioniert es?</h3>
        <p class="module-text">
          Weitere Details...
        </p>
        <div class="module-tip-box">
          Tipp: Nuetzlicher Hinweis fuer die Pruefung.
        </div>
      </div>
    </div>
  `;
}
```

### 6.2 Szenario-Navigation

```javascript
function renderExerciseLayout(container) {
  container.innerHTML = `
    <div class="scenario-nav">
      <span class="scenario-nav-label">Aufgaben</span>
      <div class="scenario-nav-controls">
        <button class="scenario-nav-btn" id="prevScen"
          ${currentScenarioIdx === 0 ? 'disabled' : ''}>&larr;</button>
        <span class="scenario-nav-current">
          ${currentScenarioIdx + 1} / ${SCENARIOS.length}
        </span>
        <button class="scenario-nav-btn" id="nextScen"
          ${currentScenarioIdx === SCENARIOS.length - 1 ? 'disabled' : ''}>&rarr;</button>
      </div>
    </div>

    <div id="exerciseContent"></div>
  `;

  // Navigation Events
  const prev = document.getElementById('prevScen');
  const next = document.getElementById('nextScen');
  if (prev) {
    const h = () => { currentScenarioIdx--; renderExerciseLayout(container); };
    prev.addEventListener('click', h);
    cleanup_fns.push(() => prev.removeEventListener('click', h));
  }
  if (next) {
    const h = () => { currentScenarioIdx++; renderExerciseLayout(container); };
    next.addEventListener('click', h);
    cleanup_fns.push(() => next.removeEventListener('click', h));
  }

  renderCurrentExercise();
}
```

### 6.3 Quiz

```javascript
function renderQuiz(container) {
  let score = 0;
  let answered = 0;

  container.innerHTML = `
    <div class="module-quiz">
      <div class="module-quiz-header">
        <div class="module-quiz-progress">
          <span class="module-quiz-progress-text">Quiz-Fortschritt</span>
          <div class="module-quiz-progress-bar">
            <div class="module-quiz-progress-fill" id="quizProgress" style="width: 0%"></div>
          </div>
        </div>
        <span class="module-quiz-score" id="quizScore">0 / ${QUIZ_QUESTIONS.length}</span>
      </div>

      <div id="quizQuestions">
        ${QUIZ_QUESTIONS.map((q, i) => `
          <div class="module-exercise-card module-quiz-card" data-idx="${i}">
            <p class="module-exercise-question"><strong>Frage ${i + 1}:</strong> ${q.q}</p>
            <div class="module-quiz-options">
              ${q.options.map((opt, oi) => `
                <div class="module-quiz-option" data-qi="${i}" data-oi="${oi}">
                  ${opt}
                </div>
              `).join('')}
            </div>
            <div class="module-quiz-explanation" style="display:none;"></div>
          </div>
        `).join('')}
      </div>

      <div id="quizResult"></div>
    </div>
  `;

  // Quiz Events
  container.querySelectorAll('.module-quiz-option').forEach(opt => {
    const handler = () => {
      const qi = +opt.dataset.qi;
      const oi = +opt.dataset.oi;
      const card = opt.closest('.module-quiz-card');
      if (card.classList.contains('answered')) return;
      card.classList.add('answered');
      answered++;

      const isCorrect = oi === QUIZ_QUESTIONS[qi].correct;
      if (isCorrect) score++;
      opt.classList.add(isCorrect ? 'correct' : 'wrong');

      // Richtige Antwort markieren
      if (!isCorrect) {
        card.querySelectorAll('.module-quiz-option')[QUIZ_QUESTIONS[qi].correct]
          .classList.add('correct');
      }

      // Erklaerung zeigen
      const expl = card.querySelector('.module-quiz-explanation');
      expl.style.display = 'block';
      expl.textContent = QUIZ_QUESTIONS[qi].explain;

      // Fortschritt updaten
      const pct = (answered / QUIZ_QUESTIONS.length) * 100;
      document.getElementById('quizProgress').style.width = pct + '%';
      document.getElementById('quizScore').textContent = `${score} / ${QUIZ_QUESTIONS.length}`;

      // Ergebnis am Ende
      if (answered === QUIZ_QUESTIONS.length) {
        showQuizResult(score);
      }
    };
    opt.addEventListener('click', handler);
    cleanup_fns.push(() => opt.removeEventListener('click', handler));
  });
}

function showQuizResult(score) {
  const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
  const text = pct === 100 ? 'Perfekt!' : pct >= 70 ? 'Gut gemacht!' : 'Weiter ueben!';
  document.getElementById('quizResult').innerHTML = `
    <div class="module-exercise-card module-quiz-result">
      <h2 class="module-quiz-result-title">Quiz beendet!</h2>
      <div class="module-quiz-result-score">${pct}%</div>
      <p class="module-quiz-result-text">${text} ${score} von ${QUIZ_QUESTIONS.length} richtig.</p>
      <button class="btn-primary" onclick="/* restart quiz */">Nochmal versuchen</button>
    </div>
  `;
}
```

### 6.4 Feedback anzeigen

```javascript
function showFeedback(container, success, message) {
  const fb = container.querySelector('#feedback') || container;
  fb.innerHTML = `
    <div class="module-feedback ${success ? 'module-feedback-success' : 'module-feedback-error'}">
      <strong>${success ? 'Richtig!' : 'Nicht ganz.'}</strong> ${message}
    </div>
  `;
}
```

### 6.5 Loesungsschritte

```javascript
function renderSteps(container, steps) {
  container.innerHTML = `
    <div class="module-steps">
      <h4 class="module-steps-title">Loesungsweg</h4>
      ${steps.map((s, i) => `
        <div class="module-step">
          <strong class="module-step-title">Schritt ${i + 1}: ${s.title}</strong>
          <p class="module-step-text">${s.text}</p>
          ${s.detail ? `<pre class="module-step-detail">${s.detail}</pre>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}
```

---

## 7. CSS-Dateien-Struktur

```
modules/
  modules.css              ← Shared Styles (Tabs, Cards, Quiz, etc.)
  css/
    communication.css      ← Nur comm-spezifische Styles
    subnetting.css         ← Nur subnet-spezifische Styles
    nwa.css                ← Nur nwa-spezifische Styles
    networkplan.css        ← Nur np-spezifische Styles
    epk.css                ← Nur epk-spezifische Styles
    uml.css                ← Nur uml-spezifische Styles
    gantt.css              ← Nur gantt-spezifische Styles
    meinmodul.css          ← Nur meinmodul-spezifische Styles
```

**Regel**: Alles was in 2+ Modulen vorkommt, gehoert in `modules.css`.

---

## 8. Checkliste fuer neue Module

- [ ] IIFE-Struktur mit `{ render, cleanup }` Export
- [ ] `cleanup_fns`-Array fuer Event-Listener
- [ ] Page-Header mit `.page-title` + `.page-subtitle`
- [ ] Tab-Navigation mit `.module-tabs` + `.module-tab`
- [ ] Content-Container mit ID `[prefix]Content`
- [ ] Erklaerung-Tab mit `.module-section-title` + `.module-text`
- [ ] Uebungen mit `.module-exercise-card`
- [ ] Szenario-Navigation mit `.scenario-nav` (falls mehrere Aufgaben)
- [ ] Feedback mit `.module-feedback` + `.module-feedback-success/error`
- [ ] Quiz (falls vorhanden) mit `.module-quiz-*` Klassen
- [ ] Modul-spezifische CSS in `modules/css/[prefix].css`
- [ ] CSS-Prefix fuer modul-spezifische Klassen (z.B. `mein-`)
- [ ] localStorage-Key: `ap1_[modulname]_progress`
- [ ] Route registriert in `app.js` `setupRoutes()`
- [ ] Sidebar-Eintrag mit Icon in `sidebar.js`
- [ ] Deutsche UI-Sprache (Umlaute als ue, ae, oe in Code-Strings)
