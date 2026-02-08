// ============================================================
// nwa.js — Nutzwertanalyse Interactive Learning Module (Modul 3)
// 4 Tabs: Erklaerung, Aufgaben, Raetsel, Analyse
// ============================================================

const NWAView = (() => {
  let currentTab = 'explanation';
  let cleanup_fns = [];
  const progress = loadProgress();
  let currentExercise = 0;
  let currentPuzzle = 0;
  let exerciseState = {};
  let puzzleState = {};
  let sensitivityWeights = [];

  // ============================================================
  // DATA: Exercises
  // ============================================================

  const EXERCISES = [
    {
      id: 1,
      title: 'Server-Beschaffung',
      difficulty: 'Leicht',
      source: 'AP1 F2024 (angelehnt)',
      description:
        'Dein Unternehmen beschafft neue Server. Vergleiche die drei Anbieter mithilfe einer Nutzwertanalyse. <strong>Bestimme zuerst die fehlende Gewichtung</strong>, berechne dann die Gesamtnutzwerte und waehle den Gewinner.',
      criteria: [
        { name: 'Anschaffungskosten', weight: 30, given: true },
        { name: 'Leistung (CPU/RAM)', weight: 25, given: true },
        { name: 'Wartung & Support', weight: 20, given: true },
        { name: 'Energieeffizienz', weight: 25, given: false },
      ],
      alternatives: ['ServerPro GmbH', 'DataCore AG', 'NetTech Solutions'],
      scores: [
        [8, 6, 9],
        [7, 9, 5],
        [6, 8, 7],
        [5, 7, 8],
      ],
      hint: 'Alle Gewichtungen muessen zusammen 100% ergeben. Berechne zuerst: 100% - 30% - 25% - 20% = ?',
    },
    {
      id: 2,
      title: 'Cloud-Migration',
      difficulty: 'Leicht',
      source: 'AP1 H2024 (angelehnt)',
      description:
        'Dein Unternehmen plant die Migration in die Cloud. Drei Anbieter stehen zur Auswahl. <strong>Ergaenze die fehlende Gewichtung</strong> und ermittle den besten Anbieter.',
      criteria: [
        { name: 'Preis-Leistungs-Verhaeltnis', weight: 35, given: true },
        { name: 'Datensicherheit', weight: 30, given: false },
        { name: 'Skalierbarkeit', weight: 20, given: true },
        { name: 'Herstellersupport', weight: 15, given: true },
      ],
      alternatives: ['CloudAlpha', 'CloudBeta', 'CloudGamma'],
      scores: [
        [7, 8, 6],
        [9, 6, 8],
        [6, 9, 7],
        [5, 7, 9],
      ],
      hint: 'Fehlende Gewichtung = 100% minus Summe der gegebenen Gewichtungen.',
    },
    {
      id: 3,
      title: 'Laptop-Auswahl',
      difficulty: 'Mittel',
      source: 'Uebungsaufgabe',
      description:
        'Die IT-Abteilung vergleicht drei Laptops fuer die Mitarbeiter. Alle Gewichtungen sind gegeben — berechne die Gesamtnutzwerte.',
      criteria: [
        { name: 'Preis', weight: 40, given: true },
        { name: 'Akkulaufzeit', weight: 25, given: true },
        { name: 'Display-Qualitaet', weight: 20, given: true },
        { name: 'Gewicht', weight: 15, given: true },
      ],
      alternatives: ['ThinkPad X1', 'MacBook Air', 'Dell XPS'],
      scores: [
        [7, 4, 8],
        [8, 9, 6],
        [7, 9, 8],
        [6, 8, 7],
      ],
      hint: 'Berechne fuer jedes Kriterium: Punkte × Gewichtung (als Dezimalzahl). Addiere alle Teilnutzwerte pro Alternative.',
    },
    {
      id: 4,
      title: 'Firewall-Loesung',
      difficulty: 'Mittel',
      source: 'AP1-Niveau',
      description:
        'Das Unternehmen benoetigt eine neue Firewall. Drei Produkte stehen zur Auswahl. <strong>Ergaenze die fehlende Gewichtung</strong> und bestimme die beste Loesung.',
      criteria: [
        { name: 'Sicherheitsfunktionen', weight: 35, given: true },
        { name: 'Performance', weight: 20, given: true },
        { name: 'Bedienbarkeit', weight: 15, given: true },
        { name: 'Preis', weight: 30, given: false },
      ],
      alternatives: ['FortiGate', 'Sophos XGS', 'pfSense'],
      scores: [
        [9, 8, 7],
        [7, 6, 8],
        [5, 8, 4],
        [4, 6, 9],
      ],
      hint: 'Vergiss nicht: Die Gewichtung als Dezimalzahl verwenden (z.B. 30% = 0.30).',
    },
    {
      id: 5,
      title: 'Bueroausstattung',
      difficulty: 'Schwer',
      source: 'AP1-Niveau (5 Kriterien)',
      description:
        'Die Geschaeftsfuehrung moechte die Bueros neu ausstatten. Drei Anbieter haben Angebote abgegeben. <strong>Ermittle die fehlende Gewichtung</strong> bei 5 Kriterien und berechne den Gesamtnutzwert.',
      criteria: [
        { name: 'Ergonomie', weight: 25, given: true },
        { name: 'Preis', weight: 20, given: true },
        { name: 'Lieferzeit', weight: 15, given: true },
        { name: 'Qualitaet', weight: 25, given: false },
        { name: 'Nachhaltigkeit', weight: 15, given: true },
      ],
      alternatives: ['MoebelHaus', 'OfficeWorld', 'GreenOffice'],
      scores: [
        [8, 6, 7],
        [6, 9, 5],
        [7, 8, 4],
        [9, 5, 8],
        [4, 3, 9],
      ],
      hint: 'Bei 5 Kriterien: Summe der gegebenen Gewichtungen bilden und von 100% abziehen.',
    },
  ];

  // ============================================================
  // DATA: Gewichtungs-Raetsel (Puzzles)
  // ============================================================

  const PUZZLES = [
    {
      id: 1,
      title: 'Notebook-Beschaffung',
      difficulty: 'Leicht',
      description:
        'Drei Notebooks werden anhand von drei Kriterien verglichen. Die Gewichtung fuer "Akkulaufzeit" ist mit <strong>35%</strong> festgelegt. Die restlichen 65% teilen sich auf "Preis" und "Gewicht" auf, wobei gilt: <strong>Gewicht = 65% - Preis</strong>.',
      question:
        'Wie hoch muss die Gewichtung fuer "Preis" <strong>mindestens</strong> sein (ganzzahlig, in %), damit <strong>Notebook A</strong> den hoechsten Nutzwert hat?',
      criteria: ['Preis', 'Akkulaufzeit', 'Gewicht'],
      fixedWeights: { 1: 35 },
      variableIndex: 0,
      derivedIndex: 2,
      alternatives: ['Notebook A', 'Notebook B', 'Notebook C'],
      scores: [
        [9, 5, 7],
        [4, 8, 6],
        [5, 7, 9],
      ],
      targetWinner: 'Notebook A',
      answer: 56,
      unit: '%',
      explanation:
        'Setze die Nutzwerte gleich und loese nach der Gewichtung auf:\n\nNWA_A(w) = 9×(w/100) + 4×0.35 + 5×((65-w)/100)\nNWA_C(w) = 7×(w/100) + 6×0.35 + 9×((65-w)/100)\n\nA > C ergibt: w > 55 → mindestens 56%\n(A > B ist bereits ab w > 45 erfuellt)',
    },
    {
      id: 2,
      title: 'IT-Dienstleister',
      difficulty: 'Mittel',
      description:
        'Drei IT-Dienstleister werden verglichen. Feste Gewichtungen: <strong>Preis = 25%</strong> und <strong>Sicherheit = 30%</strong>. Die restlichen 45% teilen sich auf "Leistung" und "Support" auf: <strong>Support = 45% - Leistung</strong>.',
      question:
        'Wie hoch muss die Gewichtung fuer "Leistung" <strong>mindestens</strong> sein (ganzzahlig, in %), damit <strong>Alpha</strong> gewinnt?',
      criteria: ['Preis', 'Leistung', 'Sicherheit', 'Support'],
      fixedWeights: { 0: 25, 2: 30 },
      variableIndex: 1,
      derivedIndex: 3,
      alternatives: ['Alpha', 'Beta', 'Gamma'],
      scores: [
        [7, 8, 5],
        [9, 4, 6],
        [5, 7, 8],
        [4, 9, 7],
      ],
      targetWinner: 'Alpha',
      answer: 35,
      unit: '%',
      explanation:
        'Mit festen Gewichtungen Preis=25%, Sicherheit=30%:\nLeistung = w%, Support = (45-w)%\n\nAlpha > Gamma ergibt: w > 34.17 → mindestens 35%\nAlpha > Beta ergibt: w > 31\n\nBeide Bedingungen: w >= 35%',
    },
    {
      id: 3,
      title: 'Kipppunkt finden',
      difficulty: 'Mittel',
      description:
        'Zwei Firmen werden anhand von drei Kriterien verglichen. <strong>Qualitaet</strong> ist mit <strong>40%</strong> fest. "Preis" und "Lieferzeit" teilen sich die restlichen 60%: <strong>Lieferzeit = 60% - Preis</strong>.',
      question:
        'Ab welcher Gewichtung fuer "Preis" (ganzzahlig, in %) gewinnt <strong>Firma X</strong> statt Firma Y?',
      criteria: ['Preis', 'Qualitaet', 'Lieferzeit'],
      fixedWeights: { 1: 40 },
      variableIndex: 0,
      derivedIndex: 2,
      alternatives: ['Firma X', 'Firma Y'],
      scores: [
        [9, 4],
        [5, 8],
        [3, 7],
      ],
      targetWinner: 'Firma X',
      answer: 41,
      unit: '%',
      explanation:
        'Gleichsetzen: NWA_X(w) = NWA_Y(w)\n\n9×(w/100) + 5×0.40 + 3×((60-w)/100) = 4×(w/100) + 8×0.40 + 7×((60-w)/100)\n\nVereinfacht: 9w = 360 → w = 40\n\nBei 40% sind beide gleichauf (6.20).\nAb 41% gewinnt Firma X.',
    },
    {
      id: 4,
      title: 'Minimale Aenderung',
      difficulty: 'Schwer',
      description:
        'Aktuelle Gewichtungen: <strong>Preis = 30%, Leistung = 40%, Support = 30%</strong>. Aktuell gewinnt Anbieter B. Die Geschaeftsfuehrung moechte die Gewichtung von "Preis" erhoehen — <strong>auf Kosten von "Leistung"</strong> (Support bleibt bei 30%).',
      question:
        'Um wie viele <strong>Prozentpunkte</strong> muss die Gewichtung von "Preis" mindestens steigen, damit <strong>Anbieter A</strong> gewinnt?',
      criteria: ['Preis', 'Leistung', 'Support'],
      fixedWeights: { 2: 30 },
      variableIndex: 0,
      derivedIndex: 1,
      alternatives: ['Anbieter A', 'Anbieter B'],
      scores: [
        [9, 5],
        [4, 8],
        [6, 6],
      ],
      targetWinner: 'Anbieter A',
      answer: 6,
      unit: 'Prozentpunkte',
      baseWeights: { 0: 30, 1: 40, 2: 30 },
      explanation:
        'Aktuelle Gewichte: Preis=30%, Leistung=40%, Support=30%\nErhoehung von Preis um x → Preis=(30+x)%, Leistung=(40-x)%\n\nA = 9×(30+x)/100 + 4×(40-x)/100 + 6×0.30\nB = 5×(30+x)/100 + 8×(40-x)/100 + 6×0.30\n\nA > B: 8x > 40 → x > 5 → mindestens 6 Prozentpunkte\n(Preis: 36%, Leistung: 34%)',
    },
  ];

  // ============================================================
  // DATA: Sensitivity Analysis Scenario
  // ============================================================

  const SENSITIVITY = {
    title: 'IT-Dienstleister Auswahl',
    description:
      'Dein Unternehmen sucht einen externen IT-Dienstleister. Verschiebe die Gewichtungen mit den Schiebereglern und beobachte, wie sich das Ergebnis veraendert!',
    criteria: ['Preis', 'Fachkompetenz', 'Reaktionszeit', 'Referenzen'],
    alternatives: ['TechPro', 'DataServ', 'CloudFix'],
    defaultWeights: [25, 30, 25, 20],
    scores: [
      [8, 5, 7],
      [6, 9, 7],
      [7, 6, 9],
      [5, 8, 6],
    ],
  };

  const _ALT_COLORS = [
    'var(--accent-primary)',
    'var(--success)',
    'var(--warning)',
  ];
  const ALT_COLORS_RAW = ['#5a7a96', '#5a9e7c', '#c4a35a'];

  // ============================================================
  // PROGRESS
  // ============================================================

  function loadProgress() {
    try {
      const raw = localStorage.getItem('ap1_nwa_progress');
      return raw ? JSON.parse(raw) : { exercises: [], puzzles: [] };
    } catch {
      return { exercises: [], puzzles: [] };
    }
  }

  function saveProgress() {
    localStorage.setItem('ap1_nwa_progress', JSON.stringify(progress));
  }

  function markExerciseComplete(id) {
    if (!progress.exercises.includes(id)) {
      progress.exercises.push(id);
      saveProgress();
    }
  }

  function markPuzzleComplete(id) {
    if (!progress.puzzles.includes(id)) {
      progress.puzzles.push(id);
      saveProgress();
    }
  }

  // ============================================================
  // CALCULATION
  // ============================================================

  function calcWeightedScores(exercise) {
    const weights = exercise.criteria.map((c) => c.weight / 100);
    const numAlts = exercise.alternatives.length;
    const partial = [];
    const totals = [];

    for (let ci = 0; ci < exercise.criteria.length; ci++) {
      const row = [];
      for (let ai = 0; ai < numAlts; ai++) {
        row.push(Math.round(exercise.scores[ci][ai] * weights[ci] * 100) / 100);
      }
      partial.push(row);
    }

    for (let ai = 0; ai < numAlts; ai++) {
      let total = 0;
      for (let ci = 0; ci < exercise.criteria.length; ci++) {
        total += partial[ci][ai];
      }
      totals.push(Math.round(total * 100) / 100);
    }

    return { partial, totals };
  }

  function calcSensitivityScores(weights, scores, numAlts) {
    const totals = [];
    for (let ai = 0; ai < numAlts; ai++) {
      let total = 0;
      for (let ci = 0; ci < weights.length; ci++) {
        total += scores[ci][ai] * (weights[ci] / 100);
      }
      totals.push(Math.round(total * 100) / 100);
    }
    return totals;
  }

  function getMissingWeight(exercise) {
    const givenSum = exercise.criteria
      .filter((c) => c.given)
      .reduce((s, c) => s + c.weight, 0);
    return 100 - givenSum;
  }

  function getWinnerIndex(totals) {
    let maxIdx = 0;
    for (let i = 1; i < totals.length; i++) {
      if (totals[i] > totals[maxIdx]) maxIdx = i;
    }
    return maxIdx;
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================

  function render(container) {
    cleanup();

    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header" style="margin-bottom: var(--space-6);">
          <div class="page-header-left">
            <div>
              <h1 style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--text-primary); margin: 0;">
                Nutzwertanalyse
              </h1>
              <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin: var(--space-1) 0 0;">
                Kriterien gewichten, Alternativen bewerten, Entscheidungen treffen
              </p>
            </div>
          </div>
        </div>
        <div class="module-tabs" id="nwaTabs"></div>
        <div id="nwaContent"></div>
      </div>
    `;

    renderTabs();
    renderTabContent();
  }

  function renderTabs() {
    const tabsEl = document.getElementById('nwaTabs');
    if (!tabsEl) return;

    const tabs = [
      { id: 'explanation', label: 'Erklaerung' },
      { id: 'exercises', label: 'Aufgaben' },
      { id: 'puzzles', label: 'Raetsel' },
      { id: 'sensitivity', label: 'Analyse' },
    ];

    tabsEl.innerHTML = tabs
      .map(
        (t) =>
          `<button class="module-tab ${currentTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`
      )
      .join('');

    tabsEl.querySelectorAll('.module-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        renderTabs();
        renderTabContent();
      });
    });
  }

  function renderTabContent() {
    const contentEl = document.getElementById('nwaContent');
    if (!contentEl) return;

    switch (currentTab) {
      case 'explanation':
        renderExplanation(contentEl);
        break;
      case 'exercises':
        renderExercises(contentEl);
        break;
      case 'puzzles':
        renderPuzzles(contentEl);
        break;
      case 'sensitivity':
        renderSensitivity(contentEl);
        break;
    }
  }

  // ============================================================
  // TAB 1: ERKLAERUNG
  // ============================================================

  function renderExplanation(container) {
    container.innerHTML = `
      <div class="module-exercise-card">
        <h3 style="color: var(--text-primary); margin: 0 0 var(--space-4);">Was ist eine Nutzwertanalyse?</h3>
        <p style="color: var(--text-secondary); line-height: var(--line-height-relaxed); margin-bottom: var(--space-4);">
          Die <strong style="color: var(--text-primary);">Nutzwertanalyse (NWA)</strong> ist ein Bewertungsverfahren, um
          mehrere Alternativen anhand von <strong style="color: var(--text-primary);">qualitativen und quantitativen Kriterien</strong>
          systematisch zu vergleichen. Sie wird eingesetzt, wenn ein reiner Preisvergleich nicht ausreicht — zum Beispiel bei
          der Auswahl von Software, Dienstleistern oder Hardware.
        </p>
        <div class="nwa-info-box">
          <strong>Wichtig fuer die AP1:</strong> Die NWA kam in fast jeder bisherigen Pruefung vor und bringt hohe Punktzahlen!
          Typische Aufgaben: fehlende Gewichtung berechnen, Nutzwerte ermitteln, Ergebnis begruenden.
        </div>

        <h3 style="color: var(--text-primary); margin: var(--space-8) 0 var(--space-4);">Die 6 Schritte der NWA</h3>
        <div class="nwa-steps-grid">
          <div class="nwa-step-card">
            <div class="nwa-step-number">1</div>
            <div><strong style="color: var(--text-primary);">Kriterien festlegen</strong>
            <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin: var(--space-1) 0 0;">
              Welche Eigenschaften sind fuer die Entscheidung relevant?</p></div>
          </div>
          <div class="nwa-step-card">
            <div class="nwa-step-number">2</div>
            <div><strong style="color: var(--text-primary);">Gewichtungen vergeben</strong>
            <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin: var(--space-1) 0 0;">
              Wie wichtig ist jedes Kriterium? Summe muss <strong>100%</strong> ergeben!</p></div>
          </div>
          <div class="nwa-step-card">
            <div class="nwa-step-number">3</div>
            <div><strong style="color: var(--text-primary);">Alternativen bewerten</strong>
            <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin: var(--space-1) 0 0;">
              Punkte vergeben (z.B. 1-10) fuer jede Alternative pro Kriterium.</p></div>
          </div>
          <div class="nwa-step-card">
            <div class="nwa-step-number">4</div>
            <div><strong style="color: var(--text-primary);">Teilnutzwerte berechnen</strong>
            <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin: var(--space-1) 0 0;">
              Punkte × Gewichtung = gewichteter Teilnutzwert</p></div>
          </div>
          <div class="nwa-step-card">
            <div class="nwa-step-number">5</div>
            <div><strong style="color: var(--text-primary);">Gesamtnutzwerte berechnen</strong>
            <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin: var(--space-1) 0 0;">
              Alle Teilnutzwerte einer Alternative addieren.</p></div>
          </div>
          <div class="nwa-step-card">
            <div class="nwa-step-number">6</div>
            <div><strong style="color: var(--text-primary);">Ergebnis & Begruendung</strong>
            <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin: var(--space-1) 0 0;">
              Hoechster Nutzwert gewinnt. Entscheidung begruenden!</p></div>
          </div>
        </div>

        <h3 style="color: var(--text-primary); margin: var(--space-8) 0 var(--space-4);">Die Formel</h3>
        <div class="nwa-formula-box">
          <div class="nwa-formula-main">
            <span class="nwa-formula-highlight">Gesamtnutzwert</span> =
            (Punkte<sub>1</sub> &times; Gewichtung<sub>1</sub>) +
            (Punkte<sub>2</sub> &times; Gewichtung<sub>2</sub>) +
            &hellip; +
            (Punkte<sub>n</sub> &times; Gewichtung<sub>n</sub>)
          </div>
        </div>

        <h3 style="color: var(--text-primary); margin: var(--space-8) 0 var(--space-4);">Beispiel: Welcher Drucker?</h3>
        <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-3);">
          Zwei Drucker werden anhand von Druckqualitaet (60%) und Geschwindigkeit (40%) verglichen:
        </p>
        <div class="nwa-table-scroll">
          <table class="nwa-table">
            <thead>
              <tr>
                <th>Kriterium</th><th>Gewichtung</th><th>Drucker A</th><th>Drucker B</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Druckqualitaet</td><td>60%</td><td>8</td><td>6</td></tr>
              <tr><td>Geschwindigkeit</td><td>40%</td><td>5</td><td>9</td></tr>
            </tbody>
          </table>
        </div>

        <div class="nwa-example-calc">
          <div class="nwa-calc-line">
            <strong>Drucker A:</strong>
            <span class="nwa-calc-formula">(8 &times; 0.60) + (5 &times; 0.40) = 4.80 + 2.00 = <strong>6.80</strong></span>
          </div>
          <div class="nwa-calc-line">
            <strong>Drucker B:</strong>
            <span class="nwa-calc-formula">(6 &times; 0.60) + (9 &times; 0.40) = 3.60 + 3.60 = <strong>7.20</strong></span>
          </div>
          <div class="nwa-calc-result">
            Drucker B gewinnt mit <strong>7.20</strong> Punkten!
          </div>
        </div>

        <h3 style="color: var(--text-primary); margin: var(--space-8) 0 var(--space-4);">Pruefungstipps</h3>
        <div class="nwa-tips-grid">
          <div class="nwa-tip">
            <span class="nwa-tip-icon">&#x26A0;</span>
            <span>Gewichtungen <strong>muessen immer 100%</strong> ergeben — pruefe das zuerst!</span>
          </div>
          <div class="nwa-tip">
            <span class="nwa-tip-icon">&#x2714;</span>
            <span>Der <strong>hoechste Gesamtnutzwert</strong> gewinnt (nicht der niedrigste!).</span>
          </div>
          <div class="nwa-tip">
            <span class="nwa-tip-icon">&#x1F4CA;</span>
            <span>Gewichtung als <strong>Dezimalzahl</strong> verwenden: 30% = 0.30</span>
          </div>
          <div class="nwa-tip">
            <span class="nwa-tip-icon">&#x270D;</span>
            <span>Ergebnis immer <strong>begruenden</strong>: "Anbieter X wird empfohlen, da..."</span>
          </div>
          <div class="nwa-tip">
            <span class="nwa-tip-icon">&#x2260;</span>
            <span>NWA ≠ Angebotsvergleich! NWA = <strong>qualitativ</strong>, Angebotsvergleich = <strong>quantitativ</strong> (Bezugspreis).</span>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // TAB 2: AUFGABEN (Exercises)
  // ============================================================

  function renderExercises(container) {
    exerciseState = {
      weightConfirmed: false,
      checked: false,
      showSolution: false,
    };
    const ex = EXERCISES[currentExercise];

    // Check if all weights are given
    const hasMissingWeight = ex.criteria.some((c) => !c.given);
    if (!hasMissingWeight) exerciseState.weightConfirmed = true;

    container.innerHTML = `
      <div class="nwa-exercise-nav">
        ${EXERCISES.map(
          (e, i) => `
          <button class="nwa-exercise-btn ${i === currentExercise ? 'active' : ''}"
                  data-idx="${i}">
            <span class="nwa-exercise-btn-num">${i + 1}</span>
            <span class="nwa-exercise-btn-title">${e.title}</span>

          </button>
        `
        ).join('')}
      </div>
      <div id="nwaExerciseContent"></div>
    `;

    container.querySelectorAll('.nwa-exercise-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentExercise = parseInt(btn.dataset.idx, 10);
        renderExercises(container);
      });
    });

    renderExerciseContent(ex, hasMissingWeight);
  }

  function renderExerciseContent(ex, hasMissingWeight) {
    const contentEl = document.getElementById('nwaExerciseContent');
    if (!contentEl) return;

    const _missingIdx = ex.criteria.findIndex((c) => !c.given);
    const missingWeight = hasMissingWeight ? getMissingWeight(ex) : null;
    const { partial, totals } = calcWeightedScores(ex);
    const winnerIdx = getWinnerIndex(totals);

    contentEl.innerHTML = `
      <div class="module-exercise-card">
        <div class="module-exercise-header" style="display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;">
          <span class="module-exercise-badge">Aufgabe ${currentExercise + 1}/${EXERCISES.length}</span>
          <span class="nwa-diff-badge nwa-diff-${ex.difficulty.toLowerCase()}">${ex.difficulty}</span>
          <span style="color: var(--text-tertiary); font-size: var(--font-size-xs);">${ex.source}</span>
        </div>

        <h3 style="color: var(--text-primary); margin: var(--space-3) 0;">${ex.title}</h3>
        <p class="module-exercise-question">${ex.description}</p>

        <div class="nwa-formula-box nwa-formula-compact">
          <strong>Formel:</strong>
          (Punkte &times; Gewichtung) + (Punkte &times; Gewichtung) + &hellip; = <strong>Gesamtnutzwert</strong>
        </div>

        <!-- Score Table -->
        <div class="nwa-table-scroll">
          <table class="nwa-table">
            <thead>
              <tr>
                <th>Kriterium</th>
                <th>Gewichtung</th>
                ${ex.alternatives.map((a) => `<th>${a}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${ex.criteria
                .map(
                  (c, ci) => `
                <tr>
                  <td>${c.name}</td>
                  <td>
                    ${
                      c.given
                        ? `<span class="nwa-weight-given">${c.weight}%</span>`
                        : `<div class="nwa-weight-input-wrap">
                          <input type="number" class="nwa-weight-input" id="nwaWeightInput"
                            min="0" max="100" step="1" placeholder="?"
                            ${exerciseState.weightConfirmed ? 'disabled' : ''}>
                          <span class="nwa-weight-unit">%</span>
                        </div>`
                    }
                  </td>
                  ${ex.scores[ci].map((s) => `<td class="nwa-score-cell">${s}</td>`).join('')}
                </tr>
              `
                )
                .join('')}
              ${
                exerciseState.checked || exerciseState.showSolution
                  ? `
                <tr class="nwa-table-separator"><td colspan="${2 + ex.alternatives.length}">Gewichtete Teilnutzwerte</td></tr>
                ${ex.criteria
                  .map(
                    (c, ci) => `
                  <tr class="nwa-partial-row">
                    <td style="color: var(--text-tertiary); font-size: var(--font-size-xs);">${c.name}</td>
                    <td style="color: var(--text-tertiary); font-size: var(--font-size-xs);">${c.weight}% &times;</td>
                    ${partial[ci]
                      .map(
                        (p, ai) => `
                      <td class="nwa-partial-cell">${ex.scores[ci][ai]} &times; ${(c.weight / 100).toFixed(2)} = <strong>${p.toFixed(2)}</strong></td>
                    `
                      )
                      .join('')}
                  </tr>
                `
                  )
                  .join('')}
              `
                  : ''
              }
              <tr class="nwa-total-row">
                <td><strong>Gesamtnutzwert</strong></td>
                <td></td>
                ${ex.alternatives
                  .map(
                    (_a, ai) => `
                  <td>
                    <input type="number" class="nwa-total-input" id="nwaTotal${ai}"
                      step="0.01" placeholder="?"
                      ${exerciseState.checked || exerciseState.showSolution ? 'disabled' : ''}>
                  </td>
                `
                  )
                  .join('')}
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Winner Selection -->
        <div class="nwa-winner-section">
          <label class="nwa-winner-label">Gewinner:</label>
          <div class="nwa-winner-options">
            ${ex.alternatives
              .map(
                (a, ai) => `
              <label class="nwa-winner-radio">
                <input type="radio" name="nwaWinner" value="${ai}"
                  ${exerciseState.checked || exerciseState.showSolution ? 'disabled' : ''}>
                <span>${a}</span>
              </label>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Actions -->
        <div class="module-actions">
          ${
            hasMissingWeight && !exerciseState.weightConfirmed
              ? `<button class="btn btn-primary" id="nwaCheckWeight">Gewichtung pruefen</button>`
              : ''
          }
          ${
            exerciseState.weightConfirmed &&
            !exerciseState.checked &&
            !exerciseState.showSolution
              ? `<button class="btn btn-primary" id="nwaCheck">Pruefen</button>`
              : ''
          }
          ${
            !exerciseState.showSolution
              ? `<button class="btn" id="nwaHint" style="background: var(--bg-tertiary); color: var(--text-secondary);">Tipp</button>
               <button class="btn" id="nwaShowSolution" style="background: var(--bg-tertiary); color: var(--text-secondary);">Loesung anzeigen</button>`
              : ''
          }
          ${
            currentExercise < EXERCISES.length - 1
              ? `<button class="btn" id="nwaNext" style="background: var(--bg-tertiary); color: var(--text-secondary);">Naechste Aufgabe &rarr;</button>`
              : ''
          }
        </div>

        <div id="nwaFeedback"></div>
        <div id="nwaSolution"></div>
      </div>
    `;

    // Show confirmed weight value
    if (exerciseState.weightConfirmed && hasMissingWeight) {
      const weightInput = document.getElementById('nwaWeightInput');
      if (weightInput) {
        weightInput.value = missingWeight;
        weightInput.classList.add('module-input-correct');
      }
    }

    // Show checked values
    if (exerciseState.checked || exerciseState.showSolution) {
      showExerciseResults(ex, totals, winnerIdx);
    }

    // Show solution steps
    if (exerciseState.showSolution) {
      showExerciseSolution(ex, partial, totals, winnerIdx);
    }

    // Event listeners
    setupExerciseEvents(
      ex,
      hasMissingWeight,
      missingWeight,
      totals,
      winnerIdx,
      partial
    );
  }

  function setupExerciseEvents(
    ex,
    hasMissingWeight,
    missingWeight,
    totals,
    winnerIdx,
    _partial
  ) {
    const checkWeightBtn = document.getElementById('nwaCheckWeight');
    const checkBtn = document.getElementById('nwaCheck');
    const hintBtn = document.getElementById('nwaHint');
    const solutionBtn = document.getElementById('nwaShowSolution');
    const nextBtn = document.getElementById('nwaNext');

    if (checkWeightBtn) {
      checkWeightBtn.addEventListener('click', () => {
        const input = document.getElementById('nwaWeightInput');
        const val = parseInt(input.value, 10);
        const feedbackEl = document.getElementById('nwaFeedback');

        if (val === missingWeight) {
          exerciseState.weightConfirmed = true;
          renderExerciseContent(ex, hasMissingWeight);
          showFeedback(
            document.getElementById('nwaFeedback'),
            true,
            `Richtig! Die fehlende Gewichtung betraegt <strong>${missingWeight}%</strong> (100% - ${ex.criteria
              .filter((c) => c.given)
              .map((c) => `${c.weight}%`)
              .join(
                ' - '
              )} = ${missingWeight}%). Berechne jetzt die Gesamtnutzwerte!`
          );
        } else {
          input.classList.add('module-input-wrong');
          showFeedback(
            feedbackEl,
            false,
            'Nicht korrekt. Denke daran: Alle Gewichtungen muessen zusammen 100% ergeben.'
          );
        }
      });
    }

    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        let allCorrect = true;
        let winnerCorrect = false;

        // Check totals
        for (let ai = 0; ai < ex.alternatives.length; ai++) {
          const input = document.getElementById(`nwaTotal${ai}`);
          const val = parseFloat(input.value);
          if (Math.abs(val - totals[ai]) < 0.02) {
            input.classList.add('module-input-correct');
          } else {
            input.classList.add('module-input-wrong');
            allCorrect = false;
          }
        }

        // Check winner
        const winnerRadio = document.querySelector(
          'input[name="nwaWinner"]:checked'
        );
        if (winnerRadio && parseInt(winnerRadio.value, 10) === winnerIdx) {
          winnerCorrect = true;
        } else {
          allCorrect = false;
        }

        exerciseState.checked = true;
        const feedbackEl = document.getElementById('nwaFeedback');

        if (allCorrect && winnerCorrect) {
          markExerciseComplete(ex.id);
          showFeedback(
            feedbackEl,
            true,
            `Perfekt! ${ex.alternatives[winnerIdx]} gewinnt mit einem Nutzwert von <strong>${totals[winnerIdx].toFixed(2)}</strong>.`
          );
        } else {
          let msg = 'Nicht ganz richtig. ';
          if (!allCorrect) msg += 'Pruefe deine Berechnungen. ';
          if (!winnerCorrect) msg += 'Der Gewinner ist nicht korrekt. ';
          showFeedback(feedbackEl, false, msg);
        }

        // Re-render to show partial scores
        renderExerciseContent(ex, hasMissingWeight);
        // Re-apply feedback
        if (allCorrect && winnerCorrect) {
          showFeedback(
            document.getElementById('nwaFeedback'),
            true,
            `Perfekt! ${ex.alternatives[winnerIdx]} gewinnt mit einem Nutzwert von <strong>${totals[winnerIdx].toFixed(2)}</strong>.`
          );
        }
      });
    }

    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        const feedbackEl = document.getElementById('nwaFeedback');
        showFeedback(feedbackEl, null, ex.hint);
      });
    }

    if (solutionBtn) {
      solutionBtn.addEventListener('click', () => {
        exerciseState.showSolution = true;
        exerciseState.weightConfirmed = true;
        markExerciseComplete(ex.id);
        renderExerciseContent(ex, hasMissingWeight);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentExercise++;
        const parentEl = document.getElementById('nwaContent');
        if (parentEl) renderExercises(parentEl);
      });
    }
  }

  function showExerciseResults(ex, totals, winnerIdx) {
    for (let ai = 0; ai < ex.alternatives.length; ai++) {
      const input = document.getElementById(`nwaTotal${ai}`);
      if (input && !input.value) {
        input.value = totals[ai].toFixed(2);
      }
      if (input && exerciseState.showSolution) {
        input.value = totals[ai].toFixed(2);
        input.classList.add('module-input-correct');
      }
    }

    // Highlight winner radio
    if (exerciseState.showSolution) {
      const radio = document.querySelector(
        `input[name="nwaWinner"][value="${winnerIdx}"]`
      );
      if (radio) radio.checked = true;
    }
  }

  function showExerciseSolution(ex, partial, totals, winnerIdx) {
    const solutionEl = document.getElementById('nwaSolution');
    if (!solutionEl) return;

    const missingCrit = ex.criteria.find((c) => !c.given);
    let stepsHtml =
      '<div class="module-steps"><div class="module-steps-title">Loesungsweg</div>';

    if (missingCrit) {
      const _givenSum = ex.criteria
        .filter((c) => c.given)
        .reduce((s, c) => s + c.weight, 0);
      stepsHtml += `
        <div class="module-step">
          <div class="module-step-title">Schritt 1: Fehlende Gewichtung</div>
          <div class="module-step-text">100% - ${ex.criteria
            .filter((c) => c.given)
            .map((c) => `${c.weight}%`)
            .join(' - ')} = ${missingCrit.weight}%</div>
        </div>
      `;
    }

    stepsHtml += `
      <div class="module-step">
        <div class="module-step-title">Schritt ${missingCrit ? '2' : '1'}: Gewichtete Teilnutzwerte</div>
        <div class="module-step-text">Fuer jede Alternative: Punkte &times; Gewichtung</div>
        <pre class="module-step-detail">${ex.alternatives
          .map((a, ai) => {
            return `${a}:\n${ex.criteria
              .map(
                (c, ci) =>
                  `  ${c.name}: ${ex.scores[ci][ai]} × ${(c.weight / 100).toFixed(2)} = ${partial[ci][ai].toFixed(2)}`
              )
              .join('\n')}`;
          })
          .join('\n\n')}</pre>
      </div>
    `;

    stepsHtml += `
      <div class="module-step">
        <div class="module-step-title">Schritt ${missingCrit ? '3' : '2'}: Gesamtnutzwerte</div>
        <div class="module-step-text">Teilnutzwerte addieren:</div>
        <pre class="module-step-detail">${ex.alternatives
          .map((a, ai) => {
            const parts = ex.criteria.map((_c, ci) =>
              partial[ci][ai].toFixed(2)
            );
            return `${a}: ${parts.join(' + ')} = ${totals[ai].toFixed(2)}`;
          })
          .join('\n')}</pre>
      </div>
    `;

    stepsHtml += `
      <div class="module-step">
        <div class="module-step-title">Ergebnis</div>
        <div class="module-step-text">
          <strong style="color: var(--success);">${ex.alternatives[winnerIdx]}</strong> hat den hoechsten Nutzwert
          (<strong>${totals[winnerIdx].toFixed(2)}</strong>) und sollte gewaehlt werden.
        </div>
        <div class="nwa-result-chart" id="nwaSolutionChart"></div>
      </div>
    `;

    stepsHtml += '</div>';
    solutionEl.innerHTML = stepsHtml;

    // Render bar chart in solution
    const chartEl = document.getElementById('nwaSolutionChart');
    if (chartEl) renderBarChart(chartEl, ex.alternatives, totals, 10);
  }

  // ============================================================
  // TAB 3: GEWICHTUNGS-RAETSEL (Puzzles)
  // ============================================================

  function renderPuzzles(container) {
    puzzleState = { checked: false, showSolution: false };
    const puzzle = PUZZLES[currentPuzzle];

    container.innerHTML = `
      <div class="nwa-exercise-nav">
        ${PUZZLES.map(
          (p, i) => `
          <button class="nwa-exercise-btn ${i === currentPuzzle ? 'active' : ''} ${progress.puzzles.includes(p.id) ? 'completed' : ''}"
                  data-idx="${i}">
            <span class="nwa-exercise-btn-num">${i + 1}</span>
            <span class="nwa-exercise-btn-title">${p.title}</span>
            ${progress.puzzles.includes(p.id) ? '<span class="nwa-exercise-check">&#x2713;</span>' : ''}
          </button>
        `
        ).join('')}
      </div>
      <div id="nwaPuzzleContent"></div>
    `;

    container.querySelectorAll('.nwa-exercise-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentPuzzle = parseInt(btn.dataset.idx, 10);
        renderPuzzles(container);
      });
    });

    renderPuzzleContent(puzzle);
  }

  function renderPuzzleContent(puzzle) {
    const contentEl = document.getElementById('nwaPuzzleContent');
    if (!contentEl) return;

    contentEl.innerHTML = `
      <div class="module-exercise-card">
        <div class="module-exercise-header" style="display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;">
          <span class="module-exercise-badge">Raetsel ${currentPuzzle + 1}/${PUZZLES.length}</span>
          <span class="nwa-diff-badge nwa-diff-${puzzle.difficulty.toLowerCase()}">${puzzle.difficulty}</span>
        </div>

        <h3 style="color: var(--text-primary); margin: var(--space-3) 0;">${puzzle.title}</h3>
        <p class="module-exercise-question">${puzzle.description}</p>

        <!-- Score Table (read-only) -->
        <div class="nwa-table-scroll">
          <table class="nwa-table">
            <thead>
              <tr>
                <th>Kriterium</th>
                ${puzzle.alternatives.map((a) => `<th>${a}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${puzzle.criteria
                .map(
                  (c, ci) => `
                <tr>
                  <td>${c}${puzzle.fixedWeights[ci] !== undefined ? ` <span class="nwa-weight-tag">${puzzle.fixedWeights[ci]}%</span>` : ci === puzzle.variableIndex ? ' <span class="nwa-weight-tag nwa-weight-variable">?%</span>' : ` <span class="nwa-weight-tag nwa-weight-derived">&rarr;</span>`}</td>
                  ${puzzle.scores[ci].map((s) => `<td class="nwa-score-cell">${s}</td>`).join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <!-- Question -->
        <div class="nwa-puzzle-question">
          <p>${puzzle.question}</p>
          <div class="nwa-puzzle-input-wrap">
            <input type="number" class="nwa-puzzle-input" id="nwaPuzzleAnswer"
              min="0" max="100" step="1" placeholder="?"
              ${puzzleState.checked || puzzleState.showSolution ? 'disabled' : ''}>
            <span class="nwa-puzzle-unit">${puzzle.unit}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="module-actions">
          ${
            !puzzleState.checked && !puzzleState.showSolution
              ? `<button class="btn btn-primary" id="nwaPuzzleCheck">Pruefen</button>`
              : ''
          }
          ${
            !puzzleState.showSolution
              ? `<button class="btn" id="nwaPuzzleSolution" style="background: var(--bg-tertiary); color: var(--text-secondary);">Loesung anzeigen</button>`
              : ''
          }
          ${
            currentPuzzle < PUZZLES.length - 1
              ? `<button class="btn" id="nwaPuzzleNext" style="background: var(--bg-tertiary); color: var(--text-secondary);">Naechstes Raetsel &rarr;</button>`
              : ''
          }
        </div>

        <div id="nwaPuzzleFeedback"></div>
        <div id="nwaPuzzleSolutionSteps"></div>
      </div>
    `;

    // Show result if already solved
    if (puzzleState.checked || puzzleState.showSolution) {
      const input = document.getElementById('nwaPuzzleAnswer');
      if (input) {
        input.value = puzzle.answer;
        input.classList.add('module-input-correct');
      }
    }

    if (puzzleState.showSolution) {
      showPuzzleSolution(puzzle);
    }

    // Event listeners
    setupPuzzleEvents(puzzle);
  }

  function setupPuzzleEvents(puzzle) {
    const checkBtn = document.getElementById('nwaPuzzleCheck');
    const solutionBtn = document.getElementById('nwaPuzzleSolution');
    const nextBtn = document.getElementById('nwaPuzzleNext');

    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        const input = document.getElementById('nwaPuzzleAnswer');
        const val = parseInt(input.value, 10);
        const feedbackEl = document.getElementById('nwaPuzzleFeedback');

        if (val === puzzle.answer) {
          puzzleState.checked = true;
          markPuzzleComplete(puzzle.id);
          input.classList.add('module-input-correct');
          input.disabled = true;
          showFeedback(
            feedbackEl,
            true,
            `Richtig! Die Antwort ist <strong>${puzzle.answer} ${puzzle.unit}</strong>.`
          );
          showPuzzleSolution(puzzle);
        } else {
          input.classList.add('module-input-wrong');
          let hint = '';
          if (val !== null && !Number.isNaN(val)) {
            if (val < puzzle.answer) hint = ' Dein Wert ist zu niedrig.';
            else hint = ' Dein Wert ist zu hoch.';
          }
          showFeedback(
            feedbackEl,
            false,
            `Leider nicht korrekt.${hint} Versuche es nochmal!`
          );
          setTimeout(() => input.classList.remove('module-input-wrong'), 1500);
        }
      });
    }

    if (solutionBtn) {
      solutionBtn.addEventListener('click', () => {
        puzzleState.showSolution = true;
        markPuzzleComplete(puzzle.id);
        renderPuzzleContent(puzzle);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentPuzzle++;
        const parentEl = document.getElementById('nwaContent');
        if (parentEl) renderPuzzles(parentEl);
      });
    }
  }

  function showPuzzleSolution(puzzle) {
    const solEl = document.getElementById('nwaPuzzleSolutionSteps');
    if (!solEl) return;

    solEl.innerHTML = `
      <div class="module-steps">
        <div class="module-steps-title">Loesungsweg</div>
        <div class="module-step">
          <div class="module-step-title">Loesung: ${puzzle.answer} ${puzzle.unit}</div>
          <pre class="module-step-detail">${puzzle.explanation}</pre>
        </div>
      </div>
    `;
  }

  // ============================================================
  // TAB 4: SENSITIVITAETS-ANALYSE
  // ============================================================

  function renderSensitivity(container) {
    sensitivityWeights = [...SENSITIVITY.defaultWeights];

    container.innerHTML = `
      <div class="module-exercise-card">
        <h3 style="color: var(--text-primary); margin: 0 0 var(--space-2);">${SENSITIVITY.title}</h3>
        <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-4);">
          ${SENSITIVITY.description}
        </p>

        <!-- Reference scores -->
        <div class="nwa-table-scroll" style="margin-bottom: var(--space-6);">
          <table class="nwa-table">
            <thead>
              <tr>
                <th>Kriterium</th>
                ${SENSITIVITY.alternatives.map((a) => `<th>${a}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${SENSITIVITY.criteria
                .map(
                  (c, ci) => `
                <tr>
                  <td>${c}</td>
                  ${SENSITIVITY.scores[ci].map((s, _ai) => `<td class="nwa-score-cell">${s}</td>`).join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <!-- Sliders -->
        <div class="nwa-sliders" id="nwaSliders">
          ${SENSITIVITY.criteria
            .map(
              (c, ci) => `
            <div class="nwa-slider-row">
              <label class="nwa-slider-label">${c}</label>
              <input type="range" class="nwa-slider" id="nwaSlider${ci}" data-idx="${ci}"
                min="0" max="100" value="${sensitivityWeights[ci]}">
              <span class="nwa-slider-value" id="nwaSliderVal${ci}">${sensitivityWeights[ci]}%</span>
            </div>
          `
            )
            .join('')}
          <div class="nwa-slider-sum" id="nwaSliderSum">
            &Sigma; = <strong>${sensitivityWeights.reduce((a, b) => a + b, 0)}%</strong>
          </div>
        </div>

        <!-- Live Formula -->
        <div class="nwa-live-formulas" id="nwaLiveFormulas"></div>

        <!-- Bar Chart -->
        <div class="nwa-live-chart" id="nwaLiveChart"></div>

        <!-- Winner -->
        <div class="nwa-live-winner" id="nwaLiveWinner"></div>

        <!-- Reset button -->
        <div class="module-actions" style="margin-top: var(--space-4);">
          <button class="btn" id="nwaResetSliders" style="background: var(--bg-tertiary); color: var(--text-secondary);">Zuruecksetzen</button>
        </div>
      </div>
    `;

    // Initial render
    updateSensitivityUI();

    // Slider events
    SENSITIVITY.criteria.forEach((_, ci) => {
      const slider = document.getElementById(`nwaSlider${ci}`);
      if (slider) {
        const handler = (e) =>
          handleSliderChange(ci, parseInt(e.target.value, 10));
        slider.addEventListener('input', handler);
        cleanup_fns.push(() => slider.removeEventListener('input', handler));
      }
    });

    // Reset button
    const resetBtn = document.getElementById('nwaResetSliders');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        sensitivityWeights = [...SENSITIVITY.defaultWeights];
        SENSITIVITY.criteria.forEach((_, ci) => {
          const slider = document.getElementById(`nwaSlider${ci}`);
          if (slider) slider.value = sensitivityWeights[ci];
        });
        updateSensitivityUI();
      });
    }
  }

  function handleSliderChange(changedIdx, newValue) {
    const _oldValue = sensitivityWeights[changedIdx];
    const remaining = 100 - newValue;
    const otherSum = sensitivityWeights.reduce(
      (s, w, i) => (i === changedIdx ? s : s + w),
      0
    );

    if (otherSum > 0) {
      const scale = remaining / otherSum;
      sensitivityWeights = sensitivityWeights.map((w, i) => {
        if (i === changedIdx) return newValue;
        return Math.max(0, Math.round(w * scale));
      });
    } else {
      const otherCount = sensitivityWeights.length - 1;
      const each = Math.floor(remaining / otherCount);
      sensitivityWeights = sensitivityWeights.map((_w, i) => {
        if (i === changedIdx) return newValue;
        return each;
      });
    }

    // Fix rounding to ensure sum = 100
    sensitivityWeights[changedIdx] = newValue;
    const sum = sensitivityWeights.reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      for (let i = 0; i < sensitivityWeights.length; i++) {
        if (i !== changedIdx && sensitivityWeights[i] > 0) {
          sensitivityWeights[i] += 100 - sum;
          break;
        }
      }
    }

    // Clamp all to >= 0
    sensitivityWeights = sensitivityWeights.map((w) => Math.max(0, w));

    // Update other sliders
    SENSITIVITY.criteria.forEach((_, ci) => {
      if (ci !== changedIdx) {
        const slider = document.getElementById(`nwaSlider${ci}`);
        if (slider) slider.value = sensitivityWeights[ci];
      }
    });

    updateSensitivityUI();
  }

  function updateSensitivityUI() {
    const totals = calcSensitivityScores(
      sensitivityWeights,
      SENSITIVITY.scores,
      SENSITIVITY.alternatives.length
    );
    const winnerIdx = getWinnerIndex(totals);

    // Update slider values
    SENSITIVITY.criteria.forEach((_, ci) => {
      const valEl = document.getElementById(`nwaSliderVal${ci}`);
      if (valEl) valEl.textContent = `${sensitivityWeights[ci]}%`;
    });

    // Update sum
    const sumEl = document.getElementById('nwaSliderSum');
    if (sumEl) {
      const sum = sensitivityWeights.reduce((a, b) => a + b, 0);
      sumEl.innerHTML = `&Sigma; = <strong>${sum}%</strong>`;
    }

    // Update formulas
    const formulasEl = document.getElementById('nwaLiveFormulas');
    if (formulasEl) {
      formulasEl.innerHTML = SENSITIVITY.alternatives
        .map((a, ai) => {
          const parts = SENSITIVITY.criteria.map(
            (_c, ci) =>
              `<span class="nwa-formula-part-live">(${SENSITIVITY.scores[ci][ai]} &times; ${(sensitivityWeights[ci] / 100).toFixed(2)})</span>`
          );
          return `
          <div class="nwa-live-formula-line ${ai === winnerIdx ? 'nwa-live-formula-winner' : ''}">
            <span class="nwa-formula-alt" style="color: ${ALT_COLORS_RAW[ai]};">${a}:</span>
            ${parts.join(' + ')} = <strong>${totals[ai].toFixed(2)}</strong>
          </div>
        `;
        })
        .join('');
    }

    // Update bar chart
    const chartEl = document.getElementById('nwaLiveChart');
    if (chartEl) renderBarChart(chartEl, SENSITIVITY.alternatives, totals, 10);

    // Update winner
    const winnerEl = document.getElementById('nwaLiveWinner');
    if (winnerEl) {
      winnerEl.innerHTML = `
        <div class="nwa-winner-badge">
          <span class="nwa-winner-crown">&#x1F3C6;</span>
          <span>Gewinner: <strong>${SENSITIVITY.alternatives[winnerIdx]}</strong> mit <strong>${totals[winnerIdx].toFixed(2)}</strong> Punkten</span>
        </div>
      `;
    }
  }

  // ============================================================
  // UI COMPONENTS
  // ============================================================

  function renderBarChart(container, alternatives, totals, maxScore) {
    const _maxTotal = Math.max(...totals, maxScore * 0.5);

    container.innerHTML = alternatives
      .map((a, ai) => {
        const pct = (totals[ai] / maxScore) * 100;
        const isMax = totals[ai] === Math.max(...totals);
        return `
        <div class="nwa-bar-row ${isMax ? 'nwa-bar-winner' : ''}">
          <div class="nwa-bar-label" style="color: ${ALT_COLORS_RAW[ai]};">${a}</div>
          <div class="nwa-bar-track">
            <div class="nwa-bar-fill" style="width: ${pct}%; background: ${ALT_COLORS_RAW[ai]};"></div>
          </div>
          <div class="nwa-bar-value">${totals[ai].toFixed(2)}</div>
        </div>
      `;
      })
      .join('');
  }

  function showFeedback(el, success, message) {
    if (!el) return;
    const cls =
      success === true
        ? 'module-feedback-success'
        : success === false
          ? 'module-feedback-error'
          : 'nwa-feedback-hint';
    el.innerHTML = `<div class="module-feedback ${cls}">${message}</div>`;
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  function cleanup() {
    cleanup_fns.forEach((fn) => {
      fn();
    });
    cleanup_fns = [];
  }

  return { render, cleanup };
})();

export default NWAView;
