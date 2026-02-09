// ============================================================
// uml.js — UML-Diagramm-Werkstatt (Modul 4)
// Aktivitaets-, Klassen-, Use-Case-Diagramm: Interactive editor
// with drag & drop, exam exercises & UML-Trainer.
// ============================================================

const UMLView = (() => {
  let currentTab = 'explanation';
  let cleanup_fns = [];
  const progress = loadProgress();

  // Sub-selectors
  let freeSubType = 'activity';
  let trainerSubType = 'cardinality';

  // Trainer state
  let trainerScore = 0;
  let trainerRound = 0;
  let trainerCurrent = null;
  let trainerPlaced = {};

  // Exercise state
  let currentExercise = 0;
  let exerciseState = {};

  // Free mode state
  let freeElements = [];
  let freeConnections = [];
  let freeNextId = 1;
  let freeSelectedElement = null;
  let freeConnectMode = false;
  let freeConnectSource = null;
  let freeSwimlanes = ['Benutzer', 'System'];

  // ============================================================
  // PERSISTENCE
  // ============================================================

  function loadProgress() {
    try {
      const raw = localStorage.getItem('ap1_uml_progress');
      return raw
        ? JSON.parse(raw)
        : { exercises: [], trainer: { best: 0, cardBest: 0, swimBest: 0 } };
    } catch {
      return { exercises: [], trainer: { best: 0, cardBest: 0, swimBest: 0 } };
    }
  }

  function saveProgress() {
    localStorage.setItem('ap1_uml_progress', JSON.stringify(progress));
  }

  function markExerciseComplete(id) {
    if (!progress.exercises.includes(id)) {
      progress.exercises.push(id);
      saveProgress();
    }
  }

  // ============================================================
  // DATA: Kardinalitaeten Trainer Scenarios
  // ============================================================

  const KARD_SCENARIOS = [
    {
      id: 1,
      title: 'Schule & Schueler',
      description:
        'Jede Schule hat mehrere Schueler. Jeder Schueler besucht genau eine Schule.',
      pairs: [
        {
          left: 'Schule',
          right: 'Schueler',
          relType: 'association',
          leftCard: '1',
          rightCard: '0..*',
        },
      ],
    },
    {
      id: 2,
      title: 'Firma & Abteilung',
      description:
        'Eine Firma besteht aus mindestens einer Abteilung. Jede Abteilung gehoert zu genau einer Firma. Wird die Firma aufgeloest, verschwinden auch die Abteilungen.',
      pairs: [
        {
          left: 'Firma',
          right: 'Abteilung',
          relType: 'composition',
          leftCard: '1',
          rightCard: '1..*',
        },
      ],
    },
    {
      id: 3,
      title: 'Auto & Motor',
      description:
        'Jedes Auto hat genau einen Motor. Ein Motor kann in genau einem Auto eingebaut sein. Ohne das Auto existiert der Motor nicht weiter.',
      pairs: [
        {
          left: 'Auto',
          right: 'Motor',
          relType: 'composition',
          leftCard: '1',
          rightCard: '1',
        },
      ],
    },
    {
      id: 4,
      title: 'Kurs & Student',
      description:
        'Ein Kurs kann von mehreren Studenten belegt werden. Ein Student kann mehrere Kurse belegen.',
      pairs: [
        {
          left: 'Kurs',
          right: 'Student',
          relType: 'association',
          leftCard: '0..*',
          rightCard: '0..*',
        },
      ],
    },
    {
      id: 5,
      title: 'Bibliothek & Buch',
      description:
        'Eine Bibliothek enthaelt viele Buecher. Jedes Buch kann in hoechstens einer Bibliothek stehen, aber auch unabhaengig existieren (z.B. im Lager).',
      pairs: [
        {
          left: 'Bibliothek',
          right: 'Buch',
          relType: 'aggregation',
          leftCard: '0..1',
          rightCard: '0..*',
        },
      ],
    },
    {
      id: 6,
      title: 'Bestellung & Position',
      description:
        'Jede Bestellung hat mindestens eine Bestellposition. Jede Position gehoert zu genau einer Bestellung. Ohne Bestellung keine Position.',
      pairs: [
        {
          left: 'Bestellung',
          right: 'Bestellposition',
          relType: 'composition',
          leftCard: '1',
          rightCard: '1..*',
        },
      ],
    },
  ];

  const KARD_CHIPS = ['1', '0..1', '0..*', '1..*'];

  // ============================================================
  // DATA: Swimlane Trainer Scenarios
  // ============================================================

  const SWIM_SCENARIOS = [
    {
      id: 1,
      title: 'Online-Bestellprozess',
      description:
        'Ein Kunde bestellt online. Ordne die Aktionen den richtigen Verantwortungsbereichen zu.',
      lanes: ['Kunde', 'Onlineshop', 'Lager'],
      actions: [
        { text: 'Produkt auswaehlen', lane: 'Kunde' },
        { text: 'In Warenkorb legen', lane: 'Kunde' },
        { text: 'Bezahlung abwickeln', lane: 'Onlineshop' },
        { text: 'Bestellbestaetigung senden', lane: 'Onlineshop' },
        { text: 'Ware kommissionieren', lane: 'Lager' },
        { text: 'Paket versenden', lane: 'Lager' },
      ],
    },
    {
      id: 2,
      title: 'IT-Support-Ticket',
      description:
        'Ein Mitarbeiter meldet ein IT-Problem. Ordne die Aktionen zu.',
      lanes: ['Mitarbeiter', '1st-Level-Support', '2nd-Level-Support'],
      actions: [
        { text: 'Problem melden', lane: 'Mitarbeiter' },
        { text: 'Ticket erfassen', lane: '1st-Level-Support' },
        { text: 'Standardloesung pruefen', lane: '1st-Level-Support' },
        { text: 'Problem eskalieren', lane: '1st-Level-Support' },
        { text: 'Tiefenanalyse durchfuehren', lane: '2nd-Level-Support' },
        { text: 'Loesung dokumentieren', lane: '2nd-Level-Support' },
      ],
    },
    {
      id: 3,
      title: 'Bewerbungsprozess',
      description:
        'Eine Bewerbung wird bearbeitet. Ordne die Aktionen den Verantwortlichen zu.',
      lanes: ['Bewerber', 'Personalabteilung', 'Fachabteilung'],
      actions: [
        { text: 'Bewerbung einreichen', lane: 'Bewerber' },
        { text: 'Unterlagen pruefen', lane: 'Personalabteilung' },
        { text: 'Vorstellungsgespraech planen', lane: 'Personalabteilung' },
        { text: 'Fachliches Interview fuehren', lane: 'Fachabteilung' },
        { text: 'Bewertung abgeben', lane: 'Fachabteilung' },
        { text: 'Zu-/Absage versenden', lane: 'Personalabteilung' },
      ],
    },
    {
      id: 4,
      title: 'Softwareentwicklung (Sprint)',
      description:
        'Ein Sprint im agilen Entwicklungsprozess. Ordne die Aktivitaeten zu.',
      lanes: ['Product Owner', 'Entwicklungsteam', 'Scrum Master'],
      actions: [
        { text: 'User Stories priorisieren', lane: 'Product Owner' },
        { text: 'Sprint Backlog erstellen', lane: 'Entwicklungsteam' },
        { text: 'Code implementieren', lane: 'Entwicklungsteam' },
        { text: 'Daily Standup moderieren', lane: 'Scrum Master' },
        { text: 'Impediments beseitigen', lane: 'Scrum Master' },
        { text: 'Sprint Review abnehmen', lane: 'Product Owner' },
      ],
    },
    {
      id: 5,
      title: 'Rechnungsstellung',
      description: 'Der Prozess von der Leistungserbringung bis zur Zahlung.',
      lanes: ['Vertrieb', 'Buchhaltung', 'Kunde'],
      actions: [
        { text: 'Leistung dokumentieren', lane: 'Vertrieb' },
        { text: 'Rechnung erstellen', lane: 'Buchhaltung' },
        { text: 'Rechnung versenden', lane: 'Buchhaltung' },
        { text: 'Zahlung ueberweisen', lane: 'Kunde' },
        { text: 'Zahlungseingang pruefen', lane: 'Buchhaltung' },
        { text: 'Auftrag abschliessen', lane: 'Vertrieb' },
      ],
    },
    {
      id: 6,
      title: 'Datensicherung (Backup)',
      description:
        'Der Backup-Prozess im Rechenzentrum. Ordne die Schritte zu.',
      lanes: ['Administrator', 'Backup-System', 'Monitoring'],
      actions: [
        { text: 'Backup-Job konfigurieren', lane: 'Administrator' },
        { text: 'Daten sichern', lane: 'Backup-System' },
        { text: 'Integritaetspruefung starten', lane: 'Backup-System' },
        { text: 'Statusbericht generieren', lane: 'Monitoring' },
        { text: 'Fehler melden', lane: 'Monitoring' },
        { text: 'Wiederherstellungstest planen', lane: 'Administrator' },
      ],
    },
  ];

  // ============================================================
  // DATA: Exercises
  // ============================================================

  const EXERCISES = [
    {
      id: 1,
      title: 'Aktivitaetsdiagramm: Online-Bestellung',
      difficulty: 'Leicht',
      type: 'quiz',
      description:
        'Ein Online-Bestellprozess hat zwei Swimlanes: <strong>Kunde</strong> und <strong>System</strong>. Welche Aussagen sind korrekt?',
      questions: [
        {
          question:
            'In welcher Swimlane liegt die Aktion "Produkt in Warenkorb legen"?',
          options: ['Kunde', 'System', 'In beiden', 'In keiner'],
          correct: 0,
          explanation:
            'Der Kunde fuehrt die Aktion aus, sie liegt in seiner Swimlane.',
        },
        {
          question:
            'Was stellt ein Entscheidungsknoten (Raute) im Aktivitaetsdiagramm dar?',
          options: [
            'Eine parallele Verzweigung',
            'Eine bedingte Verzweigung mit Guard-Conditions',
            'Das Ende des Prozesses',
            'Eine Zusammenfuehrung von Swimlanes',
          ],
          correct: 1,
          explanation:
            'Die Raute ist ein Entscheidungsknoten. Die ausgehenden Kanten tragen Guard-Conditions in eckigen Klammern, z.B. [Zahlung OK].',
        },
      ],
    },
    {
      id: 2,
      title: 'Klassendiagramm: Beziehungen erkennen',
      difficulty: 'Mittel',
      type: 'quiz',
      description:
        'Beantworte die Fragen zu Beziehungstypen und Kardinalitaeten im Klassendiagramm.',
      questions: [
        {
          question:
            'Eine Firma hat Abteilungen. Wird die Firma aufgeloest, existieren die Abteilungen nicht mehr. Welche Beziehung liegt vor?',
          options: [
            'Assoziation',
            'Aggregation (leere Raute)',
            'Komposition (gefuellte Raute)',
            'Vererbung',
          ],
          correct: 2,
          explanation:
            'Komposition = Existenzabhaengigkeit. Die Teile (Abteilungen) koennen ohne das Ganze (Firma) nicht existieren. Symbol: gefuellte Raute.',
        },
        {
          question:
            'Ein Team besteht aus Mitarbeitern. Mitarbeiter koennen auch ohne Team existieren. Welche Beziehung?',
          options: ['Komposition', 'Aggregation', 'Vererbung', 'Dependency'],
          correct: 1,
          explanation:
            'Aggregation = "Teil-von"-Beziehung ohne Existenzabhaengigkeit. Symbol: leere Raute am Ganzen.',
        },
        {
          question:
            'Welche Kardinalitaet bedeutet "mindestens eins, beliebig viele"?',
          options: ['0..1', '1', '0..*', '1..*'],
          correct: 3,
          explanation:
            '1..* bedeutet: Mindestens ein Element, nach oben offen. Beispiel: Eine Bestellung hat 1..* Positionen.',
        },
      ],
    },
    {
      id: 3,
      title: 'Aktivitaetsdiagramm: Parallele Ablaeufe',
      difficulty: 'Mittel',
      type: 'quiz',
      description:
        'Fragen zu Fork, Join und parallelen Ablaeufen im Aktivitaetsdiagramm.',
      questions: [
        {
          question:
            'Welches Element startet parallele Ablaeufe im Aktivitaetsdiagramm?',
          options: [
            'Entscheidungsknoten (Raute)',
            'Synchronisationsbalken / Fork (dicker Balken)',
            'Startereignis (schwarzer Kreis)',
            'Swimlane-Grenze',
          ],
          correct: 1,
          explanation:
            'Ein Fork (Gabelung) — dargestellt als dicker schwarzer Balken — teilt den Kontrollfluss in parallele Pfade auf.',
        },
        {
          question:
            'Was ist der Unterschied zwischen Fork/Join und Entscheidung/Merge?',
          options: [
            'Kein Unterschied, beide sind austauschbar',
            'Fork/Join = parallel (UND), Entscheidung/Merge = alternativ (ODER)',
            'Fork/Join ist nur fuer Swimlanes, Entscheidung fuer alle',
            'Entscheidung hat Guard-Conditions, Fork/Join nicht',
          ],
          correct: 1,
          explanation:
            'Fork/Join spaltet/vereint parallele Pfade (alle werden durchlaufen). Entscheidung/Merge waehlt genau einen Pfad basierend auf einer Bedingung.',
        },
      ],
    },
    {
      id: 4,
      title: 'Use-Case: Bibliothekssystem',
      difficulty: 'Leicht',
      type: 'quiz',
      description:
        'Ein Bibliothekssystem hat die Akteure <strong>Leser</strong> und <strong>Bibliothekar</strong>. Beantworte die Fragen zum Use-Case-Diagramm.',
      questions: [
        {
          question: 'Wo werden Use Cases im Diagramm platziert?',
          options: [
            'Ausserhalb der Systemgrenze',
            'Innerhalb der Systemgrenze',
            'Auf der Systemgrenze',
            'Ueberall im Diagramm',
          ],
          correct: 1,
          explanation:
            'Use Cases liegen innerhalb der Systemgrenze (gestricheltes Rechteck). Akteure stehen ausserhalb.',
        },
        {
          question:
            '"Buch ausleihen" beinhaltet immer "Ausweis pruefen". Welche Beziehung ist das?',
          options: [
            '<<extend>>',
            '<<include>>',
            'Assoziation',
            'Generalisierung',
          ],
          correct: 1,
          explanation:
            '<<include>> bedeutet: Der Basis-Use-Case fuehrt den inkludierten Use Case IMMER aus. Pfeilrichtung: Basis → inkludierter UC.',
        },
        {
          question:
            '"Buch ausleihen" kann optional zu "Mahngebuehr berechnen" fuehren. Welche Beziehung?',
          options: ['<<include>>', '<<extend>>', 'Komposition', 'Vererbung'],
          correct: 1,
          explanation:
            '<<extend>> bedeutet: Der erweiternde Use Case wird nur unter bestimmten Bedingungen ausgefuehrt. Pfeilrichtung: Erweiterung → Basis-UC.',
        },
      ],
    },
    {
      id: 5,
      title: 'Aggregation vs. Komposition',
      difficulty: 'Schwer',
      type: 'quiz',
      description:
        'Ordne die Szenarien den richtigen Beziehungstypen zu. <strong>Pruefungswissen!</strong>',
      questions: [
        {
          question:
            'Rechnung und Rechnungspositionen — die Positionen existieren nicht ohne die Rechnung.',
          options: ['Aggregation', 'Komposition', 'Assoziation', 'Vererbung'],
          correct: 1,
          explanation:
            'Komposition: Rechnungspositionen sind existenzabhaengig von der Rechnung. Loescht man die Rechnung, sind auch die Positionen weg.',
        },
        {
          question: 'Playlist und Songs — Songs existieren auch ohne Playlist.',
          options: ['Komposition', 'Aggregation', 'Dependency', 'Assoziation'],
          correct: 1,
          explanation:
            'Aggregation: Songs sind Teil der Playlist, koennen aber auch unabhaengig existieren oder in anderen Playlists sein.',
        },
        {
          question:
            'Haus und Zimmer — Zimmer koennen nicht ohne Haus existieren.',
          options: ['Aggregation', 'Assoziation', 'Komposition', 'Vererbung'],
          correct: 2,
          explanation:
            'Komposition: Zimmer sind physisch Teil des Hauses und existenzabhaengig. Symbol: gefuellte Raute am Haus.',
        },
        {
          question:
            'Welches Symbol hat die Aggregation im UML-Klassendiagramm?',
          options: [
            'Gefuellte Raute am Ganzen',
            'Leere Raute am Ganzen',
            'Leeres Dreieck am Elternteil',
            'Einfache Linie',
          ],
          correct: 1,
          explanation:
            'Aggregation = leere (weisse) Raute am "Ganzen". Komposition = gefuellte (schwarze) Raute am "Ganzen".',
        },
      ],
    },
  ];

  // ============================================================
  // RENDER: Main
  // ============================================================

  function render(container) {
    currentTab = 'explanation';
    cleanup_fns = [];
    trainerScore = 0;
    trainerRound = 0;
    currentExercise = 0;
    exerciseState = {};

    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <div class="page-header-left">
            <div>
              <h1 class="page-title">UML-Werkstatt</h1>
              <p class="page-subtitle">Aktivitaets-, Klassen- & Use-Case-Diagramme — Pruefungsrelevant seit 2025</p>
            </div>
          </div>
        </div>

        <div class="module-tabs" id="umlTabs">
          <button class="module-tab active" data-tab="explanation">Erklaerung</button>
          <button class="module-tab" data-tab="freemode">Freier Modus</button>
          <button class="module-tab" data-tab="exercises">Aufgaben</button>
          <button class="module-tab" data-tab="trainer">UML-Trainer</button>
        </div>

        <div id="umlTabContent"></div>
      </div>
    `;

    const tabContent = container.querySelector('#umlTabContent');

    container.querySelectorAll('.module-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.module-tab').forEach((t) => {
          t.classList.remove('active');
        });
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        renderTab(tabContent);
      });
    });

    renderTab(tabContent);
  }

  function renderTab(tabContent) {
    // Clean up previous tab
    cleanup_fns.forEach((fn) => {
      fn();
    });
    cleanup_fns = [];

    tabContent.innerHTML = '';
    switch (currentTab) {
      case 'explanation':
        renderExplanation(tabContent);
        break;
      case 'freemode':
        renderFreeMode(tabContent);
        break;
      case 'exercises':
        renderExercises(tabContent);
        break;
      case 'trainer':
        renderTrainer(tabContent);
        break;
    }
  }

  function cleanup() {
    cleanup_fns.forEach((fn) => {
      fn();
    });
    cleanup_fns = [];
    freeElements = [];
    freeConnections = [];
    freeNextId = 1;
    freeSelectedElement = null;
    freeConnectMode = false;
    freeConnectSource = null;
  }

  // ============================================================
  // TAB 1: Erklaerung
  // ============================================================

  function renderExplanation(container) {
    container.innerHTML = `
      <div class="uml-explanation">
        <div class="uml-section">
          <h3 class="uml-section-title">Was ist UML?</h3>
          <p class="uml-text">
            Die <strong>Unified Modeling Language (UML)</strong> ist eine standardisierte grafische
            Modellierungssprache fuer Software- und Systemdesign. In der IHK-Pruefung (AP1) sind
            vor allem drei Diagrammtypen relevant:
          </p>
        </div>

        <div class="uml-types-grid">
          <div class="uml-type-card">
            <div class="uml-type-card-icon">
              <svg viewBox="0 0 64 64" fill="none" stroke="var(--uml-usecase)" stroke-width="2">
                <rect x="12" y="4" width="40" height="56" rx="4" stroke-dasharray="4 2"/>
                <line x1="4" y1="20" x2="4" y2="44" stroke="var(--uml-actor)"/>
                <circle cx="4" cy="16" r="3" stroke="var(--uml-actor)"/>
                <line x1="0" y1="26" x2="8" y2="26" stroke="var(--uml-actor)"/>
                <line x1="4" y1="44" x2="0" y2="52" stroke="var(--uml-actor)"/>
                <line x1="4" y1="44" x2="8" y2="52" stroke="var(--uml-actor)"/>
                <ellipse cx="32" cy="25" rx="14" ry="8"/>
                <ellipse cx="32" cy="45" rx="14" ry="8"/>
                <line x1="8" y1="25" x2="18" y2="25" stroke="var(--uml-actor)"/>
              </svg>
            </div>
            <h4>Use-Case-Diagramm</h4>
            <p>Zeigt <strong>Akteure</strong> (Strichfiguren) und deren <strong>Anwendungsfaelle</strong> (Ovale)
            innerhalb einer <strong>Systemgrenze</strong>. Beziehungen: Assoziation, &lt;&lt;include&gt;&gt;, &lt;&lt;extend&gt;&gt;.</p>
          </div>

          <div class="uml-type-card">
            <div class="uml-type-card-icon">
              <svg viewBox="0 0 64 64" fill="none" stroke="var(--uml-class)" stroke-width="2">
                <rect x="4" y="8" width="24" height="48" rx="2"/>
                <line x1="4" y1="20" x2="28" y2="20"/>
                <line x1="4" y1="36" x2="28" y2="36"/>
                <rect x="36" y="8" width="24" height="48" rx="2"/>
                <line x1="36" y1="20" x2="60" y2="20"/>
                <line x1="36" y1="36" x2="60" y2="36"/>
                <line x1="28" y1="32" x2="36" y2="32"/>
                <polygon points="28,32 32,28 36,32 32,36" fill="var(--uml-class)"/>
              </svg>
            </div>
            <h4>Klassendiagramm</h4>
            <p>Zeigt <strong>Klassen</strong> (Boxen mit Name/Attribute/Methoden) und deren
            <strong>Beziehungen</strong> (Assoziation, Aggregation, Komposition, Vererbung)
            mit <strong>Kardinalitaeten</strong>.</p>
          </div>

          <div class="uml-type-card">
            <div class="uml-type-card-icon">
              <svg viewBox="0 0 64 64" fill="none" stroke="var(--uml-action)" stroke-width="2">
                <circle cx="32" cy="8" r="5" fill="var(--uml-start)"/>
                <rect x="14" y="18" width="36" height="12" rx="6"/>
                <polygon points="32,36 40,42 24,42" fill="none" stroke="var(--uml-decision)"/>
                <rect x="14" y="48" width="36" height="12" rx="6"/>
                <line x1="32" y1="13" x2="32" y2="18"/>
                <line x1="32" y1="30" x2="32" y2="36"/>
                <line x1="32" y1="42" x2="32" y2="48"/>
              </svg>
            </div>
            <h4>Aktivitaetsdiagramm</h4>
            <p>Modelliert <strong>Ablaeufe</strong> mit Aktionen, Entscheidungen, Fork/Join
            und <strong>Swimlanes</strong> (Verantwortungsbereiche). Ersetzt seit 2025
            Struktogramm/PAP in der AP1.</p>
          </div>
        </div>

        <div class="uml-exam-box">
          <div class="uml-exam-box-title">
            &#x26A0; Pruefungswissen: Aggregation vs. Komposition
          </div>
          <div class="uml-exam-box-content">
            <div class="uml-exam-item">
              <h5>
                <svg class="uml-diamond-icon" viewBox="0 0 16 16" fill="none" stroke="var(--uml-aggregation)" stroke-width="2">
                  <polygon points="8,1 15,8 8,15 1,8"/>
                </svg>
                Aggregation (leere Raute)
              </h5>
              <p>"Teil-von"-Beziehung <strong>ohne</strong> Existenzabhaengigkeit. Die Teile koennen
              auch ohne das Ganze existieren.</p>
              <p><em>Beispiel:</em> Team &#9671; Mitarbeiter — Mitarbeiter existieren auch ohne Team.</p>
            </div>
            <div class="uml-exam-item">
              <h5>
                <svg class="uml-diamond-icon" viewBox="0 0 16 16" fill="var(--uml-composition)" stroke="var(--uml-composition)" stroke-width="2">
                  <polygon points="8,1 15,8 8,15 1,8"/>
                </svg>
                Komposition (gefuellte Raute)
              </h5>
              <p>"Teil-von"-Beziehung <strong>mit</strong> Existenzabhaengigkeit. Die Teile werden
              mit dem Ganzen zerstoert.</p>
              <p><em>Beispiel:</em> Rechnung &#9670; Position — Positionen existieren nicht ohne Rechnung.</p>
            </div>
          </div>
        </div>

        <div class="uml-section">
          <h3 class="uml-section-title">Wichtige Konzepte</h3>
        </div>

        <div class="uml-concepts-grid">
          <div class="uml-concept-card">
            <h4>Swimlanes (Verantwortungsbereiche)</h4>
            <p>Im Aktivitaetsdiagramm teilen <strong>Swimlanes</strong> den Ablauf in
            vertikale oder horizontale Bahnen. Jede Bahn gehoert einem <strong>Verantwortlichen</strong>
            (z.B. Abteilung, Rolle, System).</p>
            <p><em>Pruefungsrelevant:</em> Aktionen muessen in der richtigen Lane platziert sein!</p>
          </div>

          <div class="uml-concept-card">
            <h4>Fork &amp; Join (Parallelisierung)</h4>
            <p><strong>Fork</strong> (Gabelung): Ein dicker Balken teilt den Fluss in
            <strong>parallele Pfade</strong> — alle werden gleichzeitig durchlaufen.</p>
            <p><strong>Join</strong> (Synchronisation): Ein dicker Balken vereint die Pfade wieder.
            Alle muessen abgeschlossen sein, bevor es weitergeht.</p>
            <p><em>Unterschied zu PAP:</em> PAP kennt keine echte Parallelisierung!</p>
          </div>

          <div class="uml-concept-card">
            <h4>Systemgrenze (Use-Case)</h4>
            <p>Ein <strong>gestricheltes Rechteck</strong> mit Systemname als Titel.
            <strong>Akteure</strong> stehen ausserhalb, <strong>Use Cases</strong> innerhalb.</p>
            <p><em>Merke:</em> Akteure interagieren mit dem System, sind aber nicht Teil davon.</p>
          </div>

          <div class="uml-concept-card">
            <h4><code>&lt;&lt;include&gt;&gt;</code> vs. <code>&lt;&lt;extend&gt;&gt;</code></h4>
            <p><code>&lt;&lt;include&gt;&gt;</code>: Der Basis-UC <strong>beinhaltet immer</strong> den
            anderen UC. Pfeil: Basis &#8594; inkludierter UC.</p>
            <p><code>&lt;&lt;extend&gt;&gt;</code>: Der erweiternde UC wird nur <strong>optional/bedingt</strong>
            ausgefuehrt. Pfeil: Erweiterung &#8594; Basis-UC.</p>
            <p><em>Eselsbruecke:</em> include = immer, extend = eventuell.</p>
          </div>
        </div>

        <div class="uml-exam-box" style="border-color: var(--uml-class);">
          <div class="uml-exam-box-title" style="color: var(--uml-class);">
            Kardinalitaeten — Die wichtigsten Notationen
          </div>
          <div class="uml-exam-box-content">
            <div class="uml-exam-item">
              <h5>Haeufige Kardinalitaeten</h5>
              <p><strong>1</strong> — genau eins</p>
              <p><strong>0..1</strong> — kein oder ein Element</p>
              <p><strong>0..*</strong> — beliebig viele (auch keins)</p>
              <p><strong>1..*</strong> — mindestens eins, beliebig viele</p>
            </div>
            <div class="uml-exam-item">
              <h5>Wo stehen sie?</h5>
              <p>An <strong>beiden Enden</strong> einer Assoziation/Aggregation/Komposition.</p>
              <p>Die Kardinalitaet gibt an, wie viele Objekte der <strong>gegenueberliegenden</strong>
              Klasse beteiligt sein koennen.</p>
              <p><em>Tipp:</em> Lese die Kardinalitaet immer vom Standpunkt der anderen Klasse!</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // TAB 2: Freier Modus
  // ============================================================

  function renderFreeMode(container) {
    freeElements = [];
    freeConnections = [];
    freeNextId = 1;
    freeSelectedElement = null;
    freeConnectMode = false;
    freeConnectSource = null;
    freeSwimlanes = ['Benutzer', 'System'];

    container.innerHTML = `
      <div class="uml-freemode">
        <div class="uml-sub-selector" id="umlFreeSub">
          <button class="uml-sub-btn ${freeSubType === 'activity' ? 'active' : ''}" data-sub="activity">Aktivitaetsdiagramm</button>
          <button class="uml-sub-btn ${freeSubType === 'classdiagram' ? 'active' : ''}" data-sub="classdiagram">Klassendiagramm</button>
          <button class="uml-sub-btn ${freeSubType === 'usecase' ? 'active' : ''}" data-sub="usecase">Use-Case-Diagramm</button>
        </div>
        <div id="umlFreeCanvas"></div>
      </div>
    `;

    container.querySelectorAll('.uml-sub-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.uml-sub-btn').forEach((b) => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        freeSubType = btn.dataset.sub;
        freeElements = [];
        freeConnections = [];
        freeNextId = 1;
        freeSelectedElement = null;
        freeConnectMode = false;
        renderFreeCanvas(container.querySelector('#umlFreeCanvas'));
      });
    });

    renderFreeCanvas(container.querySelector('#umlFreeCanvas'));
  }

  function renderFreeCanvas(canvasContainer) {
    switch (freeSubType) {
      case 'activity':
        renderActivityCanvas(canvasContainer);
        break;
      case 'classdiagram':
        renderClassCanvas(canvasContainer);
        break;
      case 'usecase':
        renderUseCaseCanvas(canvasContainer);
        break;
    }
  }

  // --- Activity Diagram Canvas ---
  function renderActivityCanvas(container) {
    container.innerHTML = `
      <div class="uml-canvas-wrapper">
        <div class="uml-toolbar">
          <button class="uml-toolbar-btn" data-add="start" title="Startknoten">&#9679; Start</button>
          <button class="uml-toolbar-btn" data-add="end" title="Endknoten">&#9673; Ende</button>
          <button class="uml-toolbar-btn" data-add="action" title="Aktion">&#9645; Aktion</button>
          <button class="uml-toolbar-btn" data-add="decision" title="Entscheidung">&#9670; Entscheidung</button>
          <button class="uml-toolbar-btn" data-add="fork" title="Fork/Join">&#9644; Fork/Join</button>
          <div class="uml-toolbar-divider"></div>
          <button class="uml-toolbar-btn" id="umlConnectBtn" title="Verbinden">&#8594; Verbinden</button>
          <button class="uml-toolbar-btn" id="umlAddLane" title="Swimlane hinzufuegen">+ Lane</button>
          <div class="uml-toolbar-divider"></div>
          <button class="uml-toolbar-btn uml-btn-danger" id="umlDeleteBtn" title="Ausgewaehltes loeschen">&#10005; Loeschen</button>
          <button class="uml-toolbar-btn uml-btn-danger" id="umlClearBtn" title="Alles loeschen">Alles loeschen</button>
        </div>
        <div class="uml-canvas" id="umlActivityCanvas" style="height: 500px; position: relative;">
          <div class="uml-swimlanes" id="umlSwimlanes"></div>
          <svg id="umlActivitySvg" width="100%" height="100%">
            <defs>
              <marker id="umlArrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-secondary)"/>
              </marker>
            </defs>
          </svg>
        </div>
      </div>
    `;

    renderSwimlanes(container);
    setupActivityEvents(container);
  }

  function renderSwimlanes(container) {
    const swimContainer = container.querySelector('#umlSwimlanes');
    if (!swimContainer) return;
    swimContainer.innerHTML = freeSwimlanes
      .map(
        (name, i) => `
      <div class="uml-swimlane" data-lane="${i}">
        <div class="uml-swimlane-header">
          <input type="text" value="${name}" class="uml-swimlane-input"
            style="background:transparent;border:none;color:var(--text-primary);text-align:center;font-weight:600;font-size:var(--font-size-xs);width:100%;outline:none;"
            data-lane-idx="${i}">
        </div>
      </div>
    `
      )
      .join('');

    swimContainer.querySelectorAll('.uml-swimlane-input').forEach((input) => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.laneIdx, 10);
        freeSwimlanes[idx] = e.target.value;
      });
    });
  }

  function setupActivityEvents(container) {
    const canvas = container.querySelector('#umlActivityCanvas');
    const svg = container.querySelector('#umlActivitySvg');

    // Add elements
    container.querySelectorAll('[data-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.add;
        const id = `el_${freeNextId++}`;
        const name =
          type === 'action' ? 'Aktion' : type === 'decision' ? '' : '';
        freeElements.push({
          id,
          type,
          name,
          x: 100 + Math.random() * 200,
          y: 60 + Math.random() * 300,
        });
        renderFreeElements(canvas, svg);
      });
    });

    // Connect mode
    const connectBtn = container.querySelector('#umlConnectBtn');
    connectBtn.addEventListener('click', () => {
      freeConnectMode = !freeConnectMode;
      freeConnectSource = null;
      connectBtn.classList.toggle('active', freeConnectMode);
    });

    // Add swimlane
    container.querySelector('#umlAddLane').addEventListener('click', () => {
      freeSwimlanes.push(`Lane ${freeSwimlanes.length + 1}`);
      renderSwimlanes(container);
    });

    // Delete selected
    container.querySelector('#umlDeleteBtn').addEventListener('click', () => {
      if (freeSelectedElement) {
        freeElements = freeElements.filter(
          (el) => el.id !== freeSelectedElement
        );
        freeConnections = freeConnections.filter(
          (c) => c.from !== freeSelectedElement && c.to !== freeSelectedElement
        );
        freeSelectedElement = null;
        renderFreeElements(canvas, svg);
      }
    });

    // Clear all
    container.querySelector('#umlClearBtn').addEventListener('click', () => {
      freeElements = [];
      freeConnections = [];
      freeNextId = 1;
      freeSelectedElement = null;
      renderFreeElements(canvas, svg);
    });

    renderFreeElements(canvas, svg);
  }

  function renderFreeElements(canvas, svg) {
    // Remove old elements (keep swimlanes and svg)
    canvas.querySelectorAll('.uml-el').forEach((el) => {
      el.remove();
    });

    freeElements.forEach((el) => {
      const div = document.createElement('div');
      div.className = `uml-el uml-el-${el.type}`;
      div.dataset.id = el.id;
      div.style.left = `${el.x}px`;
      div.style.top = `${el.y}px`;

      if (el.type === 'action') {
        div.textContent = el.name;
        div.contentEditable = false;
        div.addEventListener('dblclick', () => {
          div.contentEditable = true;
          div.focus();
        });
        div.addEventListener('blur', () => {
          el.name = div.textContent;
          div.contentEditable = false;
        });
      } else if (el.type === 'decision') {
        div.innerHTML = '<span>?</span>';
      }

      if (el.id === freeSelectedElement) {
        div.classList.add('uml-selected');
      }

      // Click to select or connect
      div.addEventListener('mousedown', (e) => {
        if (freeConnectMode) {
          e.stopPropagation();
          if (!freeConnectSource) {
            freeConnectSource = el.id;
            div.classList.add('uml-selected');
          } else if (freeConnectSource !== el.id) {
            freeConnections.push({ from: freeConnectSource, to: el.id });
            freeConnectSource = null;
            renderFreeElements(canvas, svg);
          }
          return;
        }

        freeSelectedElement = el.id;
        canvas.querySelectorAll('.uml-el').forEach((e) => {
          e.classList.remove('uml-selected');
        });
        div.classList.add('uml-selected');

        // Drag
        const startX = e.clientX - el.x;
        const startY = e.clientY - el.y;

        const onMove = (ev) => {
          el.x = Math.max(0, ev.clientX - startX);
          el.y = Math.max(0, ev.clientY - startY);
          div.style.left = `${el.x}px`;
          div.style.top = `${el.y}px`;
          drawConnections(svg);
        };

        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });

      // Touch drag
      div.addEventListener(
        'touchstart',
        (e) => {
          if (freeConnectMode) {
            if (!freeConnectSource) {
              freeConnectSource = el.id;
            } else if (freeConnectSource !== el.id) {
              freeConnections.push({ from: freeConnectSource, to: el.id });
              freeConnectSource = null;
              renderFreeElements(canvas, svg);
            }
            return;
          }

          freeSelectedElement = el.id;
          const touch = e.touches[0];
          const startX = touch.clientX - el.x;
          const startY = touch.clientY - el.y;

          const onMove = (ev) => {
            ev.preventDefault();
            const t = ev.touches[0];
            el.x = Math.max(0, t.clientX - startX);
            el.y = Math.max(0, t.clientY - startY);
            div.style.left = `${el.x}px`;
            div.style.top = `${el.y}px`;
            drawConnections(svg);
          };

          const onEnd = () => {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
          };

          document.addEventListener('touchmove', onMove, { passive: false });
          document.addEventListener('touchend', onEnd);
        },
        { passive: true }
      );

      canvas.appendChild(div);
    });

    drawConnections(svg);
  }

  function getElementCenter(el) {
    const w =
      el.type === 'action'
        ? 120
        : el.type === 'fork'
          ? 120
          : el.type === 'decision'
            ? 44
            : 28;
    const h =
      el.type === 'action'
        ? 32
        : el.type === 'fork'
          ? 6
          : el.type === 'decision'
            ? 44
            : 28;
    return { x: el.x + w / 2, y: el.y + h / 2 };
  }

  function drawConnections(svg) {
    // Remove old lines
    svg.querySelectorAll('line.uml-conn').forEach((l) => {
      l.remove();
    });

    freeConnections.forEach((conn) => {
      const fromEl = freeElements.find((e) => e.id === conn.from);
      const toEl = freeElements.find((e) => e.id === conn.to);
      if (!fromEl || !toEl) return;

      const from = getElementCenter(fromEl);
      const to = getElementCenter(toEl);

      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line'
      );
      line.setAttribute('class', 'uml-conn');
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y);
      line.setAttribute('stroke', 'var(--text-secondary)');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('marker-end', 'url(#umlArrow)');
      svg.appendChild(line);
    });
  }

  // --- Class Diagram Canvas ---
  function renderClassCanvas(container) {
    container.innerHTML = `
      <div class="uml-canvas-wrapper">
        <div class="uml-toolbar">
          <button class="uml-toolbar-btn" data-add="class" title="Klasse hinzufuegen">+ Klasse</button>
          <div class="uml-toolbar-divider"></div>
          <button class="uml-toolbar-btn" id="umlClassConnBtn" data-rel="association" title="Assoziation">&#8212; Assoziation</button>
          <button class="uml-toolbar-btn" id="umlClassAggBtn" data-rel="aggregation" title="Aggregation">&#9671; Aggregation</button>
          <button class="uml-toolbar-btn" id="umlClassCompBtn" data-rel="composition" title="Komposition">&#9670; Komposition</button>
          <button class="uml-toolbar-btn" id="umlClassInhBtn" data-rel="inheritance" title="Vererbung">&#9651; Vererbung</button>
          <div class="uml-toolbar-divider"></div>
          <button class="uml-toolbar-btn uml-btn-danger" id="umlClassDelBtn">&#10005; Loeschen</button>
          <button class="uml-toolbar-btn uml-btn-danger" id="umlClassClearBtn">Alles loeschen</button>
        </div>
        <div class="uml-canvas" id="umlClassCanvas" style="height: 500px; position: relative;">
          <svg id="umlClassSvg" width="100%" height="100%">
            <defs>
              <marker id="umlArrowClass" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-secondary)"/>
              </marker>
              <marker id="umlEmptyDiamond" markerWidth="12" markerHeight="8" refX="0" refY="4" orient="auto">
                <polygon points="0 4, 6 0, 12 4, 6 8" fill="var(--bg-secondary)" stroke="var(--text-secondary)" stroke-width="1.5"/>
              </marker>
              <marker id="umlFilledDiamond" markerWidth="12" markerHeight="8" refX="0" refY="4" orient="auto">
                <polygon points="0 4, 6 0, 12 4, 6 8" fill="var(--text-secondary)" stroke="var(--text-secondary)" stroke-width="1"/>
              </marker>
              <marker id="umlEmptyTriangle" markerWidth="12" markerHeight="10" refX="12" refY="5" orient="auto">
                <polygon points="0 0, 12 5, 0 10" fill="var(--bg-secondary)" stroke="var(--text-secondary)" stroke-width="1.5"/>
              </marker>
            </defs>
          </svg>
        </div>
      </div>
    `;

    let classConnectRel = null;

    // Add class
    container
      .querySelector('[data-add="class"]')
      .addEventListener('click', () => {
        const id = `cls_${freeNextId++}`;
        freeElements.push({
          id,
          type: 'class',
          name: 'NeueKlasse',
          attrs: '- attribut: String',
          methods: '+ methode(): void',
          x: 50 + Math.random() * 300,
          y: 50 + Math.random() * 300,
        });
        renderClassElements(container);
      });

    // Relationship buttons
    container.querySelectorAll('[data-rel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rel = btn.dataset.rel;
        if (classConnectRel === rel) {
          classConnectRel = null;
          freeConnectSource = null;
          container.querySelectorAll('[data-rel]').forEach((b) => {
            b.classList.remove('active');
          });
        } else {
          classConnectRel = rel;
          freeConnectSource = null;
          container.querySelectorAll('[data-rel]').forEach((b) => {
            b.classList.remove('active');
          });
          btn.classList.add('active');
        }
      });
    });

    // Delete
    container.querySelector('#umlClassDelBtn').addEventListener('click', () => {
      if (freeSelectedElement) {
        freeElements = freeElements.filter(
          (el) => el.id !== freeSelectedElement
        );
        freeConnections = freeConnections.filter(
          (c) => c.from !== freeSelectedElement && c.to !== freeSelectedElement
        );
        freeSelectedElement = null;
        renderClassElements(container);
      }
    });

    container
      .querySelector('#umlClassClearBtn')
      .addEventListener('click', () => {
        freeElements = [];
        freeConnections = [];
        freeNextId = 1;
        freeSelectedElement = null;
        renderClassElements(container);
      });

    // Store classConnectRel in closure for renderClassElements
    const getConnectRel = () => classConnectRel;
    const setConnectSource = (id) => {
      freeConnectSource = id;
    };
    const getConnectSource = () => freeConnectSource;

    // Make these accessible
    container._getConnectRel = getConnectRel;
    container._setConnectSource = setConnectSource;
    container._getConnectSource = getConnectSource;

    renderClassElements(container);
  }

  function renderClassElements(container) {
    const canvas = container.querySelector('#umlClassCanvas');
    const svg = container.querySelector('#umlClassSvg');

    canvas.querySelectorAll('.uml-class-box').forEach((el) => {
      el.remove();
    });

    freeElements.forEach((el) => {
      if (el.type !== 'class') return;

      const div = document.createElement('div');
      div.className = 'uml-class-box';
      div.dataset.id = el.id;
      div.style.left = `${el.x}px`;
      div.style.top = `${el.y}px`;

      if (el.id === freeSelectedElement) div.classList.add('uml-selected');

      div.innerHTML = `
        <div class="uml-class-name">${el.name}</div>
        <div class="uml-class-attrs">${el.attrs}</div>
        <div class="uml-class-methods">${el.methods}</div>
      `;

      const setupEditable = (selector, key) => {
        const field = div.querySelector(selector);
        field.addEventListener('dblclick', () => {
          field.contentEditable = true;
          field.focus();
        });
        field.addEventListener('blur', (e) => {
          el[key] = e.target.textContent;
          field.contentEditable = false;
        });
      };

      setupEditable('.uml-class-name', 'name');
      setupEditable('.uml-class-attrs', 'attrs');
      setupEditable('.uml-class-methods', 'methods');

      div.addEventListener('mousedown', (e) => {
        if (e.target.isContentEditable) return;

        const connectRel = container._getConnectRel
          ? container._getConnectRel()
          : null;
        if (connectRel) {
          const source = container._getConnectSource
            ? container._getConnectSource()
            : null;
          if (!source) {
            container._setConnectSource(el.id);
            div.classList.add('uml-selected');
          } else if (source !== el.id) {
            freeConnections.push({
              from: source,
              to: el.id,
              relType: connectRel,
            });
            container._setConnectSource(null);
            renderClassElements(container);
          }
          return;
        }

        freeSelectedElement = el.id;
        canvas.querySelectorAll('.uml-class-box').forEach((b) => {
          b.classList.remove('uml-selected');
        });
        div.classList.add('uml-selected');

        const startX = e.clientX - el.x;
        const startY = e.clientY - el.y;
        const onMove = (ev) => {
          el.x = Math.max(0, ev.clientX - startX);
          el.y = Math.max(0, ev.clientY - startY);
          div.style.left = `${el.x}px`;
          div.style.top = `${el.y}px`;
          drawClassConnections(svg);
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });

      canvas.appendChild(div);
    });

    drawClassConnections(svg);
  }

  function drawClassConnections(svg) {
    svg.querySelectorAll('line.uml-cls-conn').forEach((l) => {
      l.remove();
    });

    freeConnections.forEach((conn) => {
      const fromEl = freeElements.find((e) => e.id === conn.from);
      const toEl = freeElements.find((e) => e.id === conn.to);
      if (!fromEl || !toEl) return;

      const from = { x: fromEl.x + 80, y: fromEl.y + 40 };
      const to = { x: toEl.x + 80, y: toEl.y + 40 };

      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line'
      );
      line.setAttribute('class', 'uml-cls-conn');
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y);
      line.setAttribute('stroke', 'var(--text-secondary)');
      line.setAttribute('stroke-width', '2');

      if (conn.relType === 'aggregation') {
        line.setAttribute('marker-start', 'url(#umlEmptyDiamond)');
      } else if (conn.relType === 'composition') {
        line.setAttribute('marker-start', 'url(#umlFilledDiamond)');
      } else if (conn.relType === 'inheritance') {
        line.setAttribute('marker-end', 'url(#umlEmptyTriangle)');
      } else {
        line.setAttribute('marker-end', 'url(#umlArrowClass)');
      }

      svg.appendChild(line);
    });
  }

  // --- Use-Case Canvas ---
  function renderUseCaseCanvas(container) {
    container.innerHTML = `
      <div class="uml-canvas-wrapper">
        <div class="uml-toolbar">
          <button class="uml-toolbar-btn" data-add="actor" title="Akteur">&#9787; Akteur</button>
          <button class="uml-toolbar-btn" data-add="usecase" title="Use Case">&#9711; Use Case</button>
          <button class="uml-toolbar-btn" data-add="boundary" title="Systemgrenze">&#9634; Systemgrenze</button>
          <div class="uml-toolbar-divider"></div>
          <button class="uml-toolbar-btn" id="umlUcAssocBtn" data-ucrel="association">&#8212; Assoziation</button>
          <button class="uml-toolbar-btn" id="umlUcIncBtn" data-ucrel="include">&lt;&lt;include&gt;&gt;</button>
          <button class="uml-toolbar-btn" id="umlUcExtBtn" data-ucrel="extend">&lt;&lt;extend&gt;&gt;</button>
          <div class="uml-toolbar-divider"></div>
          <button class="uml-toolbar-btn uml-btn-danger" id="umlUcDelBtn">&#10005; Loeschen</button>
          <button class="uml-toolbar-btn uml-btn-danger" id="umlUcClearBtn">Alles loeschen</button>
        </div>
        <div class="uml-canvas" id="umlUcCanvas" style="height: 500px; position: relative;">
          <svg id="umlUcSvg" width="100%" height="100%">
            <defs>
              <marker id="umlArrowUc" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-secondary)"/>
              </marker>
            </defs>
          </svg>
        </div>
      </div>
    `;

    let ucConnectRel = null;
    let ucConnectSource = null;

    // Add elements
    container.querySelectorAll('[data-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.add;
        const id = `uc_${freeNextId++}`;
        if (type === 'actor') {
          freeElements.push({
            id,
            type: 'actor',
            name: 'Akteur',
            x: 20 + Math.random() * 50,
            y: 80 + Math.random() * 200,
          });
        } else if (type === 'usecase') {
          freeElements.push({
            id,
            type: 'usecase',
            name: 'Use Case',
            x: 200 + Math.random() * 200,
            y: 80 + Math.random() * 300,
          });
        } else if (type === 'boundary') {
          freeElements.push({
            id,
            type: 'boundary',
            name: 'System',
            x: 150,
            y: 30,
            w: 350,
            h: 400,
          });
        }
        renderUcElements(container);
      });
    });

    // Relationship buttons
    container.querySelectorAll('[data-ucrel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rel = btn.dataset.ucrel;
        if (ucConnectRel === rel) {
          ucConnectRel = null;
          ucConnectSource = null;
          container.querySelectorAll('[data-ucrel]').forEach((b) => {
            b.classList.remove('active');
          });
        } else {
          ucConnectRel = rel;
          ucConnectSource = null;
          container.querySelectorAll('[data-ucrel]').forEach((b) => {
            b.classList.remove('active');
          });
          btn.classList.add('active');
        }
      });
    });

    container._ucGetRel = () => ucConnectRel;
    container._ucGetSource = () => ucConnectSource;
    container._ucSetSource = (id) => {
      ucConnectSource = id;
    };

    // Delete
    container.querySelector('#umlUcDelBtn').addEventListener('click', () => {
      if (freeSelectedElement) {
        freeElements = freeElements.filter(
          (el) => el.id !== freeSelectedElement
        );
        freeConnections = freeConnections.filter(
          (c) => c.from !== freeSelectedElement && c.to !== freeSelectedElement
        );
        freeSelectedElement = null;
        renderUcElements(container);
      }
    });

    container.querySelector('#umlUcClearBtn').addEventListener('click', () => {
      freeElements = [];
      freeConnections = [];
      freeNextId = 1;
      freeSelectedElement = null;
      renderUcElements(container);
    });

    renderUcElements(container);
  }

  function renderUcElements(container) {
    const canvas = container.querySelector('#umlUcCanvas');
    const svg = container.querySelector('#umlUcSvg');

    canvas
      .querySelectorAll('.uml-uc-actor, .uml-uc-usecase, .uml-uc-boundary')
      .forEach((el) => {
        el.remove();
      });

    freeElements.forEach((el) => {
      if (el.type === 'boundary') {
        const div = document.createElement('div');
        div.className = 'uml-uc-boundary';
        div.dataset.id = el.id;
        div.style.left = `${el.x}px`;
        div.style.top = `${el.y}px`;
        div.style.width = `${el.w || 350}px`;
        div.style.height = `${el.h || 400}px`;
        div.innerHTML = `<div class="uml-uc-boundary-title">${el.name}</div>`;
        const title = div.querySelector('.uml-uc-boundary-title');
        title.addEventListener('dblclick', () => {
          title.contentEditable = true;
          title.focus();
        });
        title.addEventListener('blur', (e) => {
          el.name = e.target.textContent;
          title.contentEditable = false;
        });
        canvas.appendChild(div);
        return;
      }

      const div = document.createElement('div');
      if (el.type === 'actor') {
        div.className = 'uml-uc-actor';
        div.innerHTML = `
          <svg viewBox="0 0 40 48" fill="none" stroke="var(--uml-actor)" stroke-width="2" stroke-linecap="round">
            <circle cx="20" cy="8" r="6"/>
            <line x1="20" y1="14" x2="20" y2="32"/>
            <line x1="8" y1="22" x2="32" y2="22"/>
            <line x1="20" y1="32" x2="10" y2="46"/>
            <line x1="20" y1="32" x2="30" y2="46"/>
          </svg>
          <div class="uml-uc-actor-label">${el.name}</div>
        `;
        const label = div.querySelector('.uml-uc-actor-label');
        label.addEventListener('dblclick', () => {
          label.contentEditable = true;
          label.focus();
        });
        label.addEventListener('blur', (e) => {
          el.name = e.target.textContent;
          label.contentEditable = false;
        });
      } else if (el.type === 'usecase') {
        div.className = 'uml-uc-usecase';
        div.textContent = el.name;
        div.contentEditable = false;
        div.addEventListener('dblclick', () => {
          div.contentEditable = true;
          div.focus();
        });
        div.addEventListener('blur', () => {
          el.name = div.textContent;
          div.contentEditable = false;
        });
      }

      div.dataset.id = el.id;
      div.style.left = `${el.x}px`;
      div.style.top = `${el.y}px`;

      if (el.id === freeSelectedElement) div.classList.add('uml-selected');

      div.addEventListener('mousedown', (e) => {
        if (e.target.isContentEditable) return;

        const connectRel = container._ucGetRel ? container._ucGetRel() : null;
        if (connectRel) {
          const source = container._ucGetSource
            ? container._ucGetSource()
            : null;
          if (!source) {
            container._ucSetSource(el.id);
          } else if (source !== el.id) {
            freeConnections.push({
              from: source,
              to: el.id,
              relType: connectRel,
            });
            container._ucSetSource(null);
            renderUcElements(container);
          }
          return;
        }

        freeSelectedElement = el.id;
        canvas
          .querySelectorAll('.uml-uc-actor, .uml-uc-usecase')
          .forEach((b) => {
            b.classList.remove('uml-selected');
          });
        div.classList.add('uml-selected');

        const startX = e.clientX - el.x;
        const startY = e.clientY - el.y;
        const onMove = (ev) => {
          el.x = Math.max(0, ev.clientX - startX);
          el.y = Math.max(0, ev.clientY - startY);
          div.style.left = `${el.x}px`;
          div.style.top = `${el.y}px`;
          drawUcConnections(svg);
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });

      canvas.appendChild(div);
    });

    drawUcConnections(svg);
  }

  function drawUcConnections(svg) {
    svg.querySelectorAll('.uml-uc-conn, .uml-uc-label').forEach((el) => {
      el.remove();
    });

    freeConnections.forEach((conn) => {
      const fromEl = freeElements.find((e) => e.id === conn.from);
      const toEl = freeElements.find((e) => e.id === conn.to);
      if (!fromEl || !toEl) return;

      const fromCenter = getUcCenter(fromEl);
      const toCenter = getUcCenter(toEl);

      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line'
      );
      line.setAttribute('class', 'uml-uc-conn');
      line.setAttribute('x1', fromCenter.x);
      line.setAttribute('y1', fromCenter.y);
      line.setAttribute('x2', toCenter.x);
      line.setAttribute('y2', toCenter.y);
      line.setAttribute('stroke', 'var(--text-secondary)');
      line.setAttribute('stroke-width', '1.5');

      if (conn.relType === 'include' || conn.relType === 'extend') {
        line.setAttribute('stroke-dasharray', '8 4');
        line.setAttribute('marker-end', 'url(#umlArrowUc)');

        // Label
        const midX = (fromCenter.x + toCenter.x) / 2;
        const midY = (fromCenter.y + toCenter.y) / 2;
        const text = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text'
        );
        text.setAttribute('class', 'uml-uc-label');
        text.setAttribute('x', midX);
        text.setAttribute('y', midY - 6);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10');
        text.setAttribute('fill', 'var(--text-secondary)');
        text.textContent = `<<${conn.relType}>>`;
        svg.appendChild(text);
      }

      svg.appendChild(line);
    });
  }

  function getUcCenter(el) {
    if (el.type === 'actor') return { x: el.x + 30, y: el.y + 30 };
    if (el.type === 'usecase') return { x: el.x + 60, y: el.y + 25 };
    return { x: el.x + 175, y: el.y + 200 };
  }

  // ============================================================
  // TAB 3: Aufgaben
  // ============================================================

  function renderExercises(container) {
    exerciseState = { currentQ: 0, answers: {}, checked: false };
    const ex = EXERCISES[currentExercise];

    container.innerHTML = `
      <div class="uml-exercise-nav">
        ${EXERCISES.map(
          (e, i) => `
          <button class="uml-exercise-btn ${i === currentExercise ? 'active' : ''} ${progress.exercises.includes(e.id) ? 'completed' : ''}"
                  data-idx="${i}">
            <span class="uml-exercise-btn-num">${i + 1}</span>
            <span class="uml-exercise-btn-title">${e.title}</span>
            ${progress.exercises.includes(e.id) ? '<span class="uml-exercise-check">&#x2713;</span>' : ''}
          </button>
        `
        ).join('')}
      </div>
      <div id="umlExerciseContent"></div>
    `;

    container.querySelectorAll('.uml-exercise-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentExercise = parseInt(btn.dataset.idx, 10);
        renderExercises(container);
      });
    });

    renderExerciseContent(ex, container);
  }

  function renderExerciseContent(ex, parentContainer) {
    const contentEl = parentContainer.querySelector('#umlExerciseContent');
    const q = ex.questions[exerciseState.currentQ];
    const diffClass =
      ex.difficulty === 'Leicht'
        ? 'uml-badge-leicht'
        : ex.difficulty === 'Mittel'
          ? 'uml-badge-mittel'
          : 'uml-badge-schwer';

    contentEl.innerHTML = `
      <div class="uml-exercise-card">
        <h3>${ex.title}</h3>
        <div class="uml-exercise-meta">
          <span class="uml-exercise-badge ${diffClass}">${ex.difficulty}</span>
          <span class="uml-exercise-badge" style="background:var(--info-bg);color:var(--info);">Frage ${exerciseState.currentQ + 1} / ${ex.questions.length}</span>
        </div>
        <p class="uml-exercise-desc">${exerciseState.currentQ === 0 ? ex.description : ''}</p>

        <p class="uml-text" style="margin-bottom:var(--space-3);"><strong>${q.question}</strong></p>

        <div class="uml-exercise-options" id="umlExOptions">
          ${q.options
            .map(
              (opt, i) => `
            <div class="uml-exercise-option" data-idx="${i}">
              <div class="uml-exercise-option-marker"></div>
              <span>${opt}</span>
            </div>
          `
            )
            .join('')}
        </div>

        <div id="umlExFeedback"></div>

        <div class="uml-exercise-actions">
          <button class="btn btn-primary" id="umlExCheck">Pruefen</button>
          <button class="btn" id="umlExNext" style="display:none;">Naechste Frage</button>
        </div>
      </div>
    `;

    // Option selection
    contentEl.querySelectorAll('.uml-exercise-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        if (exerciseState.checked) return;
        contentEl.querySelectorAll('.uml-exercise-option').forEach((o) => {
          o.classList.remove('selected');
        });
        opt.classList.add('selected');
        exerciseState.answers[exerciseState.currentQ] = parseInt(
          opt.dataset.idx,
          10
        );
      });
    });

    // Check
    contentEl.querySelector('#umlExCheck').addEventListener('click', () => {
      if (exerciseState.checked) return;
      const answer = exerciseState.answers[exerciseState.currentQ];
      if (answer === undefined) return;

      exerciseState.checked = true;
      const isCorrect = answer === q.correct;

      contentEl.querySelectorAll('.uml-exercise-option').forEach((opt) => {
        const idx = parseInt(opt.dataset.idx, 10);
        if (idx === q.correct) opt.classList.add('uml-option-correct');
        if (idx === answer && !isCorrect) opt.classList.add('uml-option-wrong');
        opt.style.pointerEvents = 'none';
      });

      const feedbackEl = contentEl.querySelector('#umlExFeedback');
      feedbackEl.innerHTML = `
        <div class="module-feedback ${isCorrect ? 'module-feedback-success' : 'module-feedback-error'}" style="margin-top:var(--space-3);">
          ${isCorrect ? '<strong>Richtig!</strong> ' : '<strong>Leider falsch.</strong> '}${q.explanation}
        </div>
      `;

      // Show next button
      const isLastQ = exerciseState.currentQ >= ex.questions.length - 1;
      const nextBtn = contentEl.querySelector('#umlExNext');

      if (isLastQ) {
        // Mark exercise complete
        markExerciseComplete(ex.id);
        nextBtn.textContent =
          currentExercise < EXERCISES.length - 1
            ? 'Naechste Aufgabe'
            : 'Fertig';
        nextBtn.style.display = '';
        nextBtn.addEventListener('click', () => {
          if (currentExercise < EXERCISES.length - 1) {
            currentExercise++;
            renderExercises(parentContainer);
          }
        });
      } else {
        nextBtn.style.display = '';
        nextBtn.textContent = 'Naechste Frage';
        nextBtn.addEventListener('click', () => {
          exerciseState.currentQ++;
          exerciseState.checked = false;
          renderExerciseContent(ex, parentContainer);
        });
      }
    });
  }

  // ============================================================
  // TAB 4: UML-Trainer
  // ============================================================

  function renderTrainer(container) {
    container.innerHTML = `
      <div class="uml-trainer">
        <div class="uml-sub-selector" id="umlTrainerSub">
          <button class="uml-sub-btn ${trainerSubType === 'cardinality' ? 'active' : ''}" data-sub="cardinality">Kardinalitaeten</button>
          <button class="uml-sub-btn ${trainerSubType === 'swimlane' ? 'active' : ''}" data-sub="swimlane">Swimlane-Zuordnung</button>
        </div>
        <div id="umlTrainerContent"></div>
      </div>
    `;

    container.querySelectorAll('.uml-sub-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.uml-sub-btn').forEach((b) => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        trainerSubType = btn.dataset.sub;
        trainerScore = 0;
        trainerRound = 0;
        renderTrainerContent(container);
      });
    });

    renderTrainerContent(container);
  }

  function renderTrainerContent(container) {
    const contentEl = container.querySelector('#umlTrainerContent');
    if (trainerSubType === 'cardinality') {
      renderKardTrainer(contentEl);
    } else {
      renderSwimTrainer(contentEl);
    }
  }

  // --- Kardinalitaeten Trainer ---
  function renderKardTrainer(container) {
    trainerRound = 0;
    trainerScore = 0;
    nextKardRound();

    container.innerHTML = `
      <div class="uml-trainer-header">
        <div class="uml-trainer-info">
          <h3>Kardinalitaeten-Trainer</h3>
          <p>Ordne die richtigen Kardinalitaeten den Beziehungsenden zu!</p>
        </div>
        <div class="uml-trainer-score">
          <span class="uml-trainer-score-label">Punkte</span>
          <span class="uml-trainer-score-value" id="umlKardScore">0</span>
        </div>
      </div>

      <div id="umlKardScenario"></div>
      <div id="umlKardPairs"></div>

      <div class="uml-chips-pool" id="umlKardChips"></div>

      <div class="uml-trainer-actions">
        <button class="btn btn-primary" id="umlKardCheck">Pruefen</button>
        <button class="btn" id="umlKardNext">Naechste Runde</button>
      </div>
      <div id="umlKardFeedback"></div>
    `;

    renderKardRound(container);
    setupKardEvents(container);
  }

  function nextKardRound() {
    trainerRound++;
    // Cycle through scenarios
    const idx = (trainerRound - 1) % KARD_SCENARIOS.length;
    trainerCurrent = KARD_SCENARIOS[idx];
    trainerPlaced = {};
  }

  function renderKardRound(container) {
    const scenario = trainerCurrent;

    // Scenario description
    const scenarioEl = container.querySelector('#umlKardScenario');
    if (scenarioEl) {
      scenarioEl.innerHTML = `
        <div class="uml-kard-scenario">
          <strong>Runde ${trainerRound}: ${scenario.title}</strong>
          <p>${scenario.description}</p>
        </div>
      `;
    }

    // Class pairs with drop zones
    const pairsEl = container.querySelector('#umlKardPairs');
    if (pairsEl) {
      pairsEl.innerHTML = `
        <div class="uml-kard-pairs">
          ${scenario.pairs
            .map(
              (pair, pi) => `
            <div class="uml-kard-pair" data-pair="${pi}">
              <div class="uml-kard-pair-class">${pair.left}</div>
              <div class="uml-kard-pair-rel">
                <div class="uml-drop-zone" data-field="p${pi}_left" data-pair="${pi}" data-side="left">?</div>
                <div class="uml-kard-line-visual ${pair.relType ? `uml-rel-${pair.relType}` : ''}"></div>
                <div class="uml-rel-label">${pair.relType === 'composition' ? 'Komposition' : pair.relType === 'aggregation' ? 'Aggregation' : pair.relType === 'inheritance' ? 'Vererbung' : 'Assoziation'}</div>
                <div class="uml-kard-line-visual"></div>
                <div class="uml-drop-zone" data-field="p${pi}_right" data-pair="${pi}" data-side="right">?</div>
              </div>
              <div class="uml-kard-pair-class">${pair.right}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }

    // Chips pool — provide duplicate chips so user can place same value twice
    const chipsEl = container.querySelector('#umlKardChips');
    if (chipsEl) {
      // Build chip list with all needed options
      const chipValues = [];
      KARD_CHIPS.forEach((v) => {
        chipValues.push(v);
        chipValues.push(v); // Duplicate so both drop zones can be filled
      });
      chipsEl.innerHTML = chipValues
        .map(
          (v, i) => `
        <div class="uml-chip" draggable="true" data-value="${v}" data-chip-idx="${i}">${v}</div>
      `
        )
        .join('');
    }

    // Reset feedback
    const feedback = container.querySelector('#umlKardFeedback');
    if (feedback) feedback.innerHTML = '';
  }

  function setupKardEvents(container) {
    const chipsPool = container.querySelector('#umlKardChips');

    // HTML5 drag from chips
    chipsPool.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('uml-chip')) {
        e.dataTransfer.setData(
          'text/plain',
          `${e.target.dataset.value}|${e.target.dataset.chipIdx}`
        );
        e.target.classList.add('uml-chip-dragging');
      }
    });

    chipsPool.addEventListener('dragend', (e) => {
      e.target.classList.remove('uml-chip-dragging');
    });

    // Drop on zones
    container.querySelectorAll('.uml-drop-zone').forEach((zone) => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('uml-drop-hover');
      });
      zone.addEventListener('dragleave', () => {
        zone.classList.remove('uml-drop-hover');
      });
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('uml-drop-hover');
        const data = e.dataTransfer.getData('text/plain');
        const [value, chipIdx] = data.split('|');
        const field = zone.dataset.field;

        zone.textContent = value;
        zone.classList.add('uml-drop-filled');
        trainerPlaced[field] = value;

        // Mark chip as used
        const chip = chipsPool.querySelector(
          `.uml-chip[data-chip-idx="${chipIdx}"]:not(.uml-chip-used)`
        );
        if (chip) chip.classList.add('uml-chip-used');
      });
    });

    // Touch fallback: tap chip then tap zone
    chipsPool.addEventListener('click', (e) => {
      if (
        e.target.classList.contains('uml-chip') &&
        !e.target.classList.contains('uml-chip-used')
      ) {
        chipsPool.querySelectorAll('.uml-chip-touch-active').forEach((c) => {
          c.classList.remove('uml-chip-touch-active');
        });
        e.target.classList.add('uml-chip-touch-active');
      }
    });

    container.querySelectorAll('.uml-drop-zone').forEach((zone) => {
      zone.addEventListener('click', () => {
        const activeChip = chipsPool.querySelector('.uml-chip-touch-active');
        if (activeChip) {
          const value = activeChip.dataset.value;
          const field = zone.dataset.field;
          zone.textContent = value;
          zone.classList.add('uml-drop-filled');
          trainerPlaced[field] = value;
          activeChip.classList.add('uml-chip-used');
          activeChip.classList.remove('uml-chip-touch-active');
        }
      });
    });

    // Check
    container.querySelector('#umlKardCheck').addEventListener('click', () => {
      checkKardTrainer(container);
    });

    // Next round
    container.querySelector('#umlKardNext').addEventListener('click', () => {
      nextKardRound();
      renderKardRound(container);

      // Rebind drop events on new zones
      container.querySelectorAll('.uml-drop-zone').forEach((zone) => {
        zone.addEventListener('dragover', (e) => {
          e.preventDefault();
          zone.classList.add('uml-drop-hover');
        });
        zone.addEventListener('dragleave', () => {
          zone.classList.remove('uml-drop-hover');
        });
        zone.addEventListener('drop', (e) => {
          e.preventDefault();
          zone.classList.remove('uml-drop-hover');
          const data = e.dataTransfer.getData('text/plain');
          const [value, chipIdx] = data.split('|');
          const field = zone.dataset.field;
          zone.textContent = value;
          zone.classList.add('uml-drop-filled');
          trainerPlaced[field] = value;
          const newChipsPool = container.querySelector('#umlKardChips');
          const chip = newChipsPool.querySelector(
            `.uml-chip[data-chip-idx="${chipIdx}"]:not(.uml-chip-used)`
          );
          if (chip) chip.classList.add('uml-chip-used');
        });
        zone.addEventListener('click', () => {
          const newChipsPool = container.querySelector('#umlKardChips');
          const activeChip = newChipsPool.querySelector(
            '.uml-chip-touch-active'
          );
          if (activeChip) {
            const value = activeChip.dataset.value;
            const field = zone.dataset.field;
            zone.textContent = value;
            zone.classList.add('uml-drop-filled');
            trainerPlaced[field] = value;
            activeChip.classList.add('uml-chip-used');
            activeChip.classList.remove('uml-chip-touch-active');
          }
        });
      });

      // Rebind chip touch
      const newChipsPool = container.querySelector('#umlKardChips');
      newChipsPool.addEventListener('click', (e) => {
        if (
          e.target.classList.contains('uml-chip') &&
          !e.target.classList.contains('uml-chip-used')
        ) {
          newChipsPool
            .querySelectorAll('.uml-chip-touch-active')
            .forEach((c) => {
              c.classList.remove('uml-chip-touch-active');
            });
          e.target.classList.add('uml-chip-touch-active');
        }
      });
      newChipsPool.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('uml-chip')) {
          e.dataTransfer.setData(
            'text/plain',
            `${e.target.dataset.value}|${e.target.dataset.chipIdx}`
          );
          e.target.classList.add('uml-chip-dragging');
        }
      });
      newChipsPool.addEventListener('dragend', (e) => {
        e.target.classList.remove('uml-chip-dragging');
      });
    });
  }

  function checkKardTrainer(container) {
    const scenario = trainerCurrent;
    let correct = 0;
    let total = 0;

    scenario.pairs.forEach((pair, pi) => {
      const leftField = `p${pi}_left`;
      const rightField = `p${pi}_right`;

      const leftZone = container.querySelector(
        `.uml-drop-zone[data-field="${leftField}"]`
      );
      const rightZone = container.querySelector(
        `.uml-drop-zone[data-field="${rightField}"]`
      );

      if (leftZone) {
        total++;
        leftZone.classList.remove('uml-input-correct', 'uml-input-wrong');
        if (trainerPlaced[leftField] === pair.leftCard) {
          leftZone.classList.add('uml-input-correct');
          correct++;
        } else {
          leftZone.classList.add('uml-input-wrong');
        }
      }

      if (rightZone) {
        total++;
        rightZone.classList.remove('uml-input-correct', 'uml-input-wrong');
        if (trainerPlaced[rightField] === pair.rightCard) {
          rightZone.classList.add('uml-input-correct');
          correct++;
        } else {
          rightZone.classList.add('uml-input-wrong');
        }
      }
    });

    const allCorrect = correct === total;
    if (allCorrect) {
      trainerScore += 10;
    } else {
      trainerScore = Math.max(
        0,
        trainerScore + correct * 2 - (total - correct)
      );
    }

    // Update best
    if (trainerScore > progress.trainer.cardBest) {
      progress.trainer.cardBest = trainerScore;
      progress.trainer.best = Math.max(progress.trainer.best, trainerScore);
      saveProgress();
    }

    container.querySelector('#umlKardScore').textContent = trainerScore;

    const solutionText = scenario.pairs
      .map(
        (pair) =>
          `${pair.left} [${pair.leftCard}] — [${pair.rightCard}] ${pair.right}`
      )
      .join(', ');

    const feedback = container.querySelector('#umlKardFeedback');
    feedback.innerHTML = `
      <div class="module-feedback ${allCorrect ? 'module-feedback-success' : 'module-feedback-error'}" style="margin-top:var(--space-3);">
        ${
          allCorrect
            ? '<strong>Perfekt!</strong> Alle Kardinalitaeten korrekt zugeordnet. +10 Punkte!'
            : `<strong>${correct} von ${total} korrekt.</strong> Loesung: ${solutionText}`
        }
      </div>
    `;
  }

  // --- Swimlane-Zuordnung Trainer ---
  function renderSwimTrainer(container) {
    trainerRound = 0;
    trainerScore = 0;
    nextSwimRound();

    container.innerHTML = `
      <div class="uml-trainer-header">
        <div class="uml-trainer-info">
          <h3>Swimlane-Zuordnung</h3>
          <p>Ordne die Aktionen den richtigen Verantwortungsbereichen (Swimlanes) zu!</p>
        </div>
        <div class="uml-trainer-score">
          <span class="uml-trainer-score-label">Punkte</span>
          <span class="uml-trainer-score-value" id="umlSwimScore">0</span>
        </div>
      </div>

      <div id="umlSwimScenario"></div>
      <div id="umlSwimLanes"></div>

      <div class="uml-chips-pool" id="umlSwimChips"></div>

      <div class="uml-trainer-actions">
        <button class="btn btn-primary" id="umlSwimCheck">Pruefen</button>
        <button class="btn" id="umlSwimNext">Naechste Runde</button>
      </div>
      <div id="umlSwimFeedback"></div>
    `;

    renderSwimRound(container);
    setupSwimEvents(container);
  }

  function nextSwimRound() {
    trainerRound++;
    const idx = (trainerRound - 1) % SWIM_SCENARIOS.length;
    trainerCurrent = SWIM_SCENARIOS[idx];
    trainerPlaced = {}; // lane -> [actionText]
  }

  function renderSwimRound(container) {
    const scenario = trainerCurrent;

    const scenarioEl = container.querySelector('#umlSwimScenario');
    if (scenarioEl) {
      scenarioEl.innerHTML = `
        <div class="uml-swim-scenario">
          <strong>Runde ${trainerRound}: ${scenario.title}</strong>
          <p>${scenario.description}</p>
        </div>
      `;
    }

    // Lanes as drop zones
    const lanesEl = container.querySelector('#umlSwimLanes');
    if (lanesEl) {
      lanesEl.innerHTML = `
        <div class="uml-swim-lanes" style="grid-template-columns: repeat(${scenario.lanes.length}, 1fr);">
          ${scenario.lanes
            .map(
              (lane) => `
            <div class="uml-swim-lane" data-lane="${lane}">
              <div class="uml-swim-lane-header">${lane}</div>
              <div class="uml-swim-lane-drop" data-lane="${lane}"></div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }

    // Shuffled action chips
    const shuffled = [...scenario.actions].sort(() => Math.random() - 0.5);
    const chipsEl = container.querySelector('#umlSwimChips');
    if (chipsEl) {
      chipsEl.innerHTML = shuffled
        .map(
          (a, i) => `
        <div class="uml-swim-action-chip" draggable="true" data-text="${a.text}" data-idx="${i}">${a.text}</div>
      `
        )
        .join('');
    }

    // Reset placed
    trainerPlaced = {};
    scenario.lanes.forEach((lane) => {
      trainerPlaced[lane] = [];
    });

    const feedback = container.querySelector('#umlSwimFeedback');
    if (feedback) feedback.innerHTML = '';
  }

  function setupSwimEvents(container) {
    bindSwimDragDrop(container);

    // Check
    container.querySelector('#umlSwimCheck').addEventListener('click', () => {
      checkSwimTrainer(container);
    });

    // Next round
    container.querySelector('#umlSwimNext').addEventListener('click', () => {
      nextSwimRound();
      renderSwimRound(container);
      bindSwimDragDrop(container);
    });
  }

  function bindSwimDragDrop(container) {
    const chipsPool = container.querySelector('#umlSwimChips');

    // Drag from chips
    chipsPool.addEventListener('dragstart', (e) => {
      const chip = e.target.closest('.uml-swim-action-chip');
      if (chip) {
        e.dataTransfer.setData('text/plain', chip.dataset.text);
        chip.classList.add('uml-chip-dragging');
      }
    });

    chipsPool.addEventListener('dragend', (e) => {
      const chip = e.target.closest('.uml-swim-action-chip');
      if (chip) chip.classList.remove('uml-chip-dragging');
    });

    // Drop on lanes
    container.querySelectorAll('.uml-swim-lane-drop').forEach((drop) => {
      drop.addEventListener('dragover', (e) => {
        e.preventDefault();
        drop.classList.add('uml-drop-hover');
      });
      drop.addEventListener('dragleave', () => {
        drop.classList.remove('uml-drop-hover');
      });
      drop.addEventListener('drop', (e) => {
        e.preventDefault();
        drop.classList.remove('uml-drop-hover');
        const text = e.dataTransfer.getData('text/plain');
        const lane = drop.dataset.lane;

        // Move chip to lane
        placeSwimChip(container, text, lane, drop);
      });

      // Touch fallback: tap zone
      drop.addEventListener('click', () => {
        const activeChip = chipsPool.querySelector('.uml-chip-touch-active');
        if (activeChip) {
          const text = activeChip.dataset.text;
          const lane = drop.dataset.lane;
          placeSwimChip(container, text, lane, drop);
          activeChip.classList.remove('uml-chip-touch-active');
        }
      });
    });

    // Touch fallback: tap chip to select
    chipsPool.addEventListener('click', (e) => {
      const chip = e.target.closest('.uml-swim-action-chip');
      if (chip) {
        chipsPool.querySelectorAll('.uml-chip-touch-active').forEach((c) => {
          c.classList.remove('uml-chip-touch-active');
        });
        chip.classList.add('uml-chip-touch-active');
      }
    });
  }

  function placeSwimChip(container, text, lane, dropZone) {
    const chipsPool = container.querySelector('#umlSwimChips');

    // Remove from pool
    const chip = chipsPool.querySelector(
      `.uml-swim-action-chip[data-text="${text}"]`
    );
    if (chip) chip.remove();

    // Add to lane drop zone
    const placed = document.createElement('div');
    placed.className = 'uml-swim-action-chip';
    placed.textContent = text;
    placed.dataset.text = text;
    dropZone.appendChild(placed);

    // Track placement
    if (!trainerPlaced[lane]) trainerPlaced[lane] = [];
    trainerPlaced[lane].push(text);
  }

  function checkSwimTrainer(container) {
    const scenario = trainerCurrent;
    let correct = 0;
    const total = scenario.actions.length;

    // Check each placed action
    container.querySelectorAll('.uml-swim-lane-drop').forEach((drop) => {
      const lane = drop.dataset.lane;
      drop.querySelectorAll('.uml-swim-action-chip').forEach((chip) => {
        const text = chip.dataset.text;
        const correctAction = scenario.actions.find((a) => a.text === text);
        chip.classList.remove('uml-swim-correct', 'uml-swim-wrong');
        if (correctAction && correctAction.lane === lane) {
          chip.classList.add('uml-swim-correct');
          correct++;
        } else {
          chip.classList.add('uml-swim-wrong');
        }
      });
    });

    // Count unplaced
    const chipsPool = container.querySelector('#umlSwimChips');
    const unplaced = chipsPool.querySelectorAll('.uml-swim-action-chip').length;

    const allCorrect = correct === total && unplaced === 0;
    if (allCorrect) {
      trainerScore += 10;
    } else {
      trainerScore = Math.max(
        0,
        trainerScore + correct * 2 - (total - correct)
      );
    }

    if (trainerScore > progress.trainer.swimBest) {
      progress.trainer.swimBest = trainerScore;
      progress.trainer.best = Math.max(progress.trainer.best, trainerScore);
      saveProgress();
    }

    container.querySelector('#umlSwimScore').textContent = trainerScore;

    const solutionText = scenario.lanes
      .map((lane) => {
        const laneActions = scenario.actions
          .filter((a) => a.lane === lane)
          .map((a) => a.text);
        return `<strong>${lane}:</strong> ${laneActions.join(', ')}`;
      })
      .join('<br>');

    const feedback = container.querySelector('#umlSwimFeedback');
    feedback.innerHTML = `
      <div class="module-feedback ${allCorrect ? 'module-feedback-success' : 'module-feedback-error'}" style="margin-top:var(--space-3);">
        ${
          allCorrect
            ? '<strong>Perfekt!</strong> Alle Aktionen richtig zugeordnet. +10 Punkte!'
            : `<strong>${correct} von ${total} korrekt.</strong><br>${solutionText}`
        }
      </div>
    `;
  }

  // ============================================================
  // EXPORT
  // ============================================================

  return { render, cleanup };
})();

export default UMLView;
