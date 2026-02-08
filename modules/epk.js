// ============================================================
// epk.js — EPK-Builder (Modul 7)
// Ereignisgesteuerte Prozesskette: Interactive diagram editor
// with drag & drop, validation, exam exercises & EPK-Puzzle.
// ============================================================

const EPKView = (() => {
  let currentTab = 'explanation';
  let cleanup_fns = [];

  // ============================================================
  // CONSTANTS: Element types and their visual properties
  // ============================================================

  const ELEMENT_TYPES = {
    event: {
      label: 'Ereignis',
      shape: 'hexagon',
      color: 'var(--epk-event)',
      colorBg: 'var(--epk-event-bg)',
      description: 'Passiver Zustand (Start/Ende/Zwischenereignis)',
    },
    function: {
      label: 'Funktion',
      shape: 'roundedRect',
      color: 'var(--epk-function)',
      colorBg: 'var(--epk-function-bg)',
      description: 'Aktive Taetigkeit / Aufgabe',
    },
    connectorAnd: {
      label: 'UND',
      shape: 'circle',
      symbol: '\u2227',
      color: 'var(--epk-connector)',
      colorBg: 'var(--epk-connector-bg)',
      description: 'Alle Pfade muessen durchlaufen werden',
    },
    connectorOr: {
      label: 'ODER',
      shape: 'circle',
      symbol: '\u2228',
      color: 'var(--epk-connector)',
      colorBg: 'var(--epk-connector-bg)',
      description: 'Mindestens ein Pfad wird durchlaufen',
    },
    connectorXor: {
      label: 'XOR',
      shape: 'circle',
      symbol: '\u2295',
      color: 'var(--epk-connector)',
      colorBg: 'var(--epk-connector-bg)',
      description: 'Genau ein Pfad wird durchlaufen',
    },
    orgUnit: {
      label: 'Org.-Einheit',
      shape: 'oval',
      color: 'var(--epk-org)',
      colorBg: 'var(--epk-org-bg)',
      description: 'Organisationseinheit (wer fuehrt aus?)',
    },
    infoObject: {
      label: 'Info-Objekt',
      shape: 'rect',
      color: 'var(--epk-info)',
      colorBg: 'var(--epk-info-bg)',
      description: 'Informationsobjekt (welche Daten?)',
    },
  };

  // ============================================================
  // DATA: Exercises from typical AP1 exams
  // ============================================================

  const EXERCISES = [
    {
      id: 1,
      title: 'Wareneingang modellieren',
      difficulty: 'Leicht',
      type: 'build',
      description:
        'Modelliere den folgenden Geschaeftsprozess als EPK: Eine Warenlieferung trifft ein. Die Ware wird geprueft. Wenn die Ware in Ordnung ist, wird sie eingelagert. Wenn die Ware beschaedigt ist, wird eine Reklamation erstellt. In beiden Faellen wird der Vorgang im System dokumentiert.',
      hint: 'Beginne und ende mit einem Ereignis. Nutze einen XOR-Konnektor fuer die Entscheidung.',
      solution: [
        { id: 'e1', type: 'event', name: 'Ware eingetroffen', x: 350, y: 20 },
        { id: 'f1', type: 'function', name: 'Ware pruefen', x: 350, y: 110 },
        { id: 'e2', type: 'event', name: 'Ware geprueft', x: 350, y: 200 },
        { id: 'x1', type: 'connectorXor', name: 'XOR', x: 408, y: 290 },
        { id: 'e3', type: 'event', name: 'Ware i.O.', x: 200, y: 370 },
        { id: 'e4', type: 'event', name: 'Ware beschaedigt', x: 500, y: 370 },
        { id: 'f2', type: 'function', name: 'Ware einlagern', x: 200, y: 460 },
        {
          id: 'f3',
          type: 'function',
          name: 'Reklamation erstellen',
          x: 500,
          y: 460,
        },
        { id: 'x2', type: 'connectorXor', name: 'XOR', x: 408, y: 550 },
        {
          id: 'f4',
          type: 'function',
          name: 'Vorgang dokumentieren',
          x: 350,
          y: 630,
        },
        {
          id: 'e5',
          type: 'event',
          name: 'Vorgang abgeschlossen',
          x: 350,
          y: 720,
        },
      ],
      solutionConnections: [
        { from: 'e1', to: 'f1' },
        { from: 'f1', to: 'e2' },
        { from: 'e2', to: 'x1' },
        { from: 'x1', to: 'e3' },
        { from: 'x1', to: 'e4' },
        { from: 'e3', to: 'f2' },
        { from: 'e4', to: 'f3' },
        { from: 'f2', to: 'x2' },
        { from: 'f3', to: 'x2' },
        { from: 'x2', to: 'f4' },
        { from: 'f4', to: 'e5' },
      ],
    },
    {
      id: 2,
      title: 'Fehler in EPK finden',
      difficulty: 'Mittel',
      type: 'fix',
      description:
        'Die folgende EPK enthaelt Fehler. Finde und beschreibe alle Regelverstoesse!',
      hint: 'Pruefe: Beginnt/endet die EPK mit Ereignissen? Folgen zwei Ereignisse direkt aufeinander? Sind Konnektoren korrekt verwendet?',
      elements: [
        { id: 'f1', type: 'function', name: 'Auftrag anlegen', x: 350, y: 20 },
        { id: 'e1', type: 'event', name: 'Auftrag angelegt', x: 350, y: 110 },
        { id: 'e2', type: 'event', name: 'Kunde bekannt', x: 350, y: 200 },
        { id: 'f2', type: 'function', name: 'Auftrag pruefen', x: 350, y: 290 },
        { id: 'x1', type: 'connectorXor', name: 'XOR', x: 408, y: 380 },
        {
          id: 'f3',
          type: 'function',
          name: 'Auftrag bestaetigen',
          x: 200,
          y: 460,
        },
        {
          id: 'f4',
          type: 'function',
          name: 'Auftrag ablehnen',
          x: 500,
          y: 460,
        },
      ],
      connections: [
        { from: 'f1', to: 'e1' },
        { from: 'e1', to: 'e2' },
        { from: 'e2', to: 'f2' },
        { from: 'f2', to: 'x1' },
        { from: 'x1', to: 'f3' },
        { from: 'x1', to: 'f4' },
      ],
      errors: [
        'Die EPK beginnt mit einer Funktion statt einem Ereignis.',
        'Zwei Ereignisse folgen direkt aufeinander (Auftrag angelegt → Kunde bekannt).',
        'Die EPK endet nicht mit Ereignissen — nach den Funktionen fehlen Endereignisse.',
        'Nach dem XOR-Split fehlt ein XOR-Join zum Zusammenfuehren.',
      ],
    },
    {
      id: 3,
      title: 'Bestellung mit parallelen Aufgaben',
      difficulty: 'Mittel',
      type: 'build',
      description:
        'Modelliere: Ein Kundenauftrag geht ein. Daraufhin werden gleichzeitig die Ware kommissioniert UND die Rechnung erstellt. Sobald beides erledigt ist, wird die Ware versendet.',
      hint: 'Nutze einen UND-Konnektor fuer die Parallelisierung (Split) und einen weiteren UND-Konnektor zum Zusammenfuehren (Join).',
      solution: [
        { id: 'e1', type: 'event', name: 'Auftrag eingegangen', x: 350, y: 20 },
        {
          id: 'f1',
          type: 'function',
          name: 'Auftrag bearbeiten',
          x: 350,
          y: 110,
        },
        { id: 'e2', type: 'event', name: 'Auftrag bearbeitet', x: 350, y: 200 },
        { id: 'a1', type: 'connectorAnd', name: 'UND', x: 408, y: 290 },
        {
          id: 'f2',
          type: 'function',
          name: 'Ware kommissionieren',
          x: 200,
          y: 370,
        },
        {
          id: 'f3',
          type: 'function',
          name: 'Rechnung erstellen',
          x: 500,
          y: 370,
        },
        { id: 'e3', type: 'event', name: 'Ware bereit', x: 200, y: 460 },
        { id: 'e4', type: 'event', name: 'Rechnung erstellt', x: 500, y: 460 },
        { id: 'a2', type: 'connectorAnd', name: 'UND', x: 408, y: 550 },
        { id: 'f4', type: 'function', name: 'Ware versenden', x: 350, y: 630 },
        { id: 'e5', type: 'event', name: 'Ware versendet', x: 350, y: 720 },
      ],
      solutionConnections: [
        { from: 'e1', to: 'f1' },
        { from: 'f1', to: 'e2' },
        { from: 'e2', to: 'a1' },
        { from: 'a1', to: 'f2' },
        { from: 'a1', to: 'f3' },
        { from: 'f2', to: 'e3' },
        { from: 'f3', to: 'e4' },
        { from: 'e3', to: 'a2' },
        { from: 'e4', to: 'a2' },
        { from: 'a2', to: 'f4' },
        { from: 'f4', to: 'e5' },
      ],
    },
    {
      id: 4,
      title: 'EPK lesen und Fragen beantworten',
      difficulty: 'Leicht',
      type: 'quiz',
      description: 'Betrachte die EPK und beantworte die Fragen dazu.',
      elements: [
        {
          id: 'e1',
          type: 'event',
          name: 'Bewerbung eingegangen',
          x: 350,
          y: 20,
        },
        {
          id: 'f1',
          type: 'function',
          name: 'Bewerbung sichten',
          x: 350,
          y: 110,
        },
        {
          id: 'e2',
          type: 'event',
          name: 'Bewerbung gesichtet',
          x: 350,
          y: 200,
        },
        { id: 'x1', type: 'connectorXor', name: 'XOR', x: 408, y: 290 },
        { id: 'e3', type: 'event', name: 'Bewerber geeignet', x: 200, y: 370 },
        {
          id: 'e4',
          type: 'event',
          name: 'Bewerber ungeeignet',
          x: 500,
          y: 370,
        },
        {
          id: 'f2',
          type: 'function',
          name: 'Einladung senden',
          x: 200,
          y: 460,
        },
        { id: 'f3', type: 'function', name: 'Absage senden', x: 500, y: 460 },
        {
          id: 'e5',
          type: 'event',
          name: 'Einladung versendet',
          x: 200,
          y: 550,
        },
        { id: 'e6', type: 'event', name: 'Absage versendet', x: 500, y: 550 },
      ],
      connections: [
        { from: 'e1', to: 'f1' },
        { from: 'f1', to: 'e2' },
        { from: 'e2', to: 'x1' },
        { from: 'x1', to: 'e3' },
        { from: 'x1', to: 'e4' },
        { from: 'e3', to: 'f2' },
        { from: 'e4', to: 'f3' },
        { from: 'f2', to: 'e5' },
        { from: 'f3', to: 'e6' },
      ],
      questions: [
        {
          q: 'Welches Element startet die EPK?',
          options: [
            'Funktion "Bewerbung sichten"',
            'Ereignis "Bewerbung eingegangen"',
            'XOR-Konnektor',
            'Ereignis "Bewerber geeignet"',
          ],
          correct: 1,
        },
        {
          q: 'Welcher Konnektor-Typ wird verwendet?',
          options: ['UND', 'ODER', 'XOR (Exklusiv-Oder)', 'Kein Konnektor'],
          correct: 2,
        },
        {
          q: 'Koennen beide Pfade gleichzeitig durchlaufen werden?',
          options: [
            'Ja, beide Pfade werden immer durchlaufen',
            'Nein, es wird genau ein Pfad gewaehlt (XOR)',
            'Ja, mindestens einer wird durchlaufen',
            'Das haengt vom Konnektor ab',
          ],
          correct: 1,
        },
        {
          q: 'Wie viele Funktionen hat die EPK?',
          options: ['2', '3', '4', '5'],
          correct: 1,
        },
      ],
    },
    {
      id: 5,
      title: 'Supportanfrage (AP1-Niveau)',
      difficulty: 'Schwer',
      type: 'build',
      description:
        'Modelliere den IT-Support-Prozess: Eine Supportanfrage geht ein. Der Mitarbeiter analysiert das Problem. Wenn es ein bekanntes Problem ist, wird die Loesung aus der Wissensdatenbank angewendet. Wenn es ein neues Problem ist, wird es eskaliert. Nach der Bearbeitung wird die Loesung dokumentiert und der Kunde benachrichtigt.',
      hint: 'Nutze XOR fuer die Fallunterscheidung. Denke an das Zusammenfuehren der Pfade und die Reihenfolge Ereignis→Funktion→Ereignis.',
      solution: [
        { id: 'e1', type: 'event', name: 'Anfrage eingegangen', x: 350, y: 20 },
        {
          id: 'f1',
          type: 'function',
          name: 'Problem analysieren',
          x: 350,
          y: 110,
        },
        { id: 'e2', type: 'event', name: 'Problem analysiert', x: 350, y: 200 },
        { id: 'x1', type: 'connectorXor', name: 'XOR', x: 408, y: 290 },
        { id: 'e3', type: 'event', name: 'Bekanntes Problem', x: 200, y: 370 },
        { id: 'e4', type: 'event', name: 'Neues Problem', x: 500, y: 370 },
        {
          id: 'f2',
          type: 'function',
          name: 'Loesung anwenden',
          x: 200,
          y: 460,
        },
        {
          id: 'f3',
          type: 'function',
          name: 'Problem eskalieren',
          x: 500,
          y: 460,
        },
        { id: 'e5', type: 'event', name: 'Loesung angewendet', x: 200, y: 550 },
        { id: 'e6', type: 'event', name: 'Problem eskaliert', x: 500, y: 550 },
        { id: 'x2', type: 'connectorXor', name: 'XOR', x: 408, y: 640 },
        {
          id: 'f4',
          type: 'function',
          name: 'Loesung dokumentieren',
          x: 350,
          y: 720,
        },
        {
          id: 'e7',
          type: 'event',
          name: 'Loesung dokumentiert',
          x: 350,
          y: 810,
        },
        {
          id: 'f5',
          type: 'function',
          name: 'Kunde benachrichtigen',
          x: 350,
          y: 900,
        },
        {
          id: 'e8',
          type: 'event',
          name: 'Kunde benachrichtigt',
          x: 350,
          y: 990,
        },
      ],
      solutionConnections: [
        { from: 'e1', to: 'f1' },
        { from: 'f1', to: 'e2' },
        { from: 'e2', to: 'x1' },
        { from: 'x1', to: 'e3' },
        { from: 'x1', to: 'e4' },
        { from: 'e3', to: 'f2' },
        { from: 'e4', to: 'f3' },
        { from: 'f2', to: 'e5' },
        { from: 'f3', to: 'e6' },
        { from: 'e5', to: 'x2' },
        { from: 'e6', to: 'x2' },
        { from: 'x2', to: 'f4' },
        { from: 'f4', to: 'e7' },
        { from: 'e7', to: 'f5' },
        { from: 'f5', to: 'e8' },
      ],
    },
  ];

  // ============================================================
  // VALIDATION ENGINE
  // ============================================================

  function validateEPK(elements, connections) {
    const errors = [];
    const warnings = [];

    if (elements.length === 0) {
      return { errors: ['Die EPK enthaelt keine Elemente.'], warnings: [] };
    }

    // Build adjacency
    const inDegree = {};
    const outDegree = {};
    elements.forEach((el) => {
      inDegree[el.id] = 0;
      outDegree[el.id] = 0;
    });
    const elementMap = {};
    elements.forEach((el) => {
      elementMap[el.id] = el;
    });

    connections.forEach((c) => {
      if (elementMap[c.from]) outDegree[c.from]++;
      if (elementMap[c.to]) inDegree[c.to]++;
    });

    // Find start and end nodes
    const startNodes = elements.filter((el) => inDegree[el.id] === 0);
    const endNodes = elements.filter((el) => outDegree[el.id] === 0);

    // Rule 1: EPK must start with event
    startNodes.forEach((el) => {
      if (el.type !== 'event') {
        errors.push(
          `"${el.name}" ist ein Startelement, aber kein Ereignis. EPKs muessen mit einem Ereignis beginnen.`
        );
      }
    });

    // Rule 2: EPK must end with event
    endNodes.forEach((el) => {
      if (el.type !== 'event') {
        errors.push(
          `"${el.name}" ist ein Endelement, aber kein Ereignis. EPKs muessen mit einem Ereignis enden.`
        );
      }
    });

    // Rule 3: Two events must not follow each other directly
    connections.forEach((c) => {
      const from = elementMap[c.from];
      const to = elementMap[c.to];
      if (from && to && from.type === 'event' && to.type === 'event') {
        errors.push(
          `Zwei Ereignisse folgen direkt aufeinander: "${from.name}" → "${to.name}". Dazwischen muss eine Funktion stehen.`
        );
      }
    });

    // Rule 4: Two functions must not follow each other directly
    connections.forEach((c) => {
      const from = elementMap[c.from];
      const to = elementMap[c.to];
      if (from && to && from.type === 'function' && to.type === 'function') {
        errors.push(
          `Zwei Funktionen folgen direkt aufeinander: "${from.name}" → "${to.name}". Dazwischen muss ein Ereignis stehen.`
        );
      }
    });

    // Rule 5: Events can have max 1 incoming and 1 outgoing (no branching without connector)
    elements.forEach((el) => {
      if (el.type === 'event') {
        if (outDegree[el.id] > 1) {
          errors.push(
            `Ereignis "${el.name}" hat ${outDegree[el.id]} ausgehende Verbindungen. Verwende einen Konnektor fuer Verzweigungen.`
          );
        }
        if (inDegree[el.id] > 1) {
          errors.push(
            `Ereignis "${el.name}" hat ${inDegree[el.id]} eingehende Verbindungen. Verwende einen Konnektor zum Zusammenfuehren.`
          );
        }
      }
    });

    // Rule 6: Functions can have max 1 incoming and 1 outgoing
    elements.forEach((el) => {
      if (el.type === 'function') {
        if (outDegree[el.id] > 1) {
          errors.push(
            `Funktion "${el.name}" hat ${outDegree[el.id]} ausgehende Verbindungen. Verwende einen Konnektor fuer Verzweigungen.`
          );
        }
        if (inDegree[el.id] > 1) {
          errors.push(
            `Funktion "${el.name}" hat ${inDegree[el.id]} eingehende Verbindungen. Verwende einen Konnektor zum Zusammenfuehren.`
          );
        }
      }
    });

    // Warnings for disconnected elements
    elements.forEach((el) => {
      if (
        inDegree[el.id] === 0 &&
        outDegree[el.id] === 0 &&
        elements.length > 1
      ) {
        warnings.push(`"${el.name}" ist nicht verbunden.`);
      }
    });

    if (startNodes.length === 0 && elements.length > 0) {
      warnings.push(
        'Kein Startelement gefunden (kein Element ohne eingehende Verbindung).'
      );
    }
    if (endNodes.length === 0 && elements.length > 0) {
      warnings.push(
        'Kein Endelement gefunden (kein Element ohne ausgehende Verbindung).'
      );
    }

    return { errors, warnings };
  }

  // ============================================================
  // TAB 1: EXPLANATION
  // ============================================================

  function renderExplanation(container) {
    container.innerHTML = `
      <div class="epk-explanation">
        <div class="epk-section">
          <h3 class="epk-section-title">Was ist eine EPK?</h3>
          <p class="epk-text">
            Die <strong>Ereignisgesteuerte Prozesskette (EPK)</strong> ist eine grafische
            Modellierungssprache zur Darstellung von <strong>Geschaeftsprozessen</strong>.
            Sie wurde an der Universitaet des Saarlandes entwickelt und ist besonders im
            deutschsprachigen Raum verbreitet (SAP, IHK-Pruefungen).
          </p>
          <p class="epk-text">
            In der <strong>IHK-Abschlusspruefung Teil 1</strong> kann die Aufgabe lauten:
            "Modellieren Sie den Geschaeftsprozess als EPK" oder "Finden Sie die Fehler
            in der folgenden EPK".
          </p>
        </div>

        <div class="epk-section">
          <h3 class="epk-section-title">Die EPK-Elemente</h3>
          <div class="epk-elements-grid">
            <div class="epk-element-card">
              <div class="epk-element-shape epk-shape-hexagon">
                <span>Ereignis</span>
              </div>
              <div class="epk-element-info">
                <strong>Ereignis (Hexagon)</strong>
                <p>Beschreibt einen <em>passiven Zustand</em>. Loest eine Funktion aus
                oder ist das Ergebnis einer Funktion.</p>
                <p class="epk-element-example">Beispiel: "Bestellung eingegangen", "Ware geprueft"</p>
              </div>
            </div>

            <div class="epk-element-card">
              <div class="epk-element-shape epk-shape-rounded-rect">
                <span>Funktion</span>
              </div>
              <div class="epk-element-info">
                <strong>Funktion (abgerundetes Rechteck)</strong>
                <p>Beschreibt eine <em>aktive Taetigkeit</em>. Wird durch ein Ereignis
                ausgeloest und erzeugt ein Ereignis.</p>
                <p class="epk-element-example">Beispiel: "Bestellung pruefen", "Rechnung erstellen"</p>
              </div>
            </div>

            <div class="epk-element-card">
              <div class="epk-element-shape epk-shape-connectors">
                <div class="epk-mini-connector"><span>\u2227</span><small>UND</small></div>
                <div class="epk-mini-connector"><span>\u2228</span><small>ODER</small></div>
                <div class="epk-mini-connector"><span>\u2295</span><small>XOR</small></div>
              </div>
              <div class="epk-element-info">
                <strong>Konnektoren (Kreise)</strong>
                <p><strong>UND (\u2227):</strong> Alle Pfade werden durchlaufen (parallel).</p>
                <p><strong>ODER (\u2228):</strong> Mindestens ein Pfad wird durchlaufen.</p>
                <p><strong>XOR (\u2295):</strong> Genau ein Pfad wird durchlaufen (exklusiv).</p>
              </div>
            </div>

            <div class="epk-element-card">
              <div class="epk-element-shape epk-shape-extras">
                <div class="epk-mini-oval"><span>Abteilung</span></div>
                <div class="epk-mini-rect"><span>Daten</span></div>
              </div>
              <div class="epk-element-info">
                <strong>Erweiterte Elemente</strong>
                <p><strong>Organisationseinheit (Oval):</strong> Wer fuehrt die Funktion aus?</p>
                <p><strong>Informationsobjekt (Rechteck):</strong> Welche Daten werden benoetigt/erzeugt?</p>
              </div>
            </div>
          </div>
        </div>

        <div class="epk-section epk-rules-box">
          <h3 class="epk-section-title">Die goldenen Regeln der EPK</h3>
          <div class="epk-rules-grid">
            <div class="epk-rule">
              <span class="epk-rule-num">1</span>
              <div>
                <strong>Start und Ende mit Ereignis</strong>
                <p>Jede EPK beginnt und endet mit mindestens einem Ereignis.</p>
              </div>
            </div>
            <div class="epk-rule">
              <span class="epk-rule-num">2</span>
              <div>
                <strong>Abwechslung Ereignis \u2194 Funktion</strong>
                <p>Auf ein Ereignis folgt immer eine Funktion und umgekehrt.
                Zwei Ereignisse oder zwei Funktionen duerfen nicht direkt aufeinander folgen.</p>
              </div>
            </div>
            <div class="epk-rule">
              <span class="epk-rule-num">3</span>
              <div>
                <strong>Verzweigung nur ueber Konnektoren</strong>
                <p>Ereignisse und Funktionen haben maximal einen Ein- und einen Ausgang.
                Fuer Verzweigungen und Zusammenfuehrungen werden Konnektoren benoetigt.</p>
              </div>
            </div>
            <div class="epk-rule">
              <span class="epk-rule-num">4</span>
              <div>
                <strong>Konnektoren paarweise</strong>
                <p>Jeder Split-Konnektor braucht einen passenden Join-Konnektor
                (gleicher Typ: UND-Split \u2192 UND-Join).</p>
              </div>
            </div>
            <div class="epk-rule">
              <span class="epk-rule-num">5</span>
              <div>
                <strong>Kein Entscheidungs-Ereignis</strong>
                <p>Ein Ereignis darf nicht direkt in einen Konnektor-Split muenden.
                Entscheidungen werden immer von Funktionen getroffen.</p>
              </div>
            </div>
            <div class="epk-rule">
              <span class="epk-rule-num">6</span>
              <div>
                <strong>Kontrollfluss von oben nach unten</strong>
                <p>Der Prozess laeuft in der Regel von oben nach unten. Pfeile zeigen die Richtung.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="epk-section">
          <h3 class="epk-section-title">EPK vs. BPMN</h3>
          <div class="epk-comparison">
            <div class="epk-comp-col">
              <h4>EPK</h4>
              <ul>
                <li>Deutsch/europaeisch</li>
                <li>Starke IHK-Pruefungsrelevanz</li>
                <li>Hexagon-Ereignisse</li>
                <li>Konnektoren: UND, ODER, XOR</li>
                <li>Einfacher Grundaufbau</li>
              </ul>
            </div>
            <div class="epk-comp-col">
              <h4>BPMN</h4>
              <ul>
                <li>International/Standard</li>
                <li>Neu im Pruefungskatalog 2025</li>
                <li>Kreis-Events (Start, Ende)</li>
                <li>Gateways: XOR, AND, OR</li>
                <li>Umfangreicher (Pools, Lanes)</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="epk-section">
          <h3 class="epk-section-title">Haeufige Pruefungsfallen</h3>
          <div class="epk-trap-list">
            <div class="epk-trap">
              <span class="epk-trap-icon">!</span>
              <div>
                <strong>Zwei Ereignisse hintereinander</strong>
                Zwischen zwei Ereignissen muss immer eine Funktion stehen!
              </div>
            </div>
            <div class="epk-trap">
              <span class="epk-trap-icon">!</span>
              <div>
                <strong>Fehlender Konnektor-Join</strong>
                Jeder Split braucht einen passenden Join. Vergiss nicht, die Pfade wieder zusammenzufuehren!
              </div>
            </div>
            <div class="epk-trap">
              <span class="epk-trap-icon">!</span>
              <div>
                <strong>Start/Ende vergessen</strong>
                Die EPK MUSS mit einem Ereignis starten und enden. Das wird gerne vergessen!
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // TAB 2: FREE MODE (Interactive Canvas Editor)
  // ============================================================

  let freeElements = [];
  let freeConnections = [];
  let freeNextId = 1;
  let freeSelectedElement = null;
  let freeConnectMode = false;
  let freeConnectSource = null;
  let freeDragState = null;

  function renderFreeMode(container) {
    freeElements = [];
    freeConnections = [];
    freeNextId = 1;
    freeSelectedElement = null;
    freeConnectMode = false;
    freeConnectSource = null;
    freeDragState = null;

    container.innerHTML = `
      <div class="epk-free-mode">
        <div class="epk-toolbar">
          <div class="epk-toolbar-group">
            <span class="epk-toolbar-label">Elemente:</span>
            <button class="btn btn-primary epk-tool-btn" data-add="event">
              <span class="epk-tool-icon epk-ti-hex"></span>
              Ereignis
            </button>
            <button class="btn epk-tool-btn epk-tool-fn" data-add="function">
              <span class="epk-tool-icon epk-ti-rrect"></span>
              Funktion
            </button>
          </div>
          <div class="epk-toolbar-group">
            <span class="epk-toolbar-label">Konnektoren:</span>
            <button class="btn epk-tool-btn" data-add="connectorXor">XOR</button>
            <button class="btn epk-tool-btn" data-add="connectorAnd">UND</button>
            <button class="btn epk-tool-btn" data-add="connectorOr">ODER</button>
          </div>
          <div class="epk-toolbar-sep"></div>
          <button class="btn epk-tool-btn" id="epkConnectBtn">
            <svg viewBox="0 0 24 24" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="14 7 19 12 14 17"/></svg>
            Verbinden
          </button>
          <button class="btn epk-tool-btn" id="epkDeleteBtn">
            <svg viewBox="0 0 24 24" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Loeschen
          </button>
          <div class="epk-toolbar-sep"></div>
          <button class="btn epk-tool-btn" id="epkValidateBtn">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Validieren
          </button>
          <button class="btn epk-tool-btn epk-tool-danger" id="epkClearBtn">Zuruecksetzen</button>
        </div>

        <div class="epk-status-bar" id="epkStatusBar">
          Klicke auf ein Element in der Toolbar, um es zum Canvas hinzuzufuegen.
        </div>

        <div class="epk-canvas-wrapper">
          <div class="epk-canvas" id="epkCanvas">
            <svg class="epk-svg" id="epkSvg">
              <defs>
                <marker id="epkArrow" markerWidth="10" markerHeight="7"
                  refX="10" refY="3.5" orient="auto" fill="var(--text-secondary)">
                  <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>

        <div id="epkValidationResult"></div>
      </div>
    `;

    setupFreeModeEvents(container);
  }

  function setupFreeModeEvents(container) {
    const canvas = container.querySelector('#epkCanvas');
    const svg = container.querySelector('#epkSvg');
    const statusBar = container.querySelector('#epkStatusBar');

    // Add element buttons
    container.querySelectorAll('[data-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.add;
        const id = `el_${freeNextId++}`;
        const typeInfo = ELEMENT_TYPES[type];
        const offsetX = 300 + ((freeNextId - 2) % 3) * 200;
        const offsetY = 40 + Math.floor((freeNextId - 2) / 3) * 120;
        freeElements.push({
          id,
          type,
          name: typeInfo.label,
          x: offsetX,
          y: offsetY,
        });
        redrawFreeCanvas(container);
        setStatus(
          statusBar,
          `${typeInfo.label} hinzugefuegt. Doppelklick zum Umbenennen.`
        );
      });
    });

    // Connect mode
    container.querySelector('#epkConnectBtn').addEventListener('click', () => {
      freeConnectMode = !freeConnectMode;
      freeConnectSource = null;
      container
        .querySelector('#epkConnectBtn')
        .classList.toggle('active', freeConnectMode);
      if (freeConnectMode) {
        setStatus(
          statusBar,
          'Verbindungsmodus: Klicke Quell-Element, dann Ziel-Element.'
        );
      } else {
        setStatus(statusBar, 'Verbindungsmodus beendet.');
      }
    });

    // Delete selected
    container.querySelector('#epkDeleteBtn').addEventListener('click', () => {
      if (freeSelectedElement) {
        freeConnections = freeConnections.filter(
          (c) => c.from !== freeSelectedElement && c.to !== freeSelectedElement
        );
        freeElements = freeElements.filter(
          (el) => el.id !== freeSelectedElement
        );
        setStatus(statusBar, 'Element geloescht.');
        freeSelectedElement = null;
        redrawFreeCanvas(container);
      } else {
        setStatus(statusBar, 'Waehle zuerst ein Element aus (Klick).');
      }
    });

    // Validate
    container.querySelector('#epkValidateBtn').addEventListener('click', () => {
      const result = validateEPK(freeElements, freeConnections);
      const resultDiv = container.querySelector('#epkValidationResult');

      if (result.errors.length === 0 && result.warnings.length === 0) {
        resultDiv.innerHTML = `
          <div class="module-feedback module-feedback-success">
            <strong>EPK ist korrekt!</strong> Keine Regelverstoesse gefunden.
          </div>
        `;
        setStatus(statusBar, 'Validierung erfolgreich!');
      } else {
        resultDiv.innerHTML = `
          ${
            result.errors.length > 0
              ? `
            <div class="module-feedback module-feedback-error">
              <strong>Fehler gefunden (${result.errors.length}):</strong><br>
              ${result.errors.map((e) => `\u2022 ${e}`).join('<br>')}
            </div>
          `
              : ''
          }
          ${
            result.warnings.length > 0
              ? `
            <div class="module-feedback" style="background:var(--warning-bg);color:var(--warning);border:1px solid var(--warning);">
              <strong>Hinweise (${result.warnings.length}):</strong><br>
              ${result.warnings.map((w) => `\u2022 ${w}`).join('<br>')}
            </div>
          `
              : ''
          }
        `;
        setStatus(
          statusBar,
          `Validierung: ${result.errors.length} Fehler, ${result.warnings.length} Hinweise.`
        );
      }
    });

    // Clear
    container.querySelector('#epkClearBtn').addEventListener('click', () => {
      freeElements = [];
      freeConnections = [];
      freeNextId = 1;
      freeSelectedElement = null;
      freeConnectMode = false;
      freeConnectSource = null;
      container.querySelector('#epkConnectBtn').classList.remove('active');
      container.querySelector('#epkValidationResult').innerHTML = '';
      redrawFreeCanvas(container);
      setStatus(statusBar, 'Canvas zurueckgesetzt.');
    });

    // Canvas click (deselect)
    canvas.addEventListener('mousedown', (e) => {
      if (
        e.target === canvas ||
        e.target === svg ||
        e.target.tagName === 'svg'
      ) {
        freeSelectedElement = null;
        if (!freeConnectMode) {
          redrawFreeCanvas(container);
        }
      }
    });
  }

  function redrawFreeCanvas(container) {
    const canvas = container.querySelector('#epkCanvas');
    const svg = container.querySelector('#epkSvg');
    if (!canvas || !svg) return;

    // Remove old elements
    canvas.querySelectorAll('.epk-el').forEach((el) => {
      el.remove();
    });

    // Draw elements
    freeElements.forEach((element) => {
      const el = createElementNode(element, {
        editable: true,
        selected: element.id === freeSelectedElement,
      });
      canvas.appendChild(el);

      setupElementDrag(el, element, container);
      setupElementClick(el, element, container);
    });

    // Draw connections
    drawSVGConnections(svg, freeElements, freeConnections);
  }

  function getElementDimensions(type) {
    if (type === 'event') return { w: 160, h: 64 };
    if (type === 'function') return { w: 160, h: 56 };
    if (type.startsWith('connector')) return { w: 44, h: 44 };
    if (type === 'orgUnit') return { w: 140, h: 44 };
    if (type === 'infoObject') return { w: 140, h: 44 };
    return { w: 150, h: 50 };
  }

  function createElementNode(element, opts = {}) {
    const div = document.createElement('div');
    const typeInfo = ELEMENT_TYPES[element.type];
    const isConnector = element.type.startsWith('connector');
    const dims = getElementDimensions(element.type);

    div.className = `epk-el epk-el-${element.type}${opts.selected ? ' epk-el-selected' : ''}`;
    div.dataset.id = element.id;
    div.style.left = `${element.x}px`;
    div.style.top = `${element.y}px`;
    div.style.width = `${dims.w}px`;
    div.style.height = `${dims.h}px`;

    if (isConnector) {
      div.innerHTML = `<span class="epk-connector-symbol">${typeInfo.symbol}</span>`;
    } else {
      div.innerHTML = `<span class="epk-el-label">${element.name}</span>`;
    }

    return div;
  }

  function setupElementDrag(el, element, container) {
    let startX, startY, elStartX, elStartY;

    function onPointerDown(e) {
      if (freeConnectMode) return;
      if (e.target.tagName === 'INPUT') return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      startX = clientX;
      startY = clientY;
      elStartX = element.x;
      elStartY = element.y;
      freeDragState = { elId: element.id };
      el.classList.add('epk-el-dragging');

      document.addEventListener('mousemove', onPointerMove);
      document.addEventListener('mouseup', onPointerUp);
      document.addEventListener('touchmove', onPointerMove, { passive: false });
      document.addEventListener('touchend', onPointerUp);
    }

    function onPointerMove(e) {
      if (!freeDragState || freeDragState.elId !== element.id) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      element.x = Math.max(0, elStartX + (clientX - startX));
      element.y = Math.max(0, elStartY + (clientY - startY));
      el.style.left = `${element.x}px`;
      el.style.top = `${element.y}px`;
      const svg = container.querySelector('#epkSvg');
      drawSVGConnections(svg, freeElements, freeConnections);
    }

    function onPointerUp() {
      freeDragState = null;
      el.classList.remove('epk-el-dragging');
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('touchend', onPointerUp);
    }

    el.addEventListener('mousedown', onPointerDown);
    el.addEventListener('touchstart', onPointerDown, { passive: false });
  }

  function setupElementClick(el, element, container) {
    const statusBar = container.querySelector('#epkStatusBar');

    el.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return;

      if (freeConnectMode) {
        if (!freeConnectSource) {
          freeConnectSource = element.id;
          el.classList.add('epk-el-connect-source');
          setStatus(
            statusBar,
            `Quelle: "${element.name}". Klicke jetzt das Ziel-Element.`
          );
        } else if (freeConnectSource !== element.id) {
          const exists = freeConnections.some(
            (c) => c.from === freeConnectSource && c.to === element.id
          );
          if (!exists) {
            freeConnections.push({ from: freeConnectSource, to: element.id });
            setStatus(statusBar, `Verbindung erstellt.`);
          } else {
            setStatus(statusBar, 'Diese Verbindung existiert bereits.');
          }
          freeConnectSource = null;
          redrawFreeCanvas(container);
        }
      } else {
        freeSelectedElement = element.id;
        redrawFreeCanvas(container);
      }
    });

    // Double-click to edit name
    el.addEventListener('dblclick', (e) => {
      if (freeConnectMode) return;
      if (element.type.startsWith('connector')) return;
      e.preventDefault();
      showElementEditDialog(element, container);
    });
  }

  function showElementEditDialog(element, container) {
    const statusBar = container.querySelector('#epkStatusBar');
    const overlay = document.createElement('div');
    overlay.className = 'epk-edit-overlay';
    overlay.innerHTML = `
      <div class="epk-edit-dialog">
        <h4>Element bearbeiten</h4>
        <div class="epk-edit-fields">
          <label>Name:
            <input type="text" id="epkEditName" value="${element.name}" maxlength="30" class="module-input" />
          </label>
        </div>
        <div class="epk-edit-actions">
          <button class="btn btn-primary" id="epkEditSave">Speichern</button>
          <button class="btn" id="epkEditCancel">Abbrechen</button>
          <button class="btn epk-tool-danger" id="epkEditDelete">Loeschen</button>
        </div>
      </div>
    `;
    container.querySelector('.epk-free-mode').appendChild(overlay);

    overlay.querySelector('#epkEditSave').addEventListener('click', () => {
      element.name =
        overlay.querySelector('#epkEditName').value || element.name;
      overlay.remove();
      redrawFreeCanvas(container);
      setStatus(statusBar, `"${element.name}" aktualisiert.`);
    });

    overlay.querySelector('#epkEditCancel').addEventListener('click', () => {
      overlay.remove();
    });

    overlay.querySelector('#epkEditDelete').addEventListener('click', () => {
      freeConnections = freeConnections.filter(
        (c) => c.from !== element.id && c.to !== element.id
      );
      freeElements = freeElements.filter((el) => el.id !== element.id);
      freeSelectedElement = null;
      overlay.remove();
      redrawFreeCanvas(container);
      setStatus(statusBar, 'Element geloescht.');
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    setTimeout(() => overlay.querySelector('#epkEditName').focus(), 50);
  }

  // ============================================================
  // SVG ARROW DRAWING (shared)
  // ============================================================

  // Get the anchor point on the element border for a given direction angle
  function getAnchorPoint(el, dims, angle) {
    const cx = el.x + dims.w / 2;
    const cy = el.y + dims.h / 2;
    const isConnector = (el.type || '').startsWith('connector');
    const isEvent = (el.type || '') === 'event';

    // Connectors are circles — use radius
    if (isConnector) {
      const r = dims.w / 2 + 2;
      return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    }

    // Events are hexagons — use hexagonal boundary
    if (isEvent) {
      const hw = dims.w / 2;
      const hh = dims.h / 2;
      // Hexagon: flat sides on top/bottom, pointy sides left/right
      // Points: left(0,cy), top-left(15%,top), top-right(85%,top),
      //         right(100%,cy), bottom-right(85%,bottom), bottom-left(15%,bottom)
      const _a = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      // Simplified: use ellipse approximation for hex
      const rx = hw * 0.92;
      const ry = hh + 2;
      return { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry };
    }

    // Functions (rounded rect) and others — use rectangle boundary
    const hw = dims.w / 2 + 3;
    const hh = dims.h / 2 + 3;
    const absCos = Math.abs(Math.cos(angle));
    const absSin = Math.abs(Math.sin(angle));

    let bx, by;
    if (absCos * hh > absSin * hw) {
      // Hits left or right side
      const sign = Math.cos(angle) > 0 ? 1 : -1;
      bx = cx + sign * hw;
      by = cy + Math.tan(angle) * sign * hw;
    } else {
      // Hits top or bottom side
      const sign = Math.sin(angle) > 0 ? 1 : -1;
      bx = cx + (Math.cos(angle) / Math.sin(angle)) * sign * hh;
      by = cy + sign * hh;
    }
    return { x: bx, y: by };
  }

  function computeArrowPath(from, to, fromDims, toDims) {
    const fcx = from.x + fromDims.w / 2;
    const fcy = from.y + fromDims.h / 2;
    const tcx = to.x + toDims.w / 2;
    const tcy = to.y + toDims.h / 2;

    const dx = tcx - fcx;
    const dy = tcy - fcy;

    // Angle from source center to target center
    const angleOut = Math.atan2(dy, dx);
    const angleIn = Math.atan2(-dy, -dx);

    const p1 = getAnchorPoint(from, fromDims, angleOut);
    const p2 = getAnchorPoint(to, toDims, angleIn);

    const dist = Math.sqrt(dx * dx + dy * dy);
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Mostly vertical (typical EPK flow): use straight line or gentle S-curve
    if (absDy > absDx * 1.2) {
      if (absDx < 15) {
        // Nearly straight vertical — use straight line
        return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
      }
      // Vertical with horizontal offset — use smooth S-curve
      const midY = (p1.y + p2.y) / 2;
      return `M ${p1.x} ${p1.y} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;
    }

    // Mostly horizontal
    if (absDx > absDy * 1.2) {
      const midX = (p1.x + p2.x) / 2;
      return `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
    }

    // Diagonal — gentle bezier
    const tension = Math.min(dist * 0.3, 80);
    const cx1 = p1.x + Math.cos(angleOut) * tension;
    const cy1 = p1.y + Math.sin(angleOut) * tension;
    const cx2 = p2.x + Math.cos(angleIn) * tension;
    const cy2 = p2.y + Math.sin(angleIn) * tension;

    return `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;
  }

  function drawSVGConnections(svg, elements, connections) {
    svg.querySelectorAll('.epk-arrow, .epk-arrow-hit').forEach((el) => {
      el.remove();
    });

    const elMap = {};
    elements.forEach((el) => {
      elMap[el.id] = el;
    });

    connections.forEach((conn) => {
      const from = elMap[conn.from];
      const to = elMap[conn.to];
      if (!from || !to) return;

      const fromDims = getElementDimensions(from.type);
      const toDims = getElementDimensions(to.type);
      const d = computeArrowPath(from, to, fromDims, toDims);

      // Hit area
      const hitPath = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );
      hitPath.setAttribute('d', d);
      hitPath.setAttribute('class', 'epk-arrow-hit');
      svg.appendChild(hitPath);

      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );
      path.setAttribute('d', d);
      path.setAttribute('class', 'epk-arrow');
      path.setAttribute('marker-end', 'url(#epkArrow)');

      function onArrowClick(e) {
        e.stopPropagation();
        freeConnections = freeConnections.filter(
          (c) => !(c.from === conn.from && c.to === conn.to)
        );
        const parentContainer =
          svg.closest('.epk-free-mode')?.parentElement ||
          svg.closest('#pageContent');
        if (parentContainer) redrawFreeCanvas(parentContainer);
      }
      hitPath.addEventListener('click', onArrowClick);
      path.addEventListener('click', onArrowClick);

      svg.appendChild(path);
    });
  }

  function sizeReadOnlyCanvas(canvas, elements) {
    let maxX = 0;
    let maxY = 0;
    elements.forEach((el) => {
      const dims = getElementDimensions(el.type);
      maxX = Math.max(maxX, el.x + dims.w);
      maxY = Math.max(maxY, el.y + dims.h);
    });
    canvas.style.minHeight = `${maxY + 40}px`;
    canvas.style.minWidth = `${maxX + 40}px`;
  }

  function drawReadOnlySVGConnections(
    svg,
    elements,
    connections,
    markerIdBase
  ) {
    svg.querySelectorAll('.epk-arrow').forEach((el) => {
      el.remove();
    });

    const elMap = {};
    elements.forEach((el) => {
      elMap[el.id] = el;
    });

    connections.forEach((conn) => {
      const from = elMap[conn.from];
      const to = elMap[conn.to];
      if (!from || !to) return;

      const fromDims = getElementDimensions(from.type);
      const toDims = getElementDimensions(to.type);
      const d = computeArrowPath(from, to, fromDims, toDims);

      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );
      path.setAttribute('d', d);
      path.setAttribute('class', 'epk-arrow');
      path.setAttribute('marker-end', `url(#${markerIdBase})`);
      svg.appendChild(path);
    });
  }

  function setStatus(bar, msg) {
    if (bar) bar.textContent = msg;
  }

  // ============================================================
  // TAB 3: EXERCISES (Pruefungsaufgaben)
  // ============================================================

  let currentExerciseIdx = 0;
  let _exerciseQuizAnswers = {};

  function renderExercises(container) {
    currentExerciseIdx = 0;
    renderExercise(container);
  }

  function renderExercise(container) {
    const ex = EXERCISES[currentExerciseIdx];
    _exerciseQuizAnswers = {};

    container.innerHTML = `
      <div class="epk-exercises">
        <div class="epk-exercise-nav">
          ${EXERCISES.map(
            (e, i) => `
            <button class="epk-exercise-nav-btn ${i === currentExerciseIdx ? 'active' : ''}"
              data-idx="${i}">
              ${e.title}
              <span class="epk-diff-badge epk-diff-${e.difficulty.toLowerCase()}">${e.difficulty}</span>
            </button>
          `
          ).join('')}
        </div>

        <div class="epk-exercise-card">
          <div class="epk-exercise-header">
            <h3>${ex.title}</h3>
            <span class="epk-diff-badge epk-diff-${ex.difficulty.toLowerCase()}">${ex.difficulty}</span>
            <span class="epk-type-badge">${ex.type === 'build' ? 'Modellieren' : ex.type === 'fix' ? 'Fehler finden' : 'Quiz'}</span>
          </div>
          <p class="epk-text">${ex.description}</p>
          ${ex.hint ? `<div class="epk-exam-tip">${ex.hint}</div>` : ''}

          <div id="epkExContent"></div>
          <div id="epkExFeedback"></div>
        </div>
      </div>
    `;

    // Exercise nav
    container.querySelectorAll('.epk-exercise-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentExerciseIdx = parseInt(btn.dataset.idx, 10);
        renderExercise(container);
      });
    });

    // Render exercise content based on type
    const contentDiv = container.querySelector('#epkExContent');

    if (ex.type === 'build') {
      renderBuildExercise(contentDiv, container, ex);
    } else if (ex.type === 'fix') {
      renderFixExercise(contentDiv, container, ex);
    } else if (ex.type === 'quiz') {
      renderQuizExercise(contentDiv, container, ex);
    }
  }

  function renderBuildExercise(contentDiv, container, ex) {
    contentDiv.innerHTML = `
      <div class="epk-exercise-actions">
        <button class="btn btn-primary" id="epkShowBuildSolution">Musterloesung anzeigen</button>
      </div>
      <div id="epkBuildSolution"></div>
    `;

    container
      .querySelector('#epkShowBuildSolution')
      .addEventListener('click', () => {
        const solDiv = container.querySelector('#epkBuildSolution');
        solDiv.innerHTML = `
        <div class="epk-solution-diagram">
          <h4 class="epk-solution-title">Musterloesung</h4>
          <div class="epk-readonly-canvas-wrapper">
            <div class="epk-readonly-canvas" id="epkSolCanvas">
              <svg class="epk-svg" id="epkSolSvg">
                <defs>
                  <marker id="epkSolArrow" markerWidth="10" markerHeight="7"
                    refX="10" refY="3.5" orient="auto" fill="var(--text-secondary)">
                    <polygon points="0 0, 10 3.5, 0 7" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      `;

        const solCanvas = container.querySelector('#epkSolCanvas');
        const solSvg = container.querySelector('#epkSolSvg');

        // Render solution elements
        ex.solution.forEach((element) => {
          const el = createElementNode(element, { editable: false });
          el.classList.add('epk-el-readonly');
          solCanvas.appendChild(el);
        });

        // Size canvas to fit all elements
        sizeReadOnlyCanvas(solCanvas, ex.solution);

        // Draw connections
        drawReadOnlySVGConnections(
          solSvg,
          ex.solution,
          ex.solutionConnections,
          'epkSolArrow'
        );

        const feedback = container.querySelector('#epkExFeedback');
        feedback.innerHTML = `
        <div class="module-feedback module-feedback-success">
          <strong>Tipp:</strong> Versuche zuerst, die EPK im "Freier Modus"-Tab selbst zu bauen, bevor du die Musterloesung anschaust!
        </div>
      `;
      });
  }

  function renderFixExercise(contentDiv, container, ex) {
    // Generate wrong options (distractors) that are NOT real errors
    const distractors = [
      'Die EPK enthaelt zu viele Konnektoren',
      'Die Funktionen sind falsch benannt',
      'Es fehlt eine Organisationseinheit',
      'Die Pfeile zeigen in die falsche Richtung',
      'Es gibt zu viele Ereignisse',
      'Die Konnektoren haben die falschen Symbole',
    ];

    // Combine real errors with distractors and shuffle
    const allOptions = [
      ...ex.errors.map((err, i) => ({
        text: err,
        isError: true,
        id: `err_${i}`,
      })),
      ...distractors
        .slice(0, Math.min(3, distractors.length))
        .map((d, i) => ({ text: d, isError: false, id: `dist_${i}` })),
    ].sort(() => Math.random() - 0.5);

    contentDiv.innerHTML = `
      <div class="epk-readonly-canvas-wrapper">
        <div class="epk-readonly-canvas" id="epkFixCanvas">
          <svg class="epk-svg" id="epkFixSvg">
            <defs>
              <marker id="epkFixArrow" markerWidth="10" markerHeight="7"
                refX="10" refY="3.5" orient="auto" fill="var(--text-secondary)">
                <polygon points="0 0, 10 3.5, 0 7" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>
      <div class="epk-fix-input">
        <label class="epk-fix-label">Welche Fehler sind in dieser EPK enthalten? (Mehrfachauswahl)</label>
        <div class="epk-fix-options" id="epkFixOptions">
          ${allOptions
            .map(
              (opt) => `
            <label class="epk-fix-option">
              <input type="checkbox" name="epkFixError" value="${opt.id}" data-is-error="${opt.isError}">
              <span class="epk-fix-option-text">${opt.text}</span>
            </label>
          `
            )
            .join('')}
        </div>
      </div>
      <div class="epk-exercise-actions">
        <button class="btn btn-primary" id="epkCheckFix">Pruefen</button>
        <button class="btn" id="epkShowFixSolution">Loesung anzeigen</button>
      </div>
    `;

    // Render the erroneous EPK
    const fixCanvas = container.querySelector('#epkFixCanvas');
    const fixSvg = container.querySelector('#epkFixSvg');

    ex.elements.forEach((element) => {
      const el = createElementNode(element, { editable: false });
      el.classList.add('epk-el-readonly');
      fixCanvas.appendChild(el);
    });

    sizeReadOnlyCanvas(fixCanvas, ex.elements);

    drawReadOnlySVGConnections(
      fixSvg,
      ex.elements,
      ex.connections,
      'epkFixArrow'
    );

    // Check button
    container.querySelector('#epkCheckFix').addEventListener('click', () => {
      const checkboxes = container.querySelectorAll(
        'input[name="epkFixError"]'
      );
      const feedback = container.querySelector('#epkExFeedback');

      let correctCount = 0;
      let wrongCount = 0;
      const totalErrors = ex.errors.length;

      checkboxes.forEach((cb) => {
        const isError = cb.dataset.isError === 'true';
        const isChecked = cb.checked;
        const label = cb.closest('.epk-fix-option');

        // Reset styling
        label.classList.remove(
          'epk-fix-option-correct',
          'epk-fix-option-wrong'
        );

        if (isChecked && isError) {
          correctCount++;
          label.classList.add('epk-fix-option-correct');
        } else if (isChecked && !isError) {
          wrongCount++;
          label.classList.add('epk-fix-option-wrong');
        } else if (!isChecked && isError) {
          // Missed error - show as wrong
          label.classList.add('epk-fix-option-wrong');
        }
      });

      const _score = Math.max(0, correctCount - wrongCount);
      const isSuccess = correctCount === totalErrors && wrongCount === 0;

      feedback.innerHTML = `
        <div class="module-feedback ${isSuccess ? 'module-feedback-success' : 'module-feedback-error'}">
          <strong>${isSuccess ? 'Perfekt!' : correctCount >= totalErrors - 1 && wrongCount === 0 ? 'Fast!' : 'Nicht ganz richtig.'}</strong>
          Du hast ${correctCount} von ${totalErrors} Fehlern erkannt${wrongCount > 0 ? ` (${wrongCount} falsche Auswahl)` : ''}.
          ${!isSuccess ? 'Die richtigen Antworten sind jetzt markiert.' : ''}
        </div>
      `;
    });

    // Show solution
    container
      .querySelector('#epkShowFixSolution')
      .addEventListener('click', () => {
        const checkboxes = container.querySelectorAll(
          'input[name="epkFixError"]'
        );

        checkboxes.forEach((cb) => {
          const isError = cb.dataset.isError === 'true';
          const label = cb.closest('.epk-fix-option');

          label.classList.remove(
            'epk-fix-option-correct',
            'epk-fix-option-wrong'
          );

          if (isError) {
            cb.checked = true;
            label.classList.add('epk-fix-option-correct');
          } else {
            cb.checked = false;
          }
        });

        const feedback = container.querySelector('#epkExFeedback');
        feedback.innerHTML = `
        <div class="module-steps">
          <div class="module-steps-title">Alle Fehler in dieser EPK</div>
          ${ex.errors
            .map(
              (err, i) => `
            <div class="module-step">
              <div class="module-step-title">Fehler ${i + 1}</div>
              <div class="module-step-text">${err}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
      });
  }

  function renderQuizExercise(contentDiv, container, ex) {
    // Render the EPK diagram
    contentDiv.innerHTML = `
      <div class="epk-readonly-canvas-wrapper">
        <div class="epk-readonly-canvas" id="epkQuizCanvas">
          <svg class="epk-svg" id="epkQuizSvg">
            <defs>
              <marker id="epkQuizArrow" markerWidth="10" markerHeight="7"
                refX="10" refY="3.5" orient="auto" fill="var(--text-secondary)">
                <polygon points="0 0, 10 3.5, 0 7" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>
      <div class="epk-quiz-questions" id="epkQuizQuestions">
        ${ex.questions
          .map(
            (q, qi) => `
          <div class="epk-quiz-question">
            <div class="epk-quiz-q"><strong>Frage ${qi + 1}:</strong> ${q.q}</div>
            <div class="epk-quiz-options">
              ${q.options
                .map(
                  (opt, oi) => `
                <label class="epk-quiz-option">
                  <input type="radio" name="epkQ${qi}" value="${oi}" />
                  <span>${opt}</span>
                </label>
              `
                )
                .join('')}
            </div>
            <div class="epk-quiz-result" id="epkQResult${qi}"></div>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="epk-exercise-actions">
        <button class="btn btn-primary" id="epkCheckQuiz">Antworten pruefen</button>
      </div>
    `;

    // Render diagram
    const quizCanvas = container.querySelector('#epkQuizCanvas');
    const quizSvg = container.querySelector('#epkQuizSvg');

    ex.elements.forEach((element) => {
      const el = createElementNode(element, { editable: false });
      el.classList.add('epk-el-readonly');
      quizCanvas.appendChild(el);
    });

    sizeReadOnlyCanvas(quizCanvas, ex.elements);

    drawReadOnlySVGConnections(
      quizSvg,
      ex.elements,
      ex.connections,
      'epkQuizArrow'
    );

    // Check quiz
    container.querySelector('#epkCheckQuiz').addEventListener('click', () => {
      let correct = 0;
      const total = ex.questions.length;

      ex.questions.forEach((q, qi) => {
        const selected = container.querySelector(
          `input[name="epkQ${qi}"]:checked`
        );
        const resultDiv = container.querySelector(`#epkQResult${qi}`);
        const options = container.querySelectorAll(`input[name="epkQ${qi}"]`);

        // Reset styling
        options.forEach((opt) => {
          opt
            .closest('.epk-quiz-option')
            .classList.remove('epk-quiz-correct', 'epk-quiz-wrong');
        });

        if (selected) {
          const selectedIdx = parseInt(selected.value, 10);
          if (selectedIdx === q.correct) {
            correct++;
            selected
              .closest('.epk-quiz-option')
              .classList.add('epk-quiz-correct');
            resultDiv.innerHTML =
              '<span class="epk-quiz-right">Richtig!</span>';
          } else {
            selected
              .closest('.epk-quiz-option')
              .classList.add('epk-quiz-wrong');
            // Highlight correct
            options[q.correct]
              .closest('.epk-quiz-option')
              .classList.add('epk-quiz-correct');
            resultDiv.innerHTML = `<span class="epk-quiz-false">Falsch. Richtig: ${q.options[q.correct]}</span>`;
          }
        } else {
          resultDiv.innerHTML =
            '<span class="epk-quiz-false">Nicht beantwortet.</span>';
          options[q.correct]
            .closest('.epk-quiz-option')
            .classList.add('epk-quiz-correct');
        }
      });

      const feedback = container.querySelector('#epkExFeedback');
      const pct = Math.round((correct / total) * 100);
      feedback.innerHTML = `
        <div class="module-feedback ${correct === total ? 'module-feedback-success' : 'module-feedback-error'}">
          <strong>${correct === total ? 'Perfekt!' : 'Ergebnis:'}</strong>
          ${correct} von ${total} Fragen korrekt (${pct}%).
        </div>
      `;
    });
  }

  // ============================================================
  // TAB 4: EPK-PUZZLE (Gamification — Welcher Typ?)
  // Users see process steps and must assign the correct
  // EPK element type to each one. Tests real EPK knowledge.
  // ============================================================

  let puzzleScore = 0;
  let puzzleRound = 0;
  let puzzleCurrent = null;
  let puzzleAnswers = {};

  const TYPE_OPTIONS = [
    { key: 'event', label: 'Ereignis', icon: '\u2B21' },
    { key: 'function', label: 'Funktion', icon: '\u25A2' },
    { key: 'connectorXor', label: 'XOR', icon: '\u2295' },
    { key: 'connectorAnd', label: 'UND', icon: '\u2227' },
    { key: 'connectorOr', label: 'ODER', icon: '\u2228' },
  ];

  const PUZZLE_SCENARIOS = [
    {
      title: 'Online-Bestellung',
      description: 'Bestimme fuer jeden Schritt den richtigen EPK-Element-Typ:',
      steps: [
        { name: 'Bestellung eingegangen', correctType: 'event' },
        { name: 'Bestellung pruefen', correctType: 'function' },
        { name: 'Bestellung geprueft', correctType: 'event' },
        { name: 'Ware versenden', correctType: 'function' },
        { name: 'Ware versendet', correctType: 'event' },
      ],
    },
    {
      title: 'IT-Stoerung mit Entscheidung',
      description: 'Welcher Typ gehoert zu welchem Schritt?',
      steps: [
        { name: 'Stoerung gemeldet', correctType: 'event' },
        { name: 'Stoerung analysieren', correctType: 'function' },
        { name: 'Stoerung analysiert', correctType: 'event' },
        {
          name: 'Entweder Hardware- oder Softwareproblem (exklusiv)',
          correctType: 'connectorXor',
        },
        { name: 'Hardware reparieren', correctType: 'function' },
      ],
    },
    {
      title: 'Parallele Auftragsbearbeitung',
      description:
        'Bestimme die Element-Typen fuer diesen Prozess mit Parallelisierung:',
      steps: [
        { name: 'Auftrag eingegangen', correctType: 'event' },
        { name: 'Auftrag bearbeiten', correctType: 'function' },
        { name: 'Auftrag bearbeitet', correctType: 'event' },
        {
          name: 'Gleichzeitig: Ware kommissionieren UND Rechnung erstellen',
          correctType: 'connectorAnd',
        },
        { name: 'Rechnung erstellen', correctType: 'function' },
        { name: 'Ware versendet', correctType: 'event' },
      ],
    },
    {
      title: 'Bewerbungsprozess',
      description: 'Ordne die korrekten EPK-Typen zu:',
      steps: [
        { name: 'Bewerbung eingegangen', correctType: 'event' },
        { name: 'Bewerbung sichten', correctType: 'function' },
        { name: 'Bewerbung gesichtet', correctType: 'event' },
        {
          name: 'Genau ein Pfad: Einladung oder Absage',
          correctType: 'connectorXor',
        },
        { name: 'Einladung senden', correctType: 'function' },
        { name: 'Einladung versendet', correctType: 'event' },
      ],
    },
    {
      title: 'Serverausfall',
      description:
        'Bestimme die Element-Typen. Achtung: Zwei Aktionen laufen parallel!',
      steps: [
        { name: 'Serverausfall erkannt', correctType: 'event' },
        { name: 'Fehleranalyse durchfuehren', correctType: 'function' },
        { name: 'Fehler analysiert', correctType: 'event' },
        {
          name: 'Parallel: Backup einspielen UND Kunden informieren',
          correctType: 'connectorAnd',
        },
        { name: 'Kunden informieren', correctType: 'function' },
        { name: 'Kunden informiert', correctType: 'event' },
        { name: 'Server wieder online', correctType: 'event' },
      ],
    },
    {
      title: 'Rechnungspruefung',
      description: 'Ein Prozess mit alternativer Verzweigung:',
      steps: [
        { name: 'Rechnung eingegangen', correctType: 'event' },
        { name: 'Rechnung pruefen', correctType: 'function' },
        { name: 'Rechnung geprueft', correctType: 'event' },
        {
          name: 'Entweder korrekt oder fehlerhaft (exklusiv)',
          correctType: 'connectorXor',
        },
        { name: 'Zahlung freigeben', correctType: 'function' },
        { name: 'Reklamation schreiben', correctType: 'function' },
      ],
    },
  ];

  function renderPuzzle(container) {
    puzzleScore = 0;
    puzzleRound = 0;
    nextPuzzleRound();

    container.innerHTML = `
      <div class="epk-puzzle">
        <div class="epk-puzzle-header">
          <div class="epk-puzzle-info">
            <h3>EPK-Puzzle — Welcher Typ?</h3>
            <p class="epk-text">Ordne jedem Prozessschritt den richtigen EPK-Element-Typ zu!</p>
          </div>
          <div class="epk-puzzle-score">
            <span class="epk-puzzle-score-label">Punkte</span>
            <span class="epk-puzzle-score-value" id="epkPuzzleScore">0</span>
          </div>
        </div>

        <div class="epk-puzzle-context" id="epkPuzzleContext"></div>
        <div class="epk-puzzle-steps" id="epkPuzzleSteps"></div>

        <div class="epk-puzzle-actions">
          <button class="btn btn-primary" id="epkPuzzleCheck">Pruefen</button>
          <button class="btn" id="epkPuzzleNext">Naechste Runde</button>
        </div>
        <div id="epkPuzzleFeedback"></div>
      </div>
    `;

    renderPuzzleRound(container);
    setupPuzzleEvents(container);
  }

  function nextPuzzleRound() {
    puzzleRound++;
    puzzleAnswers = {};
    puzzleCurrent =
      PUZZLE_SCENARIOS[(puzzleRound - 1) % PUZZLE_SCENARIOS.length];
  }

  function renderPuzzleRound(container) {
    const scenario = puzzleCurrent;

    container.querySelector('#epkPuzzleContext').innerHTML = `
      <div class="epk-puzzle-context-card">
        <strong>Runde ${puzzleRound}: ${scenario.title}</strong><br>
        ${scenario.description}
      </div>
    `;

    const stepsContainer = container.querySelector('#epkPuzzleSteps');
    stepsContainer.innerHTML = scenario.steps
      .map(
        (step, i) => `
      <div class="epk-puzzle-step" data-step="${i}">
        <div class="epk-puzzle-step-name">${step.name}</div>
        <div class="epk-puzzle-step-options">
          ${TYPE_OPTIONS.map(
            (opt) => `
            <button class="epk-puzzle-type-btn" data-step="${i}" data-type="${opt.key}"
              title="${opt.label}">
              <span class="epk-puzzle-type-icon">${opt.icon}</span>
              <span class="epk-puzzle-type-label">${opt.label}</span>
            </button>
          `
          ).join('')}
        </div>
      </div>
    `
      )
      .join('');

    puzzleAnswers = {};
  }

  function setupPuzzleEvents(container) {
    // Type selection via click
    container
      .querySelector('#epkPuzzleSteps')
      .addEventListener('click', (e) => {
        const btn = e.target.closest('.epk-puzzle-type-btn');
        if (!btn) return;
        const stepIdx = parseInt(btn.dataset.step, 10);
        const type = btn.dataset.type;

        // Deselect siblings
        const stepDiv = btn.closest('.epk-puzzle-step');
        stepDiv.querySelectorAll('.epk-puzzle-type-btn').forEach((b) => {
          b.classList.remove('epk-puzzle-type-selected');
        });
        btn.classList.add('epk-puzzle-type-selected');
        puzzleAnswers[stepIdx] = type;
      });

    // Check
    container.querySelector('#epkPuzzleCheck').addEventListener('click', () => {
      checkPuzzle(container);
    });

    // Next round
    container.querySelector('#epkPuzzleNext').addEventListener('click', () => {
      nextPuzzleRound();
      renderPuzzleRound(container);
      container.querySelector('#epkPuzzleFeedback').innerHTML = '';
    });
  }

  function checkPuzzle(container) {
    const scenario = puzzleCurrent;
    let correct = 0;
    const total = scenario.steps.length;

    container.querySelectorAll('.epk-puzzle-step').forEach((stepDiv) => {
      const idx = parseInt(stepDiv.dataset.step, 10);
      const correctType = scenario.steps[idx].correctType;
      const answer = puzzleAnswers[idx];

      // Reset
      stepDiv.querySelectorAll('.epk-puzzle-type-btn').forEach((btn) => {
        btn.classList.remove(
          'epk-puzzle-type-correct',
          'epk-puzzle-type-wrong'
        );
      });

      if (answer === correctType) {
        correct++;
        const selectedBtn = stepDiv.querySelector(
          `.epk-puzzle-type-btn[data-type="${answer}"]`
        );
        if (selectedBtn) selectedBtn.classList.add('epk-puzzle-type-correct');
      } else {
        // Mark wrong answer
        if (answer) {
          const wrongBtn = stepDiv.querySelector(
            `.epk-puzzle-type-btn[data-type="${answer}"]`
          );
          if (wrongBtn) wrongBtn.classList.add('epk-puzzle-type-wrong');
        }
        // Highlight correct answer
        const correctBtn = stepDiv.querySelector(
          `.epk-puzzle-type-btn[data-type="${correctType}"]`
        );
        if (correctBtn) correctBtn.classList.add('epk-puzzle-type-correct');
      }
    });

    const allCorrect = correct === total;
    if (allCorrect) {
      puzzleScore += 10;
    } else {
      puzzleScore = Math.max(0, puzzleScore + correct * 2 - (total - correct));
    }

    container.querySelector('#epkPuzzleScore').textContent = puzzleScore;

    const feedback = container.querySelector('#epkPuzzleFeedback');
    feedback.innerHTML = `
      <div class="module-feedback ${allCorrect ? 'module-feedback-success' : 'module-feedback-error'}">
        ${
          allCorrect
            ? `<strong>Perfekt!</strong> Alle ${total} Typen korrekt zugeordnet! +10 Punkte!`
            : `<strong>${correct} von ${total} korrekt.</strong> Merke: Ereignisse beschreiben Zustaende (passiv), Funktionen beschreiben Taetigkeiten (aktiv), Konnektoren steuern die Verzweigung.`
        }
      </div>
    `;
  }

  // ============================================================
  // MAIN RENDER & CLEANUP
  // ============================================================

  function render(container) {
    currentTab = 'explanation';
    cleanup_fns = [];

    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <div class="page-header-left">
            <div>
              <h1 class="page-title">EPK-Builder</h1>
              <p class="page-subtitle">Ereignisgesteuerte Prozesskette — Geschaeftsprozesse modellieren</p>
            </div>
          </div>
        </div>

        <div class="module-tabs" id="epkTabs">
          <button class="module-tab active" data-tab="explanation">Erklaerung</button>
          <button class="module-tab" data-tab="freemode">Freier Modus</button>
          <button class="module-tab" data-tab="exercises">Aufgaben</button>
          <button class="module-tab" data-tab="puzzle">EPK-Puzzle</button>
        </div>

        <div id="epkTabContent"></div>
      </div>
    `;

    const tabContent = container.querySelector('#epkTabContent');

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
      case 'puzzle':
        renderPuzzle(tabContent);
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
    freeDragState = null;
  }

  return { render, cleanup };
})();

export default EPKView;
