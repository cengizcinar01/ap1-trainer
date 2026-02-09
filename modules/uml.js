// ============================================================
// uml.js — UML-Diagramm-Werkstatt (Modul 4)
// Use-Case-Diagramm-Szenarien (IHK-Stil), Kardinalitaeten-
// und Swimlane-Trainer.
// ============================================================

const UMLView = (() => {
  let currentTab = 'explanation';
  let cleanup_fns = [];
  const progress = loadProgress();

  // Sub-selectors
  let trainerSubType = 'cardinality';

  // Trainer state
  let trainerScore = 0;
  let trainerRound = 0;
  let trainerCurrent = null;
  let trainerPlaced = {};

  // Scenario state
  let currentScenario = 0;
  let scenarioPlaced = {};

  // ============================================================
  // PERSISTENCE
  // ============================================================

  function loadProgress() {
    try {
      const raw = localStorage.getItem('ap1_uml_progress');
      if (!raw) return { scenarios: [], trainer: { best: 0, cardBest: 0, swimBest: 0 } };
      const p = JSON.parse(raw);
      // Migrate old format
      if (p.exercises && !p.scenarios) {
        p.scenarios = [];
        delete p.exercises;
      }
      if (!p.scenarios) p.scenarios = [];
      if (!p.trainer) p.trainer = { best: 0, cardBest: 0, swimBest: 0 };
      return p;
    } catch {
      return { scenarios: [], trainer: { best: 0, cardBest: 0, swimBest: 0 } };
    }
  }

  function saveProgress() {
    localStorage.setItem('ap1_uml_progress', JSON.stringify(progress));
  }

  function markScenarioComplete(id) {
    if (!progress.scenarios.includes(id)) {
      progress.scenarios.push(id);
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
    {
      id: 7,
      title: 'Rechnungseingang (H25)',
      description: 'Prozess der Rechnungspruefung mit Parallelisierung bei Betraegen > 1000\u20AC.',
      lanes: ['Wareneingang', 'Buchhaltung', 'Management'],
      actions: [
        { text: 'Rechnung empfangen', lane: 'Buchhaltung' },
        { text: 'Bestellung abgleichen', lane: 'Wareneingang' },
        { text: 'Betrag > 1000\u20AC?', lane: 'Buchhaltung' },
        { text: 'Freigabe erteilen', lane: 'Management' },
        { text: 'Wareneingang pruefen', lane: 'Wareneingang' },
        { text: 'Rechnung buchen', lane: 'Buchhaltung' },
      ],
    },
  ];

  // ============================================================
  // DATA: Use-Case Szenarien (IHK-Stil)
  // ============================================================

  const UC_SCENARIOS = [
    {
      id: 1,
      title: 'IT-Stoerungsmeldung',
      difficulty: 'Mittel',
      points: 6,
      context:
        'Die OptiSoft-XXL GmbH moechte ihre Servicequalitaet verbessern. Der bestehende Prozess zeigt Schwachstellen. ' +
        'Hierzu erhalten Sie von der IT-Abteilung die folgenden Informationen:\n' +
        '- Kunden senden Stoerungsmeldungen\n' +
        '- Die Stoerungsmeldungen werden von der IT-Abteilung erfasst\n' +
        '- Die IT-Abteilung erstellt den Arbeitsplan fuer die kommende Woche/Festtag. Dies beinhaltet auf immer eine Priorisierung\n' +
        '- Die Arbeitsauftraege werden vom Serviceteam bearbeitet. Dies beinhaltet immer eine Rueckmeldung',
      systemName: 'Stoerungsmanagement',
      actors: [
        { id: 'a1', name: 'Kunde', x: 30, y: 100, given: true },
        { id: 'a2', name: 'IT-Abteilung', x: 520, y: 60, given: false },
        { id: 'a3', name: 'Serviceteam', x: 520, y: 280, given: true },
      ],
      usecases: [
        { id: 'uc1', name: 'Stoerungsmeldung senden', cx: 200, cy: 70, given: false },
        { id: 'uc2', name: 'Stoerungsmeldung erfassen', cx: 300, cy: 140, given: true },
        { id: 'uc3', name: 'Arbeitsplan erstellen', cx: 200, cy: 210, given: false },
        { id: 'uc4', name: 'Arbeitsauftrag bearbeiten', cx: 300, cy: 290, given: true },
        { id: 'uc5', name: 'Priorisierung durchfuehren', cx: 200, cy: 360, given: false },
        { id: 'uc6', name: 'Rueckmeldung senden', cx: 360, cy: 380, given: false },
      ],
      connections: [
        { from: 'a1', to: 'uc1', type: 'association' },
        { from: 'a2', to: 'uc2', type: 'association' },
        { from: 'a2', to: 'uc3', type: 'association' },
        { from: 'a3', to: 'uc4', type: 'association' },
        { from: 'uc3', to: 'uc5', type: 'include' },
        { from: 'uc4', to: 'uc6', type: 'include' },
      ],
      distractors: ['Datenbank aktualisieren', 'Rechnung erstellen'],
      explanation:
        'Der Kunde sendet eine Stoerungsmeldung, die von der IT-Abteilung erfasst wird. ' +
        'Die IT-Abteilung erstellt den Arbeitsplan (inkl. Priorisierung). Das Serviceteam bearbeitet ' +
        'die Auftraege (inkl. Rueckmeldung). Include-Beziehungen zeigen zwingend ausgefuehrte Teilprozesse.',
    },
    {
      id: 2,
      title: 'Bibliothekssystem',
      difficulty: 'Leicht',
      points: 6,
      context:
        'Die Stadtbibliothek digitalisiert ihre Ausleihe. ' +
        'Folgende Ablaeufe sind vorgesehen:\n' +
        '- Leser koennen Buecher ausleihen und zurueckgeben\n' +
        '- Jede Ausleihe erfordert eine Ausweispruefung\n' +
        '- Leser koennen eine Verlaengerung beantragen\n' +
        '- Bei verspaeteter Rueckgabe wird optional eine Mahngebuehr berechnet',
      systemName: 'Bibliothekssystem',
      actors: [
        { id: 'a1', name: 'Leser', x: 30, y: 150, given: true },
        { id: 'a2', name: 'Bibliothekar', x: 520, y: 150, given: false },
      ],
      usecases: [
        { id: 'uc1', name: 'Buch ausleihen', cx: 200, cy: 80, given: true },
        { id: 'uc2', name: 'Buch zurueckgeben', cx: 330, cy: 80, given: false },
        { id: 'uc3', name: 'Ausweis pruefen', cx: 200, cy: 200, given: false },
        { id: 'uc4', name: 'Verlaengerung beantragen', cx: 330, cy: 200, given: true },
        { id: 'uc5', name: 'Mahngebuehr berechnen', cx: 270, cy: 330, given: false },
      ],
      connections: [
        { from: 'a1', to: 'uc1', type: 'association' },
        { from: 'a1', to: 'uc2', type: 'association' },
        { from: 'a1', to: 'uc4', type: 'association' },
        { from: 'a2', to: 'uc1', type: 'association' },
        { from: 'a2', to: 'uc2', type: 'association' },
        { from: 'uc1', to: 'uc3', type: 'include' },
        { from: 'uc2', to: 'uc5', type: 'extend' },
      ],
      distractors: ['Buch katalogisieren', 'Mitgliedschaft kuendigen'],
      explanation:
        'Leser und Bibliothekar interagieren mit Ausleihe und Rueckgabe. ' +
        'Die Ausweispruefung ist per <<include>> immer Teil der Ausleihe. ' +
        'Die Mahngebuehr wird nur bei Verspaetung berechnet (<<extend>>).',
    },
    {
      id: 3,
      title: 'Online-Bestellsystem',
      difficulty: 'Leicht',
      points: 6,
      context:
        'Die WebShop GmbH modelliert ihren Bestellprozess:\n' +
        '- Kunden suchen Produkte und geben Bestellungen auf\n' +
        '- Jede Bestellung erfordert eine Zahlung\n' +
        '- Optional kann ein Gutschein eingeloest werden\n' +
        '- Der Lagermitarbeiter versendet die Bestellung',
      systemName: 'Online-Bestellsystem',
      actors: [
        { id: 'a1', name: 'Kunde', x: 30, y: 130, given: true },
        { id: 'a2', name: 'Lagermitarbeiter', x: 520, y: 200, given: false },
      ],
      usecases: [
        { id: 'uc1', name: 'Produkt suchen', cx: 200, cy: 60, given: true },
        { id: 'uc2', name: 'Bestellung aufgeben', cx: 300, cy: 140, given: false },
        { id: 'uc3', name: 'Zahlung durchfuehren', cx: 200, cy: 230, given: false },
        { id: 'uc4', name: 'Bestellung versenden', cx: 330, cy: 300, given: true },
        { id: 'uc5', name: 'Gutschein einloesen', cx: 200, cy: 360, given: false },
      ],
      connections: [
        { from: 'a1', to: 'uc1', type: 'association' },
        { from: 'a1', to: 'uc2', type: 'association' },
        { from: 'a2', to: 'uc4', type: 'association' },
        { from: 'uc2', to: 'uc3', type: 'include' },
        { from: 'uc2', to: 'uc5', type: 'extend' },
      ],
      distractors: ['Lager auffuellen', 'Kundenbewertung schreiben'],
      explanation:
        'Der Kunde sucht Produkte und gibt Bestellungen auf. Die Zahlung ist per <<include>> ' +
        'zwingend Teil jeder Bestellung. Ein Gutschein kann optional eingeloest werden (<<extend>>). ' +
        'Der Lagermitarbeiter versendet die Bestellung.',
    },
    {
      id: 4,
      title: 'Arztpraxis-Verwaltung',
      difficulty: 'Mittel',
      points: 6,
      context:
        'Eine Arztpraxis digitalisiert ihre Terminverwaltung:\n' +
        '- Patienten vereinbaren Termine\n' +
        '- Die Sprechstundenhilfe nimmt Patienten auf, dabei wird immer die Versichertenkarte geprueft\n' +
        '- Der Arzt fuehrt Untersuchungen durch und stellt Rezepte aus\n' +
        '- Optional wird eine Ueberweisung ausgestellt',
      systemName: 'Praxisverwaltung',
      actors: [
        { id: 'a1', name: 'Patient', x: 30, y: 100, given: true },
        { id: 'a2', name: 'Sprechstundenhilfe', x: 520, y: 60, given: false },
        { id: 'a3', name: 'Arzt', x: 520, y: 260, given: false },
      ],
      usecases: [
        { id: 'uc1', name: 'Termin vereinbaren', cx: 200, cy: 60, given: true },
        { id: 'uc2', name: 'Patient aufnehmen', cx: 320, cy: 120, given: false },
        { id: 'uc3', name: 'Untersuchung durchfuehren', cx: 230, cy: 210, given: true },
        { id: 'uc4', name: 'Rezept ausstellen', cx: 330, cy: 280, given: false },
        { id: 'uc5', name: 'Versichertenkarte pruefen', cx: 200, cy: 360, given: false },
        { id: 'uc6', name: 'Ueberweisung ausstellen', cx: 350, cy: 380, given: true },
      ],
      connections: [
        { from: 'a1', to: 'uc1', type: 'association' },
        { from: 'a2', to: 'uc1', type: 'association' },
        { from: 'a2', to: 'uc2', type: 'association' },
        { from: 'a3', to: 'uc3', type: 'association' },
        { from: 'a3', to: 'uc4', type: 'association' },
        { from: 'uc2', to: 'uc5', type: 'include' },
        { from: 'uc3', to: 'uc6', type: 'extend' },
      ],
      distractors: ['Medikament bestellen', 'Laborergebnis auswerten'],
      explanation:
        'Patient und Sprechstundenhilfe sind bei der Terminvereinbarung beteiligt. ' +
        'Die Patientenaufnahme beinhaltet zwingend die Pruefung der Versichertenkarte (<<include>>). ' +
        'Eine Ueberweisung wird nur bei Bedarf ausgestellt (<<extend>>).',
    },
    {
      id: 5,
      title: 'Helpdesk-System',
      difficulty: 'Mittel',
      points: 6,
      context:
        'Ein IT-Dienstleister modelliert sein Ticket-System:\n' +
        '- Anwender erstellen Tickets\n' +
        '- Der 1st-Level-Support klassifiziert Tickets, dabei wird immer eine Prioritaet zugewiesen\n' +
        '- Der 2nd-Level-Support dokumentiert Loesungen\n' +
        '- Bei Bedarf werden Tickets eskaliert\n' +
        '- Optional kann ein Remote-Zugriff gestartet werden',
      systemName: 'Helpdesk-System',
      actors: [
        { id: 'a1', name: 'Anwender', x: 30, y: 120, given: true },
        { id: 'a2', name: '1st-Level-Support', x: 520, y: 80, given: false },
        { id: 'a3', name: '2nd-Level-Support', x: 520, y: 300, given: false },
      ],
      usecases: [
        { id: 'uc1', name: 'Ticket erstellen', cx: 200, cy: 60, given: true },
        { id: 'uc2', name: 'Ticket klassifizieren', cx: 320, cy: 120, given: false },
        { id: 'uc3', name: 'Loesung dokumentieren', cx: 230, cy: 210, given: true },
        { id: 'uc4', name: 'Ticket eskalieren', cx: 320, cy: 280, given: false },
        { id: 'uc5', name: 'Prioritaet zuweisen', cx: 200, cy: 360, given: false },
        { id: 'uc6', name: 'Remote-Zugriff starten', cx: 350, cy: 380, given: true },
      ],
      connections: [
        { from: 'a1', to: 'uc1', type: 'association' },
        { from: 'a2', to: 'uc2', type: 'association' },
        { from: 'a2', to: 'uc4', type: 'association' },
        { from: 'a3', to: 'uc3', type: 'association' },
        { from: 'a3', to: 'uc4', type: 'association' },
        { from: 'uc2', to: 'uc5', type: 'include' },
        { from: 'uc3', to: 'uc6', type: 'extend' },
      ],
      distractors: ['Server neustarten', 'Backup erstellen'],
      explanation:
        'Anwender erstellen Tickets. Der 1st-Level-Support klassifiziert diese (inkl. Prioritaetszuweisung ' +
        'per <<include>>). Eskalation erfolgt bei Bedarf an den 2nd-Level-Support. ' +
        'Remote-Zugriff ist optional bei der Loesungsdokumentation (<<extend>>).',
    },
    {
      id: 6,
      title: 'Personalverwaltung',
      difficulty: 'Schwer',
      points: 6,
      context:
        'Der Bewerbungsprozess einer Firma wird modelliert:\n' +
        '- Bewerber reichen Bewerbungen ein\n' +
        '- Die Personalabteilung prueft die Unterlagen\n' +
        '- Vorstellungsgespraeche werden gefuehrt, dabei erfolgt immer eine fachliche Bewertung\n' +
        '- Die Personalabteilung versendet Zu- oder Absagen\n' +
        '- Optional wird ein Assessment-Center durchgefuehrt',
      systemName: 'Personalverwaltung',
      actors: [
        { id: 'a1', name: 'Bewerber', x: 30, y: 120, given: true },
        { id: 'a2', name: 'Personalabteilung', x: 520, y: 60, given: false },
        { id: 'a3', name: 'Fachabteilung', x: 520, y: 280, given: false },
      ],
      usecases: [
        { id: 'uc1', name: 'Bewerbung einreichen', cx: 200, cy: 60, given: true },
        { id: 'uc2', name: 'Unterlagen pruefen', cx: 320, cy: 120, given: false },
        { id: 'uc3', name: 'Vorstellungsgespraech fuehren', cx: 220, cy: 210, given: true },
        { id: 'uc4', name: 'Zu-/Absage versenden', cx: 330, cy: 280, given: false },
        { id: 'uc5', name: 'Fachliche Bewertung', cx: 200, cy: 360, given: false },
        { id: 'uc6', name: 'Assessment-Center durchfuehren', cx: 350, cy: 380, given: true },
      ],
      connections: [
        { from: 'a1', to: 'uc1', type: 'association' },
        { from: 'a2', to: 'uc2', type: 'association' },
        { from: 'a2', to: 'uc4', type: 'association' },
        { from: 'a3', to: 'uc3', type: 'association' },
        { from: 'a2', to: 'uc3', type: 'association' },
        { from: 'uc3', to: 'uc5', type: 'include' },
        { from: 'uc3', to: 'uc6', type: 'extend' },
      ],
      distractors: ['Arbeitsvertrag erstellen', 'Gehaltsabrechnung pruefen'],
      explanation:
        'Bewerber reichen Bewerbungen ein, die Personalabteilung prueft und versendet Zu-/Absagen. ' +
        'Beim Vorstellungsgespraech ist die fachliche Bewertung zwingend (<<include>>). ' +
        'Ein Assessment-Center ist optional (<<extend>>). Die Fachabteilung ist am Gespraech beteiligt.',
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
    currentScenario = 0;
    scenarioPlaced = {};

    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <div class="page-header-left">
            <div>
              <h1 class="page-title">UML-Werkstatt</h1>
              <p class="page-subtitle">Use-Case-Diagramme, Kardinalitaeten & Swimlanes — Pruefungsrelevant seit 2025</p>
            </div>
          </div>
        </div>

        <div class="module-tabs" id="umlTabs">
          <button class="module-tab active" data-tab="explanation">Erklaerung</button>
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
    cleanup_fns.forEach((fn) => fn());
    cleanup_fns = [];
    tabContent.innerHTML = '';
    switch (currentTab) {
      case 'explanation':
        renderExplanation(tabContent);
        break;
      case 'exercises':
        renderScenarios(tabContent);
        break;
      case 'trainer':
        renderTrainer(tabContent);
        break;
    }
  }

  function cleanup() {
    cleanup_fns.forEach((fn) => fn());
    cleanup_fns = [];
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
  // TAB 2: Aufgaben (Use-Case Szenarien, IHK-Stil)
  // ============================================================

  function renderScenarios(container) {
    scenarioPlaced = {};
    const sc = UC_SCENARIOS[currentScenario];

    container.innerHTML = `
      <div class="uml-exercise-nav">
        ${UC_SCENARIOS.map(
          (s, i) => `
          <button class="uml-exercise-btn ${i === currentScenario ? 'active' : ''} ${progress.scenarios.includes(s.id) ? 'completed' : ''}"
                  data-idx="${i}">
            <span class="uml-exercise-btn-num">${i + 1}</span>
            <span class="uml-exercise-btn-title">${s.title}</span>
            ${progress.scenarios.includes(s.id) ? '<span class="uml-exercise-check">&#x2713;</span>' : ''}
          </button>
        `
        ).join('')}
      </div>
      <div id="umlScenarioContent"></div>
    `;

    container.querySelectorAll('.uml-exercise-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentScenario = parseInt(btn.dataset.idx, 10);
        renderScenarios(container);
      });
    });

    renderScenarioContent(sc, container);
  }

  function renderScenarioContent(sc, parentContainer) {
    const contentEl = parentContainer.querySelector('#umlScenarioContent');
    scenarioPlaced = {};

    const diffClass =
      sc.difficulty === 'Leicht'
        ? 'uml-badge-leicht'
        : sc.difficulty === 'Mittel'
          ? 'uml-badge-mittel'
          : 'uml-badge-schwer';

    // Collect blank labels (items where given: false)
    const blanks = [];
    sc.actors.forEach((a) => {
      if (!a.given) blanks.push({ id: a.id, name: a.name, type: 'actor' });
    });
    sc.usecases.forEach((uc) => {
      if (!uc.given) blanks.push({ id: uc.id, name: uc.name, type: 'usecase' });
    });

    // Create chips: blank labels + distractors, shuffled
    const allChips = [
      ...blanks.map((b) => b.name),
      ...sc.distractors,
    ].sort(() => Math.random() - 0.5);

    // Determine diagram dimensions
    const diagramH = 450;

    // Build context with line breaks
    const contextHtml = sc.context
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ')) {
          return `<span style="display:block;padding-left:var(--space-4);">${trimmed}</span>`;
        }
        return trimmed;
      })
      .join('');

    contentEl.innerHTML = `
      <div class="uml-exercise-card">
        <h3>${sc.title}</h3>
        <div class="uml-exercise-meta">
          <span class="uml-exercise-badge ${diffClass}">${sc.difficulty}</span>
          <span class="uml-exercise-badge" style="background:var(--info-bg);color:var(--info);">${sc.points} Punkte</span>
        </div>
        <p class="uml-exercise-desc">${contextHtml}</p>

        <div class="uml-hint-box">
          Ergaenzen Sie das angefangene Use-Case-Diagramm: Ziehen Sie die fehlenden Elemente
          (Akteure, Anwendungsfaelle) aus dem Pool in die markierten Leerstellen.
        </div>

        <div class="uml-scenario-diagram" style="position:relative;height:${diagramH}px;margin-bottom:var(--space-4);">
          ${renderUcDiagram(sc, diagramH)}
        </div>

        <div class="uml-chips-pool" id="umlScenarioChips">
          ${allChips.map((label, i) => `
            <div class="uml-chip uml-scenario-chip" draggable="true" data-value="${label}" data-chip-idx="${i}">${label}</div>
          `).join('')}
        </div>

        <div class="uml-exercise-actions">
          <button class="btn btn-primary" id="umlScenarioCheck">Pruefen</button>
          <button class="btn" id="umlScenarioSolution" style="display:none;">Loesung zeigen</button>
          <button class="btn" id="umlScenarioNext" style="display:none;">Naechstes Szenario</button>
        </div>
        <div id="umlScenarioFeedback"></div>
      </div>
    `;

    setupScenarioDragDrop(contentEl, sc, parentContainer);
  }

  function renderUcDiagram(sc, height) {
    // System boundary
    const boundaryLeft = 130;
    const boundaryTop = 20;
    const boundaryW = 420;
    const boundaryH = height - 40;

    let html = '';

    // System boundary box
    html += `<div class="uml-scenario-boundary" style="left:${boundaryLeft}px;top:${boundaryTop}px;width:${boundaryW}px;height:${boundaryH}px;">
      <div class="uml-scenario-boundary-title">${sc.systemName}</div>
    </div>`;

    // SVG overlay for connections
    html += `<svg class="uml-scenario-svg" width="100%" height="100%">
      <defs>
        <marker id="umlScArrowInc" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--uml-class)"/>
        </marker>
        <marker id="umlScArrowExt" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--uml-decision)"/>
        </marker>
      </defs>
      ${renderConnections(sc)}
    </svg>`;

    // Actors
    sc.actors.forEach((actor) => {
      if (actor.given) {
        html += renderActorElement(actor, true);
      } else {
        html += renderActorDropZone(actor);
      }
    });

    // Use Cases
    sc.usecases.forEach((uc) => {
      if (uc.given) {
        html += renderUseCaseElement(uc, true);
      } else {
        html += renderUseCaseDropZone(uc);
      }
    });

    return html;
  }

  function renderActorElement(actor, isGiven) {
    const actorSvg = `<svg viewBox="0 0 40 48" fill="none" stroke="var(--uml-actor)" stroke-width="2" stroke-linecap="round" width="36" height="42">
      <circle cx="20" cy="8" r="6"/>
      <line x1="20" y1="14" x2="20" y2="32"/>
      <line x1="8" y1="22" x2="32" y2="22"/>
      <line x1="20" y1="32" x2="10" y2="46"/>
      <line x1="20" y1="32" x2="30" y2="46"/>
    </svg>`;
    return `<div class="uml-scenario-actor ${isGiven ? '' : 'uml-scenario-filled'}" style="left:${actor.x}px;top:${actor.y}px;" data-id="${actor.id}">
      <div class="uml-scenario-actor-label">${actor.name}</div>
      ${actorSvg}
    </div>`;
  }

  function renderActorDropZone(actor) {
    const actorSvg = `<svg viewBox="0 0 40 48" fill="none" stroke="var(--border-light)" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 3" width="36" height="42">
      <circle cx="20" cy="8" r="6"/>
      <line x1="20" y1="14" x2="20" y2="32"/>
      <line x1="8" y1="22" x2="32" y2="22"/>
      <line x1="20" y1="32" x2="10" y2="46"/>
      <line x1="20" y1="32" x2="30" y2="46"/>
    </svg>`;
    return `<div class="uml-scenario-actor uml-scenario-drop-zone" style="left:${actor.x}px;top:${actor.y}px;" data-id="${actor.id}" data-type="actor" data-expected="${actor.name}">
      <div class="uml-scenario-actor-label uml-scenario-blank">?</div>
      ${actorSvg}
    </div>`;
  }

  function renderUseCaseElement(uc, isGiven) {
    return `<div class="uml-scenario-usecase ${isGiven ? '' : 'uml-scenario-filled'}" style="left:${uc.cx}px;top:${uc.cy}px;" data-id="${uc.id}">
      ${uc.name}
    </div>`;
  }

  function renderUseCaseDropZone(uc) {
    return `<div class="uml-scenario-usecase uml-scenario-drop-zone uml-scenario-usecase-blank" style="left:${uc.cx}px;top:${uc.cy}px;" data-id="${uc.id}" data-type="usecase" data-expected="${uc.name}">
      ?
    </div>`;
  }

  function renderConnections(sc) {
    let svg = '';

    sc.connections.forEach((conn) => {
      const fromActor = sc.actors.find((a) => a.id === conn.from);
      const fromUc = sc.usecases.find((u) => u.id === conn.from);
      const toActor = sc.actors.find((a) => a.id === conn.to);
      const toUc = sc.usecases.find((u) => u.id === conn.to);

      const from = fromActor
        ? { x: fromActor.x + 35, y: fromActor.y + 30 }
        : fromUc
          ? { x: fromUc.cx + 70, y: fromUc.cy + 22 }
          : null;
      const to = toActor
        ? { x: toActor.x + 35, y: toActor.y + 30 }
        : toUc
          ? { x: toUc.cx + 70, y: toUc.cy + 22 }
          : null;

      if (!from || !to) return;

      const isDashed = conn.type === 'include' || conn.type === 'extend';
      const dashAttr = isDashed ? 'stroke-dasharray="8 4"' : '';
      const markerAttr = isDashed ? 'marker-end="url(#umlScArrow)"' : '';

      svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"
        stroke="var(--text-secondary)" stroke-width="1.5" ${dashAttr} ${markerAttr}/>`;

      if (isDashed) {
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        svg += `<text x="${midX}" y="${midY - 6}" text-anchor="middle" font-size="10"
          fill="var(--text-secondary)">&lt;&lt;${conn.type}&gt;&gt;</text>`;
      }
    });

    return svg;
  }

  function setupScenarioDragDrop(contentEl, sc, parentContainer) {
    const chipsPool = contentEl.querySelector('#umlScenarioChips');
    const dropZones = contentEl.querySelectorAll('.uml-scenario-drop-zone');

    // HTML5 drag from chips
    chipsPool.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('uml-scenario-chip')) {
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

    // Drop zones
    dropZones.forEach((zone) => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('uml-scenario-drop-hover');
      });
      zone.addEventListener('dragleave', () => {
        zone.classList.remove('uml-scenario-drop-hover');
      });
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('uml-scenario-drop-hover');
        const data = e.dataTransfer.getData('text/plain');
        const [value, chipIdx] = data.split('|');
        placeScenarioChip(contentEl, zone, value, chipIdx);
      });

      // Touch fallback: tap zone after selecting chip
      zone.addEventListener('click', () => {
        const activeChip = chipsPool.querySelector('.uml-chip-touch-active');
        if (activeChip) {
          placeScenarioChip(contentEl, zone, activeChip.dataset.value, activeChip.dataset.chipIdx);
          activeChip.classList.remove('uml-chip-touch-active');
        }
      });
    });

    // Touch fallback: tap chip to select
    chipsPool.addEventListener('click', (e) => {
      if (
        e.target.classList.contains('uml-scenario-chip') &&
        !e.target.classList.contains('uml-chip-used')
      ) {
        chipsPool.querySelectorAll('.uml-chip-touch-active').forEach((c) => {
          c.classList.remove('uml-chip-touch-active');
        });
        e.target.classList.add('uml-chip-touch-active');
      }
    });

    // Check button
    contentEl.querySelector('#umlScenarioCheck').addEventListener('click', () => {
      checkScenario(contentEl, sc, parentContainer);
    });
  }

  function placeScenarioChip(contentEl, zone, value, chipIdx) {
    const chipsPool = contentEl.querySelector('#umlScenarioChips');
    const zoneId = zone.dataset.id;
    const zoneType = zone.dataset.type;

    // If zone already has a value, return old chip to pool
    if (scenarioPlaced[zoneId]) {
      const oldChip = chipsPool.querySelector(
        `.uml-scenario-chip[data-chip-idx="${scenarioPlaced[zoneId].chipIdx}"]`
      );
      if (oldChip) {
        oldChip.classList.remove('uml-chip-used');
      }
    }

    // Place value
    scenarioPlaced[zoneId] = { value, chipIdx };

    // Update zone display
    if (zoneType === 'actor') {
      const label = zone.querySelector('.uml-scenario-actor-label');
      if (label) {
        label.textContent = value;
        label.classList.remove('uml-scenario-blank');
        label.classList.add('uml-scenario-placed');
      }
      // Change actor SVG from dashed to solid
      const svg = zone.querySelector('svg');
      if (svg) {
        svg.setAttribute('stroke', 'var(--uml-actor)');
        svg.removeAttribute('stroke-dasharray');
      }
    } else {
      zone.textContent = value;
      zone.classList.remove('uml-scenario-usecase-blank');
      zone.classList.add('uml-scenario-usecase-placed');
    }

    zone.classList.add('uml-scenario-drop-filled');

    // Mark chip as used
    const chip = chipsPool.querySelector(
      `.uml-scenario-chip[data-chip-idx="${chipIdx}"]`
    );
    if (chip) chip.classList.add('uml-chip-used');
  }

  function checkScenario(contentEl, sc, parentContainer) {
    const dropZones = contentEl.querySelectorAll('.uml-scenario-drop-zone');
    let correct = 0;
    let total = 0;

    dropZones.forEach((zone) => {
      const zoneId = zone.dataset.id;
      const expected = zone.dataset.expected;
      total++;

      const placed = scenarioPlaced[zoneId];
      zone.classList.remove('uml-scenario-correct', 'uml-scenario-wrong');

      if (placed && placed.value === expected) {
        zone.classList.add('uml-scenario-correct');
        correct++;
      } else {
        zone.classList.add('uml-scenario-wrong');
      }
    });

    const allCorrect = correct === total;
    if (allCorrect) {
      markScenarioComplete(sc.id);
    }

    const feedbackEl = contentEl.querySelector('#umlScenarioFeedback');
    feedbackEl.innerHTML = `
      <div class="module-feedback ${allCorrect ? 'module-feedback-success' : 'module-feedback-error'}" style="margin-top:var(--space-3);">
        ${allCorrect
          ? `<strong>Perfekt!</strong> Alle ${total} Elemente korrekt zugeordnet.`
          : `<strong>${correct} von ${total} korrekt.</strong>`
        }
        ${allCorrect ? `<p style="margin-top:var(--space-2);">${sc.explanation}</p>` : ''}
      </div>
    `;

    // Show solution + next buttons
    if (!allCorrect) {
      const solBtn = contentEl.querySelector('#umlScenarioSolution');
      solBtn.style.display = '';
      solBtn.addEventListener('click', () => {
        showScenarioSolution(contentEl, sc);
      });
    }

    if (currentScenario < UC_SCENARIOS.length - 1) {
      const nextBtn = contentEl.querySelector('#umlScenarioNext');
      nextBtn.style.display = '';
      nextBtn.addEventListener('click', () => {
        currentScenario++;
        renderScenarios(parentContainer);
      });
    }
  }

  function showScenarioSolution(contentEl, sc) {
    const dropZones = contentEl.querySelectorAll('.uml-scenario-drop-zone');

    dropZones.forEach((zone) => {
      const expected = zone.dataset.expected;
      const zoneType = zone.dataset.type;

      zone.classList.remove('uml-scenario-wrong', 'uml-scenario-drop-filled');
      zone.classList.add('uml-scenario-correct');

      if (zoneType === 'actor') {
        const label = zone.querySelector('.uml-scenario-actor-label');
        if (label) {
          label.textContent = expected;
          label.classList.remove('uml-scenario-blank');
          label.classList.add('uml-scenario-placed');
        }
        const svg = zone.querySelector('svg');
        if (svg) {
          svg.setAttribute('stroke', 'var(--success)');
          svg.removeAttribute('stroke-dasharray');
        }
      } else {
        zone.textContent = expected;
        zone.classList.remove('uml-scenario-usecase-blank');
        zone.classList.add('uml-scenario-usecase-placed');
      }
    });

    const feedbackEl = contentEl.querySelector('#umlScenarioFeedback');
    feedbackEl.innerHTML = `
      <div class="module-feedback module-feedback-success" style="margin-top:var(--space-3);">
        <strong>Loesung:</strong>
        <p style="margin-top:var(--space-2);">${sc.explanation}</p>
      </div>
    `;

    // Hide solution button
    const solBtn = contentEl.querySelector('#umlScenarioSolution');
    if (solBtn) solBtn.style.display = 'none';
  }

  // ============================================================
  // TAB 3: UML-Trainer
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
    const idx = (trainerRound - 1) % KARD_SCENARIOS.length;
    trainerCurrent = KARD_SCENARIOS[idx];
    trainerPlaced = {};
  }

  function renderKardRound(container) {
    const scenario = trainerCurrent;

    const scenarioEl = container.querySelector('#umlKardScenario');
    if (scenarioEl) {
      scenarioEl.innerHTML = `
        <div class="uml-kard-scenario">
          <strong>Runde ${trainerRound}: ${scenario.title}</strong>
          <p>${scenario.description}</p>
        </div>
      `;
    }

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

    const chipsEl = container.querySelector('#umlKardChips');
    if (chipsEl) {
      const chipValues = [];
      KARD_CHIPS.forEach((v) => {
        chipValues.push(v);
        chipValues.push(v);
      });
      chipsEl.innerHTML = chipValues
        .map(
          (v, i) => `
        <div class="uml-chip" draggable="true" data-value="${v}" data-chip-idx="${i}">${v}</div>
      `
        )
        .join('');
    }

    const feedback = container.querySelector('#umlKardFeedback');
    if (feedback) feedback.innerHTML = '';
  }

  function setupKardEvents(container) {
    setupKardDragDrop(container);

    container.querySelector('#umlKardCheck').addEventListener('click', () => {
      checkKardTrainer(container);
    });

    container.querySelector('#umlKardNext').addEventListener('click', () => {
      nextKardRound();
      renderKardRound(container);
      setupKardDragDrop(container);
    });
  }

  function setupKardDragDrop(container) {
    const chipsPool = container.querySelector('#umlKardChips');

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
        const chip = chipsPool.querySelector(
          `.uml-chip[data-chip-idx="${chipIdx}"]:not(.uml-chip-used)`
        );
        if (chip) chip.classList.add('uml-chip-used');
      });
    });

    // Touch fallback
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
        ${allCorrect
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
    trainerPlaced = {};
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

    trainerPlaced = {};
    scenario.lanes.forEach((lane) => {
      trainerPlaced[lane] = [];
    });

    const feedback = container.querySelector('#umlSwimFeedback');
    if (feedback) feedback.innerHTML = '';
  }

  function setupSwimEvents(container) {
    bindSwimDragDrop(container);

    container.querySelector('#umlSwimCheck').addEventListener('click', () => {
      checkSwimTrainer(container);
    });

    container.querySelector('#umlSwimNext').addEventListener('click', () => {
      nextSwimRound();
      renderSwimRound(container);
      bindSwimDragDrop(container);
    });
  }

  function bindSwimDragDrop(container) {
    const chipsPool = container.querySelector('#umlSwimChips');

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
        placeSwimChip(container, text, lane, drop);
      });

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

    const chip = chipsPool.querySelector(
      `.uml-swim-action-chip[data-text="${text}"]`
    );
    if (chip) chip.remove();

    const placed = document.createElement('div');
    placed.className = 'uml-swim-action-chip';
    placed.textContent = text;
    placed.dataset.text = text;
    dropZone.appendChild(placed);

    if (!trainerPlaced[lane]) trainerPlaced[lane] = [];
    trainerPlaced[lane].push(text);
  }

  function checkSwimTrainer(container) {
    const scenario = trainerCurrent;
    let correct = 0;
    const total = scenario.actions.length;

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
        ${allCorrect
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
