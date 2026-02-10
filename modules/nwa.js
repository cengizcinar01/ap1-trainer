// ============================================================
// nwa.js — Nutzwertanalyse-Trainer (Pro Edition)
// Modul 1: Interaktives IHK-Training mit Rechenweg
// ============================================================

const NWAView = (() => {
  let currentTab = 'explanation';
  let currentScenarioIdx = 0;
  let cleanup_fns = [];

  // ============================================================
  // DATA: 5 NWA Scenarios
  // ============================================================

  const SCENARIOS = [
    {
      id: 1,
      title: 'KustoFlex GmbH — CAD-Arbeitsplätze',
      description: 'Wähle das beste System für fünf neue CAD-Arbeitsplätze.',
      decisionText:
        'Meeting-Beschluss: Nur eine On-Premise-Lösung ist zulässig. Anbieter 3 bietet ausschließlich SaaS an.',
      criteria: [
        {
          name: 'Grafikkarte',
          weight: 20,
          p: [3, 2, 4, 3],
          w: [60, 40, 80, 60],
        },
        {
          name: 'Arbeitsspeicher (RAM)',
          weight: 25,
          p: [4, 3, 4, 3],
          w: [100, 75, 100, 75],
        },
        { name: 'Monitor', weight: 40, p: [2, 1, 4, 4], w: [80, 40, 160, 160] },
        { name: 'Preis', weight: 15, p: [3, 4, 1, 1], w: [45, 60, 15, 15] },
      ],
      blanks: [
        { row: 1, col: 'weight', val: '25' },
        { row: 1, col: 'p1', val: '4' },
        { row: 2, col: 'p2', val: '1' },
        { row: 3, col: 'weight', val: '15' },
        { row: 'sum', col: 'w1', val: '285' },
        { row: 'sum', col: 'w2', val: '215' },
        { row: 'sum', col: 'w4', val: '310' },
        { row: 'decision', col: 'final', val: '4' },
      ],
      sums: { p: [12, 10, 13, 11], w: [285, 215, 355, 310] },
    },
    {
      id: 2,
      title: 'Auswahl einer Cloud-Backup-Lösung',
      description:
        'Die IT-Leitung sucht eine neue Strategie zur Datensicherung.',
      decisionText:
        'Datenschutz-Vorgabe: Serverstandort MUSS in der EU liegen. Anbieter 1 hostet in den USA.',
      criteria: [
        {
          name: 'Sicherheit',
          weight: 40,
          p: [4, 4, 3, 2],
          w: [160, 160, 120, 80],
        },
        {
          name: 'Geschwindigkeit',
          weight: 30,
          p: [3, 2, 4, 4],
          w: [120, 60, 120, 120],
        },
        { name: 'Kosten', weight: 20, p: [2, 4, 2, 3], w: [40, 80, 40, 60] },
        { name: 'Support', weight: 10, p: [1, 3, 4, 2], w: [10, 30, 40, 20] },
      ],
      blanks: [
        { row: 0, col: 'weight', val: '40' },
        { row: 1, col: 'p2', val: '2' },
        { row: 2, col: 'w3', val: '40' },
        { row: 'sum', col: 'w2', val: '330' },
        { row: 'decision', col: 'final', val: '2' },
      ],
      sums: { p: [10, 13, 13, 11], w: [330, 330, 320, 280] },
    },
    {
      id: 3,
      title: 'Einführung eines CRM-Systems',
      description:
        'Die Vertriebsabteilung benötigt eine Software zur Kundenpflege.',
      decisionText:
        'Anforderung: Das System muss eine DATEV-Schnittstelle besitzen. Anbieter 2 hat diese nicht.',
      criteria: [
        {
          name: 'Bedienbarkeit',
          weight: 30,
          p: [4, 3, 2, 4],
          w: [120, 90, 60, 120],
        },
        {
          name: 'Funktionsumfang',
          weight: 40,
          p: [3, 4, 4, 2],
          w: [120, 160, 160, 80],
        },
        {
          name: 'Schnittstellen',
          weight: 20,
          p: [2, 1, 4, 3],
          w: [40, 20, 80, 60],
        },
        {
          name: 'Mobilfähigkeit',
          weight: 10,
          p: [4, 4, 3, 4],
          w: [40, 40, 30, 40],
        },
      ],
      blanks: [
        { row: 1, col: 'weight', val: '40' },
        { row: 2, col: 'p3', val: '4' },
        { row: 3, col: 'w4', val: '40' },
        { row: 'sum', col: 'w3', val: '330' },
        { row: 'decision', col: 'final', val: '3' },
      ],
      sums: { p: [13, 12, 13, 13], w: [320, 310, 330, 300] },
    },
    {
      id: 4,
      title: 'Internetanbindung Hauptsitz',
      description: 'Vergleich von Glasfaser- und Standleitungstarifen.',
      decisionText:
        'Technisches Kriterium: Ein 24/7 Gold-SLA ist Pflicht. Anbieter 4 bietet nur Support zu Geschäftszeiten.',
      criteria: [
        {
          name: 'Bandbreite (Up)',
          weight: 50,
          p: [4, 3, 4, 2],
          w: [200, 150, 200, 100],
        },
        {
          name: 'Verfügbarkeit',
          weight: 30,
          p: [4, 4, 2, 1],
          w: [120, 120, 60, 30],
        },
        {
          name: 'Installation',
          weight: 10,
          p: [2, 4, 3, 4],
          w: [20, 40, 30, 40],
        },
        {
          name: 'Grundgebühr',
          weight: 10,
          p: [1, 2, 4, 4],
          w: [10, 20, 40, 40],
        },
      ],
      blanks: [
        { row: 0, col: 'w1', val: '200' },
        { row: 1, col: 'p2', val: '4' },
        { row: 2, col: 'weight', val: '10' },
        { row: 'sum', col: 'w1', val: '350' },
        { row: 'decision', col: 'final', val: '1' },
      ],
      sums: { p: [11, 13, 13, 11], w: [350, 330, 330, 210] },
    },
    {
      id: 5,
      title: 'Mobile Geräte Außendienst',
      description: 'Beschaffung von 50 Notebooks für mobile Mitarbeiter.',
      decisionText:
        'Mindestanforderung: Displayhelligkeit > 400 Nits. Anbieter 1 erreicht nur 250 Nits.',
      criteria: [
        {
          name: 'Akkulaufzeit',
          weight: 40,
          p: [4, 3, 2, 4],
          w: [160, 120, 80, 160],
        },
        { name: 'Gewicht', weight: 20, p: [2, 4, 4, 3], w: [40, 80, 80, 60] },
        {
          name: 'Helligkeit',
          weight: 25,
          p: [1, 4, 3, 4],
          w: [25, 100, 75, 100],
        },
        { name: 'Garantie', weight: 15, p: [4, 2, 4, 3], w: [60, 30, 60, 45] },
      ],
      blanks: [
        { row: 0, col: 'p4', val: '4' },
        { row: 2, col: 'weight', val: '25' },
        { row: 3, col: 'w3', val: '60' },
        { row: 'sum', col: 'w4', val: '365' },
        { row: 'decision', col: 'final', val: '2' },
      ],
      sums: { p: [11, 13, 13, 14], w: [285, 330, 295, 365] },
    },
  ];

  // ============================================================
  // CORE FUNCTIONS
  // ============================================================

  function render(container) {
    cleanup();
    container.innerHTML = `
      <div class="view-enter nwa-exam-page">
        <div class="page-header">
          <div class="page-header-left">
            <div>
              <h1 class="page-title">Nutzwertanalyse (NWA)</h1>
              <p class="page-subtitle">Prüfungsnahe Simulationen mit 5 Fallstudien und detailliertem Rechenweg.</p>
            </div>
          </div>
        </div>

        <nav class="module-tabs">
          <button class="module-tab ${currentTab === 'explanation' ? 'active' : ''}" data-tab="explanation">Anleitung</button>
          <button class="module-tab ${currentTab === 'training' ? 'active' : ''}" data-tab="training">Übung</button>
        </nav>

        <div id="nwaContent" class="view-enter"></div>
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
    const content = document.getElementById('nwaContent');
    if (!content) return;
    if (currentTab === 'explanation') renderExplanation(content);
    else renderTraining(content);
  }

  // ============================================================
  // TAB 1: ANLEITUNG
  // ============================================================

  function renderExplanation(container) {
    container.innerHTML = `
      <div class="module-explanation">
        <div class="module-exercise-card">
          <h3 class="module-section-title">Was ist eine Nutzwertanalyse?</h3>
          <p class="module-text">
            Die Nutzwertanalyse (NWA) ist ein quantitatives Verfahren der Entscheidungstheorie. Sie hilft dabei, verschiedene Handlungsalternativen (z.B. unterschiedliche Angebote von Dienstleistern) anhand von mehreren Kriterien vergleichbar zu machen.
          </p>
          <div class="module-info-box">
            <strong>Das Ziel:</strong> Die Alternative mit dem hoechsten Gesamtnutzwert zu identifizieren.
          </div>
        </div>

        <div class="module-exercise-card">
          <h3 class="module-section-title">Die Berechnungslogik</h3>
          <p class="module-text">
            In der IHK-Pruefung begegnet dir die NWA fast immer als Tabelle. Die Berechnung folgt einem einfachen Schema:
          </p>
          
          <div class="module-steps">
            <div class="module-step">
              <div class="module-step-title">1. Gewichtung & Bewertung</div>
              <div class="module-step-text">Jedes Kriterium hat eine Gewichtung (in %) und jedes Angebot eine Bewertung (Punkte, meist 1-10).</div>
            </div>
            <div class="module-step">
              <div class="module-step-title">2. Nutzwert berechnen</div>
              <div class="module-step-text">
                Nutzwert = Gewichtung &times; Punkte. <br>
                <em>Beispiel: 20% Gewichtung &times; 8 Punkte = 1,6 (oder 160 bei IHK-Skalierung).</em>
              </div>
            </div>
            <div class="module-step">
              <div class="module-step-title">3. Summen bilden</div>
              <div class="module-step-text">Addiere alle Nutzwerte einer Spalte (Anbieter), um den Gesamtnutzwert zu erhalten.</div>
            </div>
          </div>
        </div>

        <div class="module-exercise-card">
          <h3 class="module-section-title">Pruefungs-Tipp: K.O.-Kriterien</h3>
          <p class="module-text">
            Achte in der Aufgabenstellung peinlich genau auf Ausschlusskriterien (K.O.-Kriterien).
          </p>
          <div class="module-tip-box">
            <strong>Wichtig:</strong> Wenn ein Anbieter eine Mindestanforderung nicht erfuellt (z.B. "Serverstandort muss in Deutschland sein"), scheidet er sofort aus – egal wie viele Punkte er in anderen Bereichen gesammelt hat!
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // TAB 2: TRAINING
  // ============================================================

  function renderTraining(container) {
    const sc = SCENARIOS[currentScenarioIdx];

    container.innerHTML = `
      <div class="module-exercise-card view-enter">
        <div class="scenario-nav">
          <span class="scenario-nav-label">Szenarien</span>
          <div class="scenario-nav-controls">
            <button class="scenario-nav-btn" id="prevSc" ${currentScenarioIdx === 0 ? 'disabled' : ''}>&larr;</button>
            <span class="scenario-nav-current">${currentScenarioIdx + 1} / ${SCENARIOS.length}</span>
            <button class="scenario-nav-btn" id="nextSc" ${currentScenarioIdx === SCENARIOS.length - 1 ? 'disabled' : ''}>&rarr;</button>
          </div>
        </div>

        <h3 style="margin-bottom: var(--space-2)">${sc.title}</h3>
        <p class="module-text">${sc.description}</p>

        <table class="exam-table">
          <thead>
            <tr>
              <th rowspan="2">Kriterium</th>
              <th rowspan="2">Gew. %</th>
              <th colspan="2">Anbieter 1</th>
              <th colspan="2">Anbieter 2</th>
              <th colspan="2">Anbieter 3</th>
              <th colspan="2">Anbieter 4</th>
            </tr>
            <tr>
              <th>Pkt</th><th>Gew.</th>
              <th>Pkt</th><th>Gew.</th>
              <th>Pkt</th><th>Gew.</th>
              <th>Pkt</th><th>Gew.</th>
            </tr>
          </thead>
          <tbody>
            ${sc.criteria
              .map(
                (c, i) => `
              <tr>
                <td>${c.name}</td>
                <td>${renderInput(sc, i, 'weight', c.weight)}</td>
                <td>${renderInput(sc, i, 'p1', c.p[0])}</td><td>${renderInput(sc, i, 'w1', c.w[0])}</td>
                <td>${renderInput(sc, i, 'p2', c.p[1])}</td><td>${renderInput(sc, i, 'w2', c.w[1])}</td>
                <td>${renderInput(sc, i, 'p3', c.p[2])}</td><td>${renderInput(sc, i, 'w3', c.w[2])}</td>
                <td>${renderInput(sc, i, 'p4', c.p[3])}</td><td>${renderInput(sc, i, 'w4', c.w[3])}</td>
              </tr>
            `
              )
              .join('')}
            <tr style="background: var(--bg-tertiary); font-weight: 800;">
              <td>SUMME</td>
              <td>100</td>
              <td>${sc.sums.p[0]}</td><td>${renderInput(sc, 'sum', 'w1', sc.sums.w[0])}</td>
              <td>${sc.sums.p[1]}</td><td>${renderInput(sc, 'sum', 'w2', sc.sums.w[1])}</td>
              <td>${sc.sums.p[2]}</td><td>${renderInput(sc, 'sum', 'w3', sc.sums.w[2])}</td>
              <td>${sc.sums.p[3]}</td><td>${renderInput(sc, 'sum', 'w4', sc.sums.w[3])}</td>
            </tr>
          </tbody>
        </table>

        <div class="nwa-conclusion">
          <p class="module-text" style="font-size: 13px; margin-bottom: var(--space-3)"><strong>Entscheidungs-Check:</strong> ${sc.decisionText}</p>
          <label class="module-label">Welcher Anbieter erhält den Auftrag (Zahl 1-4)?</label>
          <input type="text" class="nwa-input-blank" id="inp-decision" style="width: 60px; margin-left: 12px;" placeholder="?">
        </div>

        <div class="module-actions" style="margin-top: var(--space-6)">
          <button class="btn btn-primary" id="btnCheckNWA">Lösung prüfen</button>
          <button class="btn" id="btnShowPath">Rechenweg anzeigen</button>
          <button class="btn" id="btnResetNWA">Zurücksetzen</button>
        </div>
        <div id="nwaFeedback" style="margin-top: var(--space-4)"></div>
        <div id="nwaCalculationPath" style="display:none; margin-top: var(--space-6)"></div>
      </div>
    `;

    setupNav(container);
    setupCheck(container, sc);
    setupPath(container, sc);
  }

  function renderInput(sc, row, col, correctVal) {
    const isBlank = sc.blanks.some((b) => b.row === row && b.col === col);
    if (!isBlank) return correctVal;
    return `<input type="text" class="nwa-input-blank" data-row="${row}" data-col="${col}" placeholder="?">`;
  }

  function setupNav(container) {
    container.querySelector('#prevSc')?.addEventListener('click', () => {
      if (currentScenarioIdx > 0) {
        currentScenarioIdx--;
        renderTraining(container);
      }
    });
    container.querySelector('#nextSc')?.addEventListener('click', () => {
      if (currentScenarioIdx < SCENARIOS.length - 1) {
        currentScenarioIdx++;
        renderTraining(container);
      }
    });
  }

  function setupCheck(container, sc) {
    container.querySelector('#btnCheckNWA').addEventListener('click', () => {
      let allCorrect = true;
      const inputs = container.querySelectorAll(
        '.nwa-input-blank:not(#inp-decision)'
      );

      inputs.forEach((input) => {
        const row = input.dataset.row;
        const col = input.dataset.col;
        const blank = sc.blanks.find((b) => b.row === row && b.col === col);

        input.classList.remove('correct', 'wrong');
        if (input.value.trim() === blank.val) {
          input.classList.add('correct');
        } else {
          input.classList.add('wrong');
          allCorrect = false;
        }
      });

      const decInput = container.querySelector('#inp-decision');
      const decBlank = sc.blanks.find((b) => b.row === 'decision');
      decInput.classList.remove('correct', 'wrong');
      if (decInput.value.trim() === decBlank.val) {
        decInput.classList.add('correct');
      } else {
        decInput.classList.add('wrong');
        allCorrect = false;
      }

      const fb = container.querySelector('#nwaFeedback');
      if (allCorrect) {
        fb.innerHTML = `<div class="module-feedback module-feedback-success"><strong>Hervorragend!</strong> Alles korrekt gelöst.</div>`;
      } else {
        fb.innerHTML = `<div class="module-feedback module-feedback-error">Prüfe die rot markierten Felder. Nutze ggf. den Button "Rechenweg anzeigen".</div>`;
      }
    });

    container
      .querySelector('#btnResetNWA')
      .addEventListener('click', () => renderTraining(container));
  }

  function setupPath(container, sc) {
    container.querySelector('#btnShowPath').addEventListener('click', () => {
      const pathEl = container.querySelector('#nwaCalculationPath');
      pathEl.style.display = pathEl.style.display === 'none' ? 'block' : 'none';

      let html = `<div class="module-steps"><h4 class="module-steps-title">Rechenweg für ${sc.title}</h4>`;

      sc.criteria.forEach((c, _i) => {
        html += `<div class="module-step">
          <div class="module-step-title">${c.name} (Gewichtung: ${c.weight}%)</div>
          <div class="module-step-detail">
            Anbieter 1: ${c.weight} &times; ${c.p[0]} = ${c.w[0]} <br>
            Anbieter 2: ${c.weight} &times; ${c.p[1]} = ${c.w[1]} <br>
            Anbieter 3: ${c.weight} &times; ${c.p[2]} = ${c.w[2]} <br>
            Anbieter 4: ${c.weight} &times; ${c.p[3]} = ${c.w[3]}
          </div>
        </div>`;
      });

      html += `<div class="module-step" style="border-left-color: var(--success)">
        <div class="module-step-title">Gesamtsummen (Nutzwerte)</div>
        <div class="module-step-text">
          A1: ${sc.sums.w[0]} | A2: ${sc.sums.w[1]} | A3: ${sc.sums.w[2]} | A4: ${sc.sums.w[3]}
        </div>
      </div>`;

      html += `</div>`;
      pathEl.innerHTML = html;

      if (pathEl.style.display === 'block') {
        pathEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  function cleanup() {
    cleanup_fns.forEach((fn) => {
      fn();
    });
    cleanup_fns = [];
  }

  return { render, cleanup };
})();

export default NWAView;
