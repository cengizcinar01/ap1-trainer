// ============================================================
// gantt.js — Gantt-Diagramm-Trainer (Standard Design)
// Correct container structure and integrated navigation.
// ============================================================

const GanttView = (() => {
  let currentTab = 'explanation';
  let currentScenarioIdx = 0;
  const userBars = {}; // scenarioIdx -> rowId -> Set of dayIndices
  let cleanup_fns = [];

  const SCENARIOS = [
    {
      id: 1,
      title: 'Web-Portal Entwicklung',
      description:
        'Ein Projekt beginnt mit dem Vorgang A. Nachdem dieser nach drei Tagen abgeschlossen ist, folgen drei parallele Vorgänge: B (6 Tage), D (8 Tage), E (5 Tage). B hat den Nachfolger C (4 Tage). C, D und E haben den gemeinsamen Nachfolger F (3 Tage). Auf F folgt G (2 Tage).',
      vorgaben: [{ row: 'A', start: 1, end: 3 }],
      rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      days: 22,
      solutions: {
        A: [1, 3],
        B: [4, 9],
        C: [10, 13],
        D: [4, 11],
        E: [4, 8],
        F: [14, 16],
        G: [17, 18],
      },
      questions: [
        {
          id: 'duration',
          text: 'Wie viele Tage dauert das Projekt frühestens?',
          answer: '18',
        },
        {
          id: 'max_buffer',
          text: 'Welcher Vorgang hat den größten Puffer (in Tagen)?',
          answer: 'E',
        },
      ],
    },
    {
      id: 2,
      title: 'Software-Update Rollout',
      description:
        'Start mit Analyse (A, 2 Tage). Danach parallel: Programmierung (B, 5 Tage) und Dokumentation (C, 3 Tage). Wenn beides fertig ist, folgt der Test (D, 4 Tage). Abschließend die Abnahme (E, 1 Tag).',
      vorgaben: [{ row: 'A', start: 1, end: 2 }],
      rows: ['A', 'B', 'C', 'D', 'E'],
      days: 15,
      solutions: { A: [1, 2], B: [3, 7], C: [3, 5], D: [8, 11], E: [12, 12] },
      questions: [
        { id: 'duration', text: 'Frühestes Projektende (Tag)?', answer: '12' },
        {
          id: 'buffer_c',
          text: 'Wie viele Tage Puffer hat die Dokumentation (C)?',
          answer: '2',
        },
      ],
    },
    {
      id: 3,
      title: 'Server-Migration',
      description:
        'Vorgang A (Backup, 4 Tage) ist Voraussetzung für B (Transfer, 6 Tage) und C (Konfiguration, 4 Tage). B und C können parallel laufen. Erst wenn B und C fertig sind, kann D (Livegang, 2 Tage) starten.',
      vorgaben: [{ row: 'A', start: 1, end: 4 }],
      rows: ['A', 'B', 'C', 'D'],
      days: 15,
      solutions: { A: [1, 4], B: [5, 10], C: [5, 8], D: [11, 12] },
      questions: [
        { id: 'duration', text: 'Projektdauer gesamt?', answer: '12' },
        {
          id: 'critical',
          text: 'Welcher Vorgang liegt NICHT auf dem kritischen Pfad?',
          answer: 'C',
        },
      ],
    },
    {
      id: 4,
      title: 'Hardware-Ausstattung',
      description:
        'Bestellung (A, 3 Tage) muss fertig sein. Dann parallel: Lieferung (B, 7 Tage) und Vorbereitung der Räume (C, 4 Tage). Nach der Lieferung erfolgt Aufbau (D, 3 Tage). Wenn Aufbau UND Raumvorbereitung fertig sind, erfolgt die Schulung (E, 2 Tage).',
      vorgaben: [{ row: 'A', start: 1, end: 3 }],
      rows: ['A', 'B', 'C', 'D', 'E'],
      days: 20,
      solutions: { A: [1, 3], B: [4, 10], C: [4, 7], D: [11, 13], E: [14, 15] },
      questions: [
        {
          id: 'duration',
          text: 'Wann ist das Projekt beendet (Tag)?',
          answer: '15',
        },
        {
          id: 'buffer_c',
          text: 'Puffer für Raumvorbereitung (C) in Tagen?',
          answer: '6',
        },
      ],
    },
    {
      id: 5,
      title: 'App-Entwicklung (Sprint)',
      description:
        'Design (A, 5 Tage) startet. Danach parallel: Frontend (B, 8 Tage) und Backend (C, 10 Tage). Wenn Backend fertig ist, folgt API-Anbindung (D, 4 Tage). Wenn Frontend UND API fertig sind, erfolgt das Deployment (E, 2 Tage).',
      vorgaben: [{ row: 'A', start: 1, end: 5 }],
      rows: ['A', 'B', 'C', 'D', 'E'],
      days: 25,
      solutions: {
        A: [1, 5],
        B: [6, 13],
        C: [6, 15],
        D: [16, 19],
        E: [20, 21],
      },
      questions: [
        { id: 'duration', text: 'Mindestdauer des Sprints?', answer: '21' },
        {
          id: 'path',
          text: 'Was ist der kritische Pfad (z.B. A-B-C)?',
          answer: 'A-C-D-E',
        },
      ],
    },
    {
      id: 6,
      title: 'Netzwerk-Infrastruktur',
      description:
        'Planung (A, 4 Tage). Dann parallel: Verkabelung (B, 10 Tage) und Router-Konfiguration (C, 3 Tage). Nach der Verkabelung folgt Messung (D, 2 Tage). Wenn Messung UND Konfiguration fertig sind, folgt Abnahme (E, 1 Tag).',
      vorgaben: [{ row: 'A', start: 1, end: 4 }],
      rows: ['A', 'B', 'C', 'D', 'E'],
      days: 20,
      solutions: { A: [1, 4], B: [5, 14], C: [5, 7], D: [15, 16], E: [17, 17] },
      questions: [
        {
          id: 'duration',
          text: 'Frühestes Ende der Infrastruktur?',
          answer: '17',
        },
        {
          id: 'buffer_c',
          text: 'Pufferzeit für Router-Konfig (C)?',
          answer: '9',
        },
      ],
    },
  ];

  // ============================================================
  // CORE FUNCTIONS
  // ============================================================

  function render(container) {
    cleanup();
    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <div class="page-header-left">
            <div>
              <h1 class="page-title">Gantt-Diagramm Trainer</h1>
              <p class="page-subtitle">Projektzeitplanung visualisieren und kritische Pfade analysieren.</p>
            </div>
          </div>
        </div>

        <nav class="module-tabs">
          <button class="module-tab ${currentTab === 'explanation' ? 'active' : ''}" data-tab="explanation">Anleitung</button>
          <button class="module-tab ${currentTab === 'exercise' ? 'active' : ''}" data-tab="exercise">Übung</button>
        </nav>

        <div id="ganttContent"></div>
      </div>
    `;

    setupTabEvents(container);
    renderCurrentTab();
  }

  function setupTabEvents(container) {
    container.querySelectorAll('.module-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        container.querySelectorAll('.module-tab').forEach((b) => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        renderCurrentTab();
      });
    });
  }

  function renderCurrentTab() {
    const content = document.getElementById('ganttContent');
    if (!content) return;
    if (currentTab === 'explanation') renderExplanation(content);
    else renderExerciseLayout(content);
  }

  function renderExplanation(container) {
    container.innerHTML = `
      <div class="gantt-explanation view-enter">
        <div class="module-exercise-card">
          <h3 class="comm-section-title">Grundlagen & Zeichnung</h3>
          <p class="comm-text">In dieser Übung zeichnest du Balken für Projektvorgänge ein. Beachte:</p>
          <div class="module-steps">
            <div class="module-step">
              <div class="module-step-title">Früheste Anfangszeit (FAZ)</div>
              <div class="module-step-text">Ein Vorgang startet am Tag NACH seinem Vorgänger.</div>
            </div>
            <div class="module-step">
              <div class="module-step-title">Pufferzeiten</div>
              <div class="module-step-text">Einige Aufgaben haben Spielraum, ohne das Projektende zu verzögern.</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderExerciseLayout(container) {
    const sc = SCENARIOS[currentScenarioIdx];
    initUserBars(sc);

    container.innerHTML = `
      <div class="module-exercise-card view-enter">
        <div class="scenario-nav">
          <span class="scenario-nav-label">Szenarien</span>
          <div class="scenario-nav-controls">
            <button class="scenario-nav-btn" id="prevScen" ${currentScenarioIdx === 0 ? 'disabled' : ''}>&larr;</button>
            <span class="scenario-nav-current">${currentScenarioIdx + 1} / ${SCENARIOS.length}</span>
            <button class="scenario-nav-btn" id="nextScen" ${currentScenarioIdx === SCENARIOS.length - 1 ? 'disabled' : ''}>&rarr;</button>
          </div>
        </div>

        <div class="gantt-card-header">
          <div style="flex: 1">
            <h3 style="margin: 0 0 var(--space-1) 0;">${sc.title}</h3>
            <p class="comm-text" style="font-size: 13px; margin: 0;">${sc.description}</p>
          </div>
        </div>

        <div class="gantt-table-wrapper">
          <table class="gantt-table" id="ganttTable">
            <thead>
              <tr>
                <th class="gantt-row-label">Vorgang</th>
                ${Array.from({ length: sc.days }, (_, i) => `<th class="day-col" data-day="${i + 1}">${i + 1}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${sc.rows.map((rowId) => renderRow(rowId, sc)).join('')}
            </tbody>
          </table>
        </div>

        <div class="gantt-legend">
          <div class="legend-item"><div class="legend-box" style="background: var(--text-tertiary); opacity: 0.2"></div><span>Vorgabe</span></div>
          <div class="legend-item"><div class="legend-box" style="background: var(--accent-primary)"></div><span>Zeichnung</span></div>
          <div class="legend-item"><span>(Klicken & Ziehen zum Zeichnen)</span></div>
        </div>

        <div id="ganttQuestions" class="gantt-questions" style="display:none">
          ${sc.questions
            .map(
              (q, i) => `
            <div class="gantt-question-card view-enter">
              <div class="gantt-q-num">${i + 1}</div>
              <div class="gantt-q-text">${q.text}</div>
              <input type="text" class="module-input gantt-input" data-qid="${q.id}" placeholder="...">
            </div>
          `
            )
            .join('')}
        </div>

        <div class="module-actions" style="margin-top: var(--space-8)">
          <button class="btn btn-primary" id="btnCheckGantt">Diagramm prüfen</button>
          <button class="btn btn-primary" id="btnCheckQuestions" style="display:none">Fragen prüfen</button>
          <button class="btn" id="btnResetGantt">Löschen</button>
        </div>
        <div id="ganttFeedback" style="margin-top: var(--space-4);"></div>
      </div>
    `;

    setupInteraction(container, sc);
    setupNav(container);
    updateVisualConnections();
  }

  function setupNav(container) {
    container.querySelector('#prevScen')?.addEventListener('click', () => {
      if (currentScenarioIdx > 0) {
        currentScenarioIdx--;
        renderCurrentTab();
      }
    });
    container.querySelector('#nextScen')?.addEventListener('click', () => {
      if (currentScenarioIdx < SCENARIOS.length - 1) {
        currentScenarioIdx++;
        renderCurrentTab();
      }
    });
  }

  function renderRow(rowId, sc) {
    const bars = userBars[currentScenarioIdx][rowId];
    return `
      <tr data-row="${rowId}">
        <td class="gantt-row-label">Vorgang ${rowId} <span class="row-status-icon" id="status-${rowId}"></span></td>
        ${Array.from({ length: sc.days }, (_, i) => {
          const day = i + 1;
          const isV = sc.vorgaben.some(
            (v) => v.row === rowId && day >= v.start && day <= v.end
          );
          return `<td class="gantt-cell ${isV ? 'vorgabe' : ''} ${bars.has(day) ? 'active' : ''}" data-day="${day}"></td>`;
        }).join('')}
      </tr>
    `;
  }

  function initUserBars(sc) {
    if (!userBars[currentScenarioIdx]) {
      userBars[currentScenarioIdx] = {};
      sc.rows.forEach((r) => {
        userBars[currentScenarioIdx][r] = new Set();
      });
      sc.vorgaben.forEach((v) => {
        for (let i = v.start; i <= v.end; i++) {
          userBars[currentScenarioIdx][v.row].add(i);
        }
      });
    }
  }

  function setupInteraction(container, sc) {
    const table = container.querySelector('#ganttTable');
    let isMD = false;
    let sAdd = true;

    table.querySelectorAll('.gantt-cell:not(.vorgabe)').forEach((cell) => {
      const rowId = cell.closest('tr').dataset.row;
      const day = parseInt(cell.dataset.day, 10);

      const update = (el, active) => {
        if (active) {
          userBars[currentScenarioIdx][rowId].add(day);
          el.classList.add('active');
        } else {
          userBars[currentScenarioIdx][rowId].delete(day);
          el.classList.remove('active');
        }
        updateVisualConnections();
      };

      cell.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isMD = true;
        sAdd = !userBars[currentScenarioIdx][rowId].has(day);
        update(cell, sAdd);
      });
      cell.addEventListener('mouseenter', () => {
        if (isMD) update(cell, sAdd);
        table
          .querySelectorAll(`td[data-day="${day}"], th[data-day="${day}"]`)
          .forEach((el) => el.classList.add('gantt-day-highlight'));
      });
      cell.addEventListener('mouseleave', () =>
        table
          .querySelectorAll(`.gantt-day-highlight`)
          .forEach((el) => el.classList.remove('gantt-day-highlight'))
      );
    });

    const upHandler = () => {
      isMD = false;
    };
    window.addEventListener('mouseup', upHandler);
    cleanup_fns.push(() => window.removeEventListener('mouseup', upHandler));

    container
      .querySelector('#btnCheckGantt')
      .addEventListener('click', () => checkGantt(container, sc));
    container.querySelector('#btnResetGantt').addEventListener('click', () => {
      delete userBars[currentScenarioIdx];
      renderCurrentTab();
    });
  }

  function updateVisualConnections() {
    document.querySelectorAll('#ganttTable tbody tr').forEach((row) => {
      const cells = row.querySelectorAll('.gantt-cell');
      cells.forEach((cell, i) => {
        const active = cell.classList.contains('active');
        cell.classList.toggle(
          'bar-start',
          active && (i === 0 || !cells[i - 1].classList.contains('active'))
        );
        cell.classList.toggle(
          'bar-end',
          active &&
            (i === cells.length - 1 ||
              !cells[i + 1].classList.contains('active'))
        );
      });
    });
  }

  function checkGantt(container, sc) {
    let allC = true;
    let _cRows = 0;
    sc.rows.forEach((rowId) => {
      const sol = sc.solutions[rowId];
      const uSet = userBars[currentScenarioIdx][rowId];
      let rC = true;
      container
        .querySelectorAll(`tr[data-row="${rowId}"] .gantt-cell`)
        .forEach((cell) => {
          const day = parseInt(cell.dataset.day, 10);
          const isS = day >= sol[0] && day <= sol[1];
          const isU = uSet.has(day);
          cell.classList.remove('correct', 'wrong');
          if (isU && isS) cell.classList.add('correct');
          else if (isU && !isS) {
            cell.classList.add('wrong');
            rC = false;
          } else if (!isU && isS) rC = false;
        });
      const icon = container.querySelector(`#status-${rowId}`);
      if (rC) {
        icon.innerHTML = '✅';
        icon.classList.add('visible');
        _cRows++;
      } else {
        icon.innerHTML = '❌';
        icon.classList.add('visible');
        allC = false;
      }
    });

    if (allC) {
      container.querySelector('#ganttFeedback').innerHTML =
        `<div class="module-feedback module-feedback-success"><strong>Korrekt!</strong> Bitte beantworte nun die Fragen.</div>`;
      container.querySelector('#ganttQuestions').style.display = 'flex';
      container.querySelector('#btnCheckQuestions').style.display =
        'inline-block';
      container.querySelector('#btnCheckGantt').style.display = 'none';
      container.querySelector('#btnCheckQuestions').onclick = () =>
        checkQuestions(container, sc);
    } else {
      container.querySelector('#ganttFeedback').innerHTML =
        `<div class="module-feedback module-feedback-error">Nicht ganz korrekt. Überprüfe die rot markierten Stellen.</div>`;
    }
  }

  function checkQuestions(container, sc) {
    let c = 0;
    container.querySelectorAll('.gantt-input').forEach((inp) => {
      const q = sc.questions.find((item) => item.id === inp.dataset.qid);
      inp.classList.remove('module-input-correct', 'module-input-wrong');
      if (inp.value.trim().toUpperCase() === q.answer.toUpperCase()) {
        inp.classList.add('module-input-correct');
        c++;
      } else inp.classList.add('module-input-wrong');
    });
    if (c === sc.questions.length)
      container.querySelector('#ganttFeedback').innerHTML =
        `<div class="module-feedback module-feedback-success"><strong>Perfekt!</strong> Alles richtig gelöst.</div>`;
  }

  function cleanup() {
    cleanup_fns.forEach((fn) => fn());
    cleanup_fns = [];
  }
  return { render, cleanup };
})();

export default GanttView;
