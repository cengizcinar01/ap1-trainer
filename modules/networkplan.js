// ============================================================
// networkplan.js — Netzplantechnik-Board (Modul 2)
// Interactive network diagram editor with forward/backward
// calculation, critical path, exam exercises & Knoten-Tetris.
// ============================================================

const NetworkPlanView = (() => {
  let currentTab = 'explanation';
  let cleanup_fns = [];

  // ============================================================
  // DATA: Exercises from typical AP1 exams
  // ============================================================

  const EXERCISES = [
    {
      id: 1,
      title: 'Einfache Vorgangskette',
      difficulty: 'Leicht',
      startAt: 0,
      description:
        'Ein Projekt besteht aus vier aufeinanderfolgenden Vorgaengen. Berechne FAZ, FEZ, SAZ, SEZ, GP und FP fuer jeden Vorgang.',
      hint: 'Beginne mit der Vorwaertsrechnung bei FAZ=0, dann die Rueckwaertsrechnung vom letzten FEZ.',
      nodes: [
        { id: 'A', name: 'A', duration: 3, predecessors: [], x: 60, y: 140 },
        {
          id: 'B',
          name: 'B',
          duration: 5,
          predecessors: ['A'],
          x: 270,
          y: 140,
        },
        {
          id: 'C',
          name: 'C',
          duration: 2,
          predecessors: ['B'],
          x: 480,
          y: 140,
        },
        {
          id: 'D',
          name: 'D',
          duration: 4,
          predecessors: ['C'],
          x: 690,
          y: 140,
        },
      ],
    },
    {
      id: 2,
      title: 'Parallele Vorgaenge',
      difficulty: 'Mittel',
      startAt: 0,
      description:
        'Zwei Vorgaenge laufen parallel. Vorgang C ist von beiden abhaengig. Berechne alle Werte und bestimme den kritischen Pfad.',
      hint: 'Bei mehreren Vorgaengern: FAZ = hoechster FEZ-Wert der Vorgaenger.',
      nodes: [
        { id: 'A', name: 'A', duration: 3, predecessors: [], x: 60, y: 60 },
        { id: 'B', name: 'B', duration: 6, predecessors: [], x: 60, y: 260 },
        {
          id: 'C',
          name: 'C',
          duration: 4,
          predecessors: ['A', 'B'],
          x: 310,
          y: 160,
        },
        {
          id: 'D',
          name: 'D',
          duration: 2,
          predecessors: ['C'],
          x: 560,
          y: 160,
        },
      ],
    },
    {
      id: 3,
      title: 'Komplexes Netzwerk (AP1-Niveau)',
      difficulty: 'Schwer',
      startAt: 0,
      description:
        'Ein IT-Migrationsprojekt mit 7 Vorgaengen. Fuehre die Vorwaerts- und Rueckwaertsrechnung durch und finde den kritischen Pfad.',
      hint: 'Tipp: Arbeite systematisch — erst alle FAZ/FEZ (vorwaerts), dann alle SEZ/SAZ (rueckwaerts).',
      nodes: [
        { id: 'A', name: 'A', duration: 3, predecessors: [], x: 60, y: 60 },
        { id: 'B', name: 'B', duration: 5, predecessors: [], x: 60, y: 260 },
        {
          id: 'C',
          name: 'C',
          duration: 2,
          predecessors: ['A'],
          x: 280,
          y: 0,
        },
        {
          id: 'D',
          name: 'D',
          duration: 4,
          predecessors: ['A'],
          x: 280,
          y: 160,
        },
        {
          id: 'E',
          name: 'E',
          duration: 6,
          predecessors: ['B', 'C'],
          x: 500,
          y: 100,
        },
        {
          id: 'F',
          name: 'F',
          duration: 3,
          predecessors: ['D'],
          x: 500,
          y: 260,
        },
        {
          id: 'G',
          name: 'G',
          duration: 2,
          predecessors: ['E', 'F'],
          x: 720,
          y: 160,
        },
      ],
    },
    {
      id: 4,
      title: 'Pruefungsaufgabe: Start bei 1',
      difficulty: 'Schwer',
      startAt: 1,
      description:
        'Achtung: In dieser Aufgabe beginnt der FAZ bei 1 (nicht bei 0)! Berechne alle Werte korrekt.',
      hint: 'Pruefungsfalle! Manche Aufgaben starten bei Tag 1 statt Tag 0. Lies die Aufgabenstellung genau!',
      nodes: [
        { id: 'A', name: 'A', duration: 4, predecessors: [], x: 60, y: 60 },
        { id: 'B', name: 'B', duration: 3, predecessors: [], x: 60, y: 260 },
        {
          id: 'C',
          name: 'C',
          duration: 5,
          predecessors: ['A'],
          x: 310,
          y: 60,
        },
        {
          id: 'D',
          name: 'D',
          duration: 2,
          predecessors: ['A', 'B'],
          x: 310,
          y: 260,
        },
        {
          id: 'E',
          name: 'E',
          duration: 3,
          predecessors: ['C', 'D'],
          x: 560,
          y: 160,
        },
      ],
    },
    {
      id: 5,
      title: 'Server-Migration (Pruefung F2025)',
      difficulty: 'Schwer',
      startAt: 0,
      description:
        'Ein Unternehmen plant die Migration seiner Server-Infrastruktur. Berechne den Netzplan und identifiziere den kritischen Pfad.',
      hint: 'Achte auf die Abhaengigkeiten — Vorgang F hat zwei Vorgaenger!',
      nodes: [
        {
          id: 'A',
          name: 'Planung',
          duration: 5,
          predecessors: [],
          x: 60,
          y: 160,
        },
        {
          id: 'B',
          name: 'Hardware',
          duration: 8,
          predecessors: ['A'],
          x: 280,
          y: 60,
        },
        {
          id: 'C',
          name: 'Software',
          duration: 3,
          predecessors: ['A'],
          x: 280,
          y: 260,
        },
        {
          id: 'D',
          name: 'Netzwerk',
          duration: 4,
          predecessors: ['B'],
          x: 500,
          y: 60,
        },
        {
          id: 'E',
          name: 'Konfigur.',
          duration: 6,
          predecessors: ['C'],
          x: 500,
          y: 260,
        },
        {
          id: 'F',
          name: 'Test',
          duration: 3,
          predecessors: ['D', 'E'],
          x: 720,
          y: 160,
        },
      ],
    },
  ];

  // ============================================================
  // NETWORK CALCULATION ENGINE
  // ============================================================

  function calculateNetwork(nodes, connections, startAt = 0) {
    // Build adjacency lists
    const nodeMap = {};
    nodes.forEach((n) => {
      nodeMap[n.id] = {
        ...n,
        faz: null,
        fez: null,
        saz: null,
        sez: null,
        gp: null,
        fp: null,
      };
    });

    // Determine predecessors from connections if not in node data
    const predecessors = {};
    const successors = {};
    nodes.forEach((n) => {
      predecessors[n.id] = [];
      successors[n.id] = [];
    });

    // Use node.predecessors if available, else use connections
    const usePredecessors = nodes.some(
      (n) => n.predecessors && n.predecessors.length > 0
    );
    if (usePredecessors) {
      nodes.forEach((n) => {
        if (n.predecessors) {
          n.predecessors.forEach((predId) => {
            if (nodeMap[predId]) {
              predecessors[n.id].push(predId);
              successors[predId].push(n.id);
            }
          });
        }
      });
    } else if (connections) {
      connections.forEach((c) => {
        if (nodeMap[c.from] && nodeMap[c.to]) {
          predecessors[c.to].push(c.from);
          successors[c.from].push(c.to);
        }
      });
    }

    // Topological sort (Kahn's algorithm)
    const inDegree = {};
    nodes.forEach((n) => {
      inDegree[n.id] = predecessors[n.id].length;
    });
    const queue = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
    const topoOrder = [];

    while (queue.length > 0) {
      const current = queue.shift();
      topoOrder.push(current);
      successors[current].forEach((succ) => {
        inDegree[succ]--;
        if (inDegree[succ] === 0) queue.push(succ);
      });
    }

    if (topoOrder.length !== nodes.length) {
      return { error: 'Zyklus im Netzplan erkannt! Pruefe die Verbindungen.' };
    }

    // Forward pass (Vorwaertsrechnung)
    topoOrder.forEach((id) => {
      const node = nodeMap[id];
      if (predecessors[id].length === 0) {
        node.faz = startAt;
      } else {
        node.faz = Math.max(...predecessors[id].map((p) => nodeMap[p].fez));
      }
      node.fez = node.faz + node.duration;
    });

    // Find project end (max FEZ)
    const projectEnd = Math.max(...nodes.map((n) => nodeMap[n.id].fez));

    // Backward pass (Rueckwaertsrechnung)
    const reverseOrder = [...topoOrder].reverse();
    reverseOrder.forEach((id) => {
      const node = nodeMap[id];
      if (successors[id].length === 0) {
        node.sez = projectEnd;
      } else {
        node.sez = Math.min(...successors[id].map((s) => nodeMap[s].saz));
      }
      node.saz = node.sez - node.duration;
    });

    // Buffer calculation (Pufferzeiten)
    nodes.forEach((n) => {
      const node = nodeMap[n.id];
      node.gp = node.saz - node.faz;
      // FP = min(FAZ of successors) - own FEZ
      if (successors[n.id].length > 0) {
        node.fp =
          Math.min(...successors[n.id].map((s) => nodeMap[s].faz)) - node.fez;
      } else {
        node.fp = 0;
      }
    });

    // Critical path (GP = 0)
    const criticalNodes = nodes
      .filter((n) => nodeMap[n.id].gp === 0)
      .map((n) => n.id);

    // Critical connections
    const criticalConnections = [];
    criticalNodes.forEach((id) => {
      successors[id].forEach((succ) => {
        if (criticalNodes.includes(succ)) {
          criticalConnections.push({ from: id, to: succ });
        }
      });
    });

    return {
      nodes: nodes.map((n) => ({ ...n, ...nodeMap[n.id] })),
      criticalNodes,
      criticalConnections,
      projectEnd,
      predecessors,
      successors,
    };
  }

  // ============================================================
  // TAB 1: EXPLANATION (Erklaerung + Goldene Legende)
  // ============================================================

  function renderExplanation(container) {
    container.innerHTML = `
      <div class="np-explanation">
        <div class="np-section">
          <h3 class="np-section-title">Was ist Netzplantechnik?</h3>
          <p class="np-text">
            Die Netzplantechnik (auch CPM — Critical Path Method) ist eine Methode zur
            <strong>Planung und Steuerung von Projekten</strong>. Sie zeigt Vorgaenge,
            ihre Abhaengigkeiten und zeitlichen Zusammenhaenge in einem gerichteten Graphen.
          </p>
          <p class="np-text">
            In der <strong>IHK-Abschlusspruefung Teil 1</strong> musst du haeufig
            Vorwaerts- und Rueckwaertsrechnungen durchfuehren, Pufferzeiten berechnen
            und den kritischen Pfad bestimmen.
          </p>
        </div>

        <div class="np-section">
          <h3 class="np-section-title">Der Netzplan-Knoten</h3>
          <p class="np-text">Jeder Vorgang wird als Knoten dargestellt mit folgenden Feldern:</p>
          <div class="np-demo-node-wrapper">
            <div class="np-node np-node-demo">
              <div class="np-node-header">
                <span class="np-cell"><small>FAZ</small>0</span>
                <span class="np-cell np-cell-dur"><small>Dauer</small>5</span>
                <span class="np-cell"><small>FEZ</small>5</span>
              </div>
              <div class="np-node-name">Vorgang A</div>
              <div class="np-node-footer">
                <span class="np-cell"><small>SAZ</small>2</span>
                <span class="np-cell np-cell-gp"><small>GP</small>2</span>
                <span class="np-cell"><small>SEZ</small>7</span>
              </div>
            </div>
          </div>
        </div>

        <div class="np-section np-legend-box" id="goldenLegend">
          <h3 class="np-section-title">Die Goldene Legende</h3>
          <div class="np-legend-grid">
            <div class="np-legend-item">
              <span class="np-legend-abbr np-color-faz">FAZ</span>
              <div>
                <strong>Fruehester Anfang</strong>
                <p>= Vorgaenger-FEZ (bei mehreren: <em>der hoechste Wert</em>)</p>
              </div>
            </div>
            <div class="np-legend-item">
              <span class="np-legend-abbr np-color-fez">FEZ</span>
              <div>
                <strong>Fruehestes Ende</strong>
                <p>= FAZ + Dauer</p>
              </div>
            </div>
            <div class="np-legend-item">
              <span class="np-legend-abbr np-color-saz">SAZ</span>
              <div>
                <strong>Spaetester Anfang</strong>
                <p>= SEZ - Dauer</p>
              </div>
            </div>
            <div class="np-legend-item">
              <span class="np-legend-abbr np-color-sez">SEZ</span>
              <div>
                <strong>Spaetestes Ende</strong>
                <p>= Nachfolger-SAZ (bei mehreren: <em>der niedrigste Wert!</em>)</p>
              </div>
            </div>
            <div class="np-legend-item">
              <span class="np-legend-abbr np-color-gp">GP</span>
              <div>
                <strong>Gesamtpuffer</strong>
                <p>= SAZ - FAZ (oder SEZ - FEZ)</p>
              </div>
            </div>
            <div class="np-legend-item">
              <span class="np-legend-abbr np-color-fp">FP</span>
              <div>
                <strong>Freier Puffer</strong>
                <p>= FAZ des Nachfolgers - eigener FEZ</p>
              </div>
            </div>
          </div>
        </div>

        <div class="np-section">
          <h3 class="np-section-title">Vorwaertsrechnung (links nach rechts)</h3>
          <div class="np-step-list">
            <div class="np-step-item">
              <span class="np-step-num">1</span>
              <div>
                <strong>Startknoten:</strong> FAZ = 0 (oder 1 — Aufgabe genau lesen!)
              </div>
            </div>
            <div class="np-step-item">
              <span class="np-step-num">2</span>
              <div>
                <strong>FEZ berechnen:</strong> FEZ = FAZ + Dauer
              </div>
            </div>
            <div class="np-step-item">
              <span class="np-step-num">3</span>
              <div>
                <strong>Naechster Knoten:</strong> FAZ = max(alle Vorgaenger-FEZ)
              </div>
            </div>
            <div class="np-step-item">
              <span class="np-step-num">4</span>
              <div>
                Wiederhole bis zum letzten Knoten. Der hoechste FEZ = <strong>Projektdauer</strong>.
              </div>
            </div>
          </div>
        </div>

        <div class="np-section">
          <h3 class="np-section-title">Rueckwaertsrechnung (rechts nach links)</h3>
          <div class="np-step-list">
            <div class="np-step-item">
              <span class="np-step-num">1</span>
              <div>
                <strong>Endknoten:</strong> SEZ = Projektdauer (= max FEZ)
              </div>
            </div>
            <div class="np-step-item">
              <span class="np-step-num">2</span>
              <div>
                <strong>SAZ berechnen:</strong> SAZ = SEZ - Dauer
              </div>
            </div>
            <div class="np-step-item">
              <span class="np-step-num">3</span>
              <div>
                <strong>Vorheriger Knoten:</strong> SEZ = min(alle Nachfolger-SAZ)
              </div>
            </div>
            <div class="np-step-item">
              <span class="np-step-num">4</span>
              <div>
                Wiederhole bis zum ersten Knoten.
              </div>
            </div>
          </div>
        </div>

        <div class="np-section">
          <h3 class="np-section-title">Kritischer Pfad</h3>
          <p class="np-text">
            Der <strong>kritische Pfad</strong> besteht aus allen Vorgaengen mit
            <strong>GP = 0</strong> (Gesamtpuffer = 0). Diese Vorgaenge duerfen sich
            nicht verspaeten, sonst verzoegert sich das gesamte Projekt!
          </p>
          <div class="np-exam-tip">
            <strong>Pruefungstipp:</strong> Markiere den kritischen Pfad immer deutlich
            (z.B. farbig oder mit doppelten Linien). Das gibt Punkte!
          </div>
        </div>

        <div class="np-section">
          <h3 class="np-section-title">Haeufige Pruefungsfallen</h3>
          <div class="np-trap-list">
            <div class="np-trap">
              <span class="np-trap-icon">!</span>
              <div>
                <strong>Start bei 0 oder 1?</strong>
                Manche Aufgaben beginnen bei Tag 0, andere bei Tag 1.
                Lies die Aufgabenstellung GENAU!
              </div>
            </div>
            <div class="np-trap">
              <span class="np-trap-icon">!</span>
              <div>
                <strong>Mehrere Vorgaenger/Nachfolger</strong>
                FAZ = MAX der Vorgaenger-FEZ, SEZ = MIN der Nachfolger-SAZ.
                Verwechsle MAX und MIN nicht!
              </div>
            </div>
            <div class="np-trap">
              <span class="np-trap-icon">!</span>
              <div>
                <strong>GP vs. FP</strong>
                Der Gesamtpuffer (GP) bezieht sich auf SAZ-FAZ,
                der Freie Puffer (FP) auf den naechsten Nachfolger-FAZ minus eigenem FEZ.
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

  let freeNodes = [];
  let freeConnections = [];
  let freeNextId = 1;
  let freeSelectedNode = null;
  let freeConnectMode = false;
  let freeConnectSource = null;
  let freeDragState = null;
  let freeShowCritical = false;
  let freeCalcResult = null;
  let freeStartAt = 0;

  function renderFreeMode(container) {
    freeNodes = [];
    freeConnections = [];
    freeNextId = 1;
    freeSelectedNode = null;
    freeConnectMode = false;
    freeConnectSource = null;
    freeDragState = null;
    freeShowCritical = false;
    freeCalcResult = null;
    freeStartAt = 0;

    container.innerHTML = `
      <div class="np-free-mode">
        <div class="np-toolbar">
          <button class="btn btn-primary np-tool-btn" id="npAddNode">
            <svg viewBox="0 0 24 24" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Knoten
          </button>
          <button class="btn np-tool-btn" id="npConnectBtn">
            <svg viewBox="0 0 24 24" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="14 7 19 12 14 17"/></svg>
            Verbinden
          </button>
          <button class="btn np-tool-btn" id="npDeleteBtn">
            <svg viewBox="0 0 24 24" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Loeschen
          </button>
          <div class="np-toolbar-sep"></div>
          <button class="btn btn-primary np-tool-btn" id="npCalcBtn">
            <svg viewBox="0 0 24 24" width="16" height="16"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/></svg>
            Berechnen
          </button>
          <button class="btn np-tool-btn" id="npCriticalBtn">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Krit. Pfad
          </button>
          <div class="np-toolbar-sep"></div>
          <label class="np-start-toggle">
            <span>Start:</span>
            <select id="npStartAt" class="np-start-select">
              <option value="0">0</option>
              <option value="1">1</option>
            </select>
          </label>
          <button class="btn np-tool-btn np-tool-danger" id="npClearBtn">
            Zuruecksetzen
          </button>
        </div>

        <div class="np-status-bar" id="npStatusBar">
          Klicke "Knoten" um einen neuen Vorgang hinzuzufuegen.
        </div>

        <div class="np-canvas-wrapper">
          <div class="np-canvas" id="npCanvas">
            <svg class="np-svg" id="npSvg">
              <defs>
                <marker id="npArrowhead" markerWidth="10" markerHeight="7"
                  refX="10" refY="3.5" orient="auto" fill="var(--text-secondary)">
                  <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
                <marker id="npArrowheadCritical" markerWidth="10" markerHeight="7"
                  refX="10" refY="3.5" orient="auto" fill="var(--danger)">
                  <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>

        <div class="np-legend-mini" id="npLegendToggle">
          <button class="btn np-tool-btn np-legend-btn" id="npShowLegend">
            Goldene Legende anzeigen
          </button>
          <div class="np-legend-popup" id="npLegendPopup" style="display:none;">
            <div class="np-legend-grid np-legend-compact">
              <div class="np-legend-item"><span class="np-legend-abbr np-color-faz">FAZ</span><span>= max(Vorgaenger-FEZ)</span></div>
              <div class="np-legend-item"><span class="np-legend-abbr np-color-fez">FEZ</span><span>= FAZ + Dauer</span></div>
              <div class="np-legend-item"><span class="np-legend-abbr np-color-saz">SAZ</span><span>= SEZ - Dauer</span></div>
              <div class="np-legend-item"><span class="np-legend-abbr np-color-sez">SEZ</span><span>= min(Nachfolger-SAZ)</span></div>
              <div class="np-legend-item"><span class="np-legend-abbr np-color-gp">GP</span><span>= SAZ - FAZ</span></div>
              <div class="np-legend-item"><span class="np-legend-abbr np-color-fp">FP</span><span>= Nachf.-FAZ - FEZ</span></div>
            </div>
          </div>
        </div>
      </div>
    `;

    setupFreeModeEvents(container);
  }

  function setupFreeModeEvents(container) {
    const canvas = container.querySelector('#npCanvas');
    const svg = container.querySelector('#npSvg');
    const statusBar = container.querySelector('#npStatusBar');

    // Add node
    container.querySelector('#npAddNode').addEventListener('click', () => {
      const id = String.fromCharCode(64 + freeNextId); // A, B, C...
      if (freeNextId > 26) return;
      const offsetX = 60 + ((freeNextId - 1) % 4) * 210;
      const offsetY = 40 + Math.floor((freeNextId - 1) / 4) * 160;
      freeNodes.push({
        id,
        name: id,
        duration: 3,
        x: offsetX,
        y: offsetY,
      });
      freeNextId++;
      freeCalcResult = null;
      freeShowCritical = false;
      redrawFreeCanvas(container);
      setStatus(
        statusBar,
        `Knoten "${id}" hinzugefuegt. Doppelklick zum Bearbeiten.`
      );
    });

    // Connect mode toggle
    container.querySelector('#npConnectBtn').addEventListener('click', () => {
      freeConnectMode = !freeConnectMode;
      freeConnectSource = null;
      container
        .querySelector('#npConnectBtn')
        .classList.toggle('active', freeConnectMode);
      if (freeConnectMode) {
        setStatus(
          statusBar,
          'Verbindungsmodus: Klicke auf Quell-Knoten, dann auf Ziel-Knoten.'
        );
      } else {
        setStatus(statusBar, 'Verbindungsmodus beendet.');
      }
    });

    // Delete selected
    container.querySelector('#npDeleteBtn').addEventListener('click', () => {
      if (freeSelectedNode) {
        freeConnections = freeConnections.filter(
          (c) => c.from !== freeSelectedNode && c.to !== freeSelectedNode
        );
        freeNodes = freeNodes.filter((n) => n.id !== freeSelectedNode);
        setStatus(statusBar, `Knoten "${freeSelectedNode}" geloescht.`);
        freeSelectedNode = null;
        freeCalcResult = null;
        freeShowCritical = false;
        redrawFreeCanvas(container);
      } else {
        setStatus(statusBar, 'Waehle zuerst einen Knoten aus (Klick).');
      }
    });

    // Calculate
    container.querySelector('#npCalcBtn').addEventListener('click', () => {
      if (freeNodes.length === 0) {
        setStatus(statusBar, 'Fuege zuerst Knoten hinzu!');
        return;
      }
      const result = calculateNetwork(freeNodes, freeConnections, freeStartAt);
      if (result.error) {
        setStatus(statusBar, result.error);
        return;
      }
      freeCalcResult = result;
      freeNodes = result.nodes;
      redrawFreeCanvas(container);
      setStatus(
        statusBar,
        `Berechnung abgeschlossen! Projektdauer: ${result.projectEnd} ZE`
      );
    });

    // Critical path
    container.querySelector('#npCriticalBtn').addEventListener('click', () => {
      if (!freeCalcResult) {
        setStatus(statusBar, 'Fuehre zuerst die Berechnung durch!');
        return;
      }
      freeShowCritical = !freeShowCritical;
      container
        .querySelector('#npCriticalBtn')
        .classList.toggle('active', freeShowCritical);
      redrawFreeCanvas(container);
      if (freeShowCritical) {
        setStatus(
          statusBar,
          `Kritischer Pfad: ${freeCalcResult.criticalNodes.join(' → ')}`
        );
      }
    });

    // Start at selector
    container.querySelector('#npStartAt').addEventListener('change', (e) => {
      freeStartAt = parseInt(e.target.value, 10);
      freeCalcResult = null;
      freeShowCritical = false;
      redrawFreeCanvas(container);
    });

    // Clear
    container.querySelector('#npClearBtn').addEventListener('click', () => {
      freeNodes = [];
      freeConnections = [];
      freeNextId = 1;
      freeSelectedNode = null;
      freeConnectMode = false;
      freeConnectSource = null;
      freeCalcResult = null;
      freeShowCritical = false;
      container.querySelector('#npConnectBtn').classList.remove('active');
      container.querySelector('#npCriticalBtn').classList.remove('active');
      redrawFreeCanvas(container);
      setStatus(statusBar, 'Canvas zurueckgesetzt.');
    });

    // Legend toggle
    container.querySelector('#npShowLegend').addEventListener('click', () => {
      const popup = container.querySelector('#npLegendPopup');
      popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
    });

    // Canvas click (deselect)
    canvas.addEventListener('mousedown', (e) => {
      if (
        e.target === canvas ||
        e.target === svg ||
        e.target.tagName === 'svg'
      ) {
        freeSelectedNode = null;
        if (!freeConnectMode) {
          redrawFreeCanvas(container);
        }
      }
    });
  }

  function redrawFreeCanvas(container) {
    const canvas = container.querySelector('#npCanvas');
    const svg = container.querySelector('#npSvg');
    if (!canvas || !svg) return;

    // Remove old nodes
    canvas.querySelectorAll('.np-node').forEach((el) => {
      el.remove();
    });

    // Draw nodes
    freeNodes.forEach((node) => {
      const el = createNodeElement(node, {
        editable: true,
        selected: node.id === freeSelectedNode,
        critical:
          freeShowCritical &&
          freeCalcResult &&
          freeCalcResult.criticalNodes.includes(node.id),
        showCalc: !!freeCalcResult,
      });
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;
      canvas.appendChild(el);

      // Node interactions
      setupNodeDrag(el, node, container);
      setupNodeClick(el, node, container);
    });

    // Draw connections
    drawSVGConnections(
      svg,
      freeNodes,
      freeConnections,
      freeShowCritical,
      freeCalcResult
    );
  }

  function createNodeElement(node, opts = {}) {
    const div = document.createElement('div');
    div.className =
      'np-node' +
      (opts.selected ? ' np-node-selected' : '') +
      (opts.critical ? ' np-node-critical' : '');
    div.dataset.id = node.id;

    const showCalc =
      opts.showCalc && node.faz !== undefined && node.faz !== null;

    div.innerHTML = `
      <div class="np-node-header">
        <span class="np-cell np-cell-faz"><small>FAZ</small>${showCalc ? node.faz : ''}</span>
        <span class="np-cell np-cell-dur"><small>Dauer</small>${node.duration}</span>
        <span class="np-cell np-cell-fez"><small>FEZ</small>${showCalc ? node.fez : ''}</span>
      </div>
      <div class="np-node-name">${node.name}</div>
      <div class="np-node-footer">
        <span class="np-cell np-cell-saz"><small>SAZ</small>${showCalc ? node.saz : ''}</span>
        <span class="np-cell np-cell-gp"><small>GP</small>${showCalc ? node.gp : ''}</span>
        <span class="np-cell np-cell-sez"><small>SEZ</small>${showCalc ? node.sez : ''}</span>
      </div>
    `;
    return div;
  }

  function setupNodeDrag(el, node, container) {
    let startX, startY, nodeStartX, nodeStartY;

    function onPointerDown(e) {
      if (freeConnectMode) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      startX = clientX;
      startY = clientY;
      nodeStartX = node.x;
      nodeStartY = node.y;
      freeDragState = { nodeId: node.id };
      el.classList.add('np-node-dragging');

      document.addEventListener('mousemove', onPointerMove);
      document.addEventListener('mouseup', onPointerUp);
      document.addEventListener('touchmove', onPointerMove, { passive: false });
      document.addEventListener('touchend', onPointerUp);
    }

    function onPointerMove(e) {
      if (!freeDragState || freeDragState.nodeId !== node.id) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - startX;
      const dy = clientY - startY;
      node.x = Math.max(0, nodeStartX + dx);
      node.y = Math.max(0, nodeStartY + dy);
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;
      // Redraw arrows
      const svg = container.querySelector('#npSvg');
      drawSVGConnections(
        svg,
        freeNodes,
        freeConnections,
        freeShowCritical,
        freeCalcResult
      );
    }

    function onPointerUp() {
      freeDragState = null;
      el.classList.remove('np-node-dragging');
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('touchend', onPointerUp);
    }

    el.addEventListener('mousedown', onPointerDown);
    el.addEventListener('touchstart', onPointerDown, { passive: false });
  }

  function setupNodeClick(el, node, container) {
    const statusBar = container.querySelector('#npStatusBar');

    el.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return;

      if (freeConnectMode) {
        if (!freeConnectSource) {
          freeConnectSource = node.id;
          el.classList.add('np-node-connect-source');
          setStatus(
            statusBar,
            `Quelle: "${node.id}". Klicke jetzt den Ziel-Knoten.`
          );
        } else if (freeConnectSource !== node.id) {
          // Check if connection already exists
          const exists = freeConnections.some(
            (c) => c.from === freeConnectSource && c.to === node.id
          );
          if (!exists) {
            freeConnections.push({ from: freeConnectSource, to: node.id });
            freeCalcResult = null;
            freeShowCritical = false;
            setStatus(
              statusBar,
              `Verbindung: ${freeConnectSource} → ${node.id} erstellt.`
            );
          } else {
            setStatus(statusBar, 'Diese Verbindung existiert bereits.');
          }
          freeConnectSource = null;
          redrawFreeCanvas(container);
        }
      } else {
        freeSelectedNode = node.id;
        redrawFreeCanvas(container);
      }
    });

    // Double-click to edit
    el.addEventListener('dblclick', (e) => {
      if (freeConnectMode) return;
      e.preventDefault();
      showNodeEditDialog(node, container);
    });
  }

  function showNodeEditDialog(node, container) {
    const statusBar = container.querySelector('#npStatusBar');
    // Simple inline edit via prompt-like overlay
    const overlay = document.createElement('div');
    overlay.className = 'np-edit-overlay';
    overlay.innerHTML = `
      <div class="np-edit-dialog">
        <h4>Knoten bearbeiten</h4>
        <div class="np-edit-fields">
          <label>Name:
            <input type="text" id="npEditName" value="${node.name}" maxlength="12" class="module-input" />
          </label>
          <label>Dauer:
            <input type="number" id="npEditDuration" value="${node.duration}" min="1" max="999" class="module-input" />
          </label>
        </div>
        <div class="np-edit-actions">
          <button class="btn btn-primary" id="npEditSave">Speichern</button>
          <button class="btn" id="npEditCancel">Abbrechen</button>
          <button class="btn np-tool-danger" id="npEditDelete">Knoten loeschen</button>
        </div>
      </div>
    `;
    container.querySelector('.np-free-mode').appendChild(overlay);

    overlay.querySelector('#npEditSave').addEventListener('click', () => {
      node.name = overlay.querySelector('#npEditName').value || node.id;
      node.duration = Math.max(
        1,
        parseInt(overlay.querySelector('#npEditDuration').value, 10) || 1
      );
      freeCalcResult = null;
      freeShowCritical = false;
      overlay.remove();
      redrawFreeCanvas(container);
      setStatus(statusBar, `Knoten "${node.name}" aktualisiert.`);
    });

    overlay.querySelector('#npEditCancel').addEventListener('click', () => {
      overlay.remove();
    });

    overlay.querySelector('#npEditDelete').addEventListener('click', () => {
      freeConnections = freeConnections.filter(
        (c) => c.from !== node.id && c.to !== node.id
      );
      freeNodes = freeNodes.filter((n) => n.id !== node.id);
      freeSelectedNode = null;
      freeCalcResult = null;
      freeShowCritical = false;
      overlay.remove();
      redrawFreeCanvas(container);
      setStatus(statusBar, `Knoten "${node.id}" geloescht.`);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // Focus name input
    setTimeout(() => overlay.querySelector('#npEditName').focus(), 50);
  }

  // Shared arrow geometry: determines anchor points & bezier path
  function computeArrowPath(from, to, nodeW, nodeH) {
    const PAD = 4; // padding so arrowhead doesn't overlap border

    // Centers
    const fcx = from.x + nodeW / 2;
    const fcy = from.y + nodeH / 2;
    const tcx = to.x + nodeW / 2;
    const tcy = to.y + nodeH / 2;

    // Angle from source center to target center
    const dx = tcx - fcx;
    const dy = tcy - fcy;
    const angle = Math.atan2(dy, dx); // radians

    // Determine best exit side (right, bottom, left, top)
    let x1, y1, x2, y2;

    // Exit side of source node
    if (angle > -Math.PI / 4 && angle <= Math.PI / 4) {
      // Right
      x1 = from.x + nodeW + PAD;
      y1 = fcy;
    } else if (angle > Math.PI / 4 && angle <= (3 * Math.PI) / 4) {
      // Bottom
      x1 = fcx;
      y1 = from.y + nodeH + PAD;
    } else if (angle > (-3 * Math.PI) / 4 && angle <= -Math.PI / 4) {
      // Top
      x1 = fcx;
      y1 = from.y - PAD;
    } else {
      // Left
      x1 = from.x - PAD;
      y1 = fcy;
    }

    // Entry side of target node (opposite direction)
    const rAngle = Math.atan2(-dy, -dx);
    if (rAngle > -Math.PI / 4 && rAngle <= Math.PI / 4) {
      // Arrow enters from right
      x2 = to.x + nodeW + PAD;
      y2 = tcy;
    } else if (rAngle > Math.PI / 4 && rAngle <= (3 * Math.PI) / 4) {
      // Arrow enters from bottom
      x2 = tcx;
      y2 = to.y + nodeH + PAD;
    } else if (rAngle > (-3 * Math.PI) / 4 && rAngle <= -Math.PI / 4) {
      // Arrow enters from top
      x2 = tcx;
      y2 = to.y - PAD;
    } else {
      // Arrow enters from left
      x2 = to.x - PAD;
      y2 = tcy;
    }

    // Bezier control points: pull in the direction of departure/arrival
    const dist = Math.sqrt(dx * dx + dy * dy);
    const tension = Math.min(dist * 0.4, 120);

    // Exit direction vector
    const ex = x1 - fcx;
    const ey = y1 - fcy;
    const elen = Math.sqrt(ex * ex + ey * ey) || 1;
    const cx1 = x1 + (ex / elen) * tension;
    const cy1 = y1 + (ey / elen) * tension;

    // Entry direction vector (inward)
    const ix = x2 - tcx;
    const iy = y2 - tcy;
    const ilen = Math.sqrt(ix * ix + iy * iy) || 1;
    const cx2 = x2 + (ix / ilen) * tension;
    const cy2 = y2 + (iy / ilen) * tension;

    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  }

  function drawSVGConnections(
    svg,
    nodes,
    connections,
    showCritical,
    calcResult
  ) {
    svg.querySelectorAll('.np-arrow, .np-arrow-hit').forEach((el) => {
      el.remove();
    });

    const nodeMap = {};
    nodes.forEach((n) => {
      nodeMap[n.id] = n;
    });
    const NODE_W = 174;
    const NODE_H = 98;

    connections.forEach((conn) => {
      const from = nodeMap[conn.from];
      const to = nodeMap[conn.to];
      if (!from || !to) return;

      const isCritical =
        showCritical &&
        calcResult &&
        calcResult.criticalConnections.some(
          (c) => c.from === conn.from && c.to === conn.to
        );

      const d = computeArrowPath(from, to, NODE_W, NODE_H);

      // Invisible wider hit area for easier clicking
      const hitPath = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );
      hitPath.setAttribute('d', d);
      hitPath.setAttribute('class', 'np-arrow-hit');
      svg.appendChild(hitPath);

      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );
      path.setAttribute('d', d);
      path.setAttribute(
        'class',
        `np-arrow${isCritical ? ' np-arrow-critical' : ''}`
      );
      path.setAttribute(
        'marker-end',
        isCritical ? 'url(#npArrowheadCritical)' : 'url(#npArrowhead)'
      );

      // Click to delete connection (on hit area or visible path)
      function onArrowClick(e) {
        e.stopPropagation();
        freeConnections = freeConnections.filter(
          (c) => !(c.from === conn.from && c.to === conn.to)
        );
        freeCalcResult = null;
        freeShowCritical = false;
        const parentContainer =
          svg.closest('.np-free-mode')?.parentElement ||
          svg.closest('#pageContent');
        if (parentContainer) redrawFreeCanvas(parentContainer);
      }
      hitPath.addEventListener('click', onArrowClick);
      path.addEventListener('click', onArrowClick);

      svg.appendChild(path);
    });
  }

  function setStatus(statusBar, msg) {
    if (statusBar) statusBar.textContent = msg;
  }

  // ============================================================
  // TAB 3: EXERCISES (Pruefungsaufgaben)
  // ============================================================

  let currentExerciseIdx = 0;
  let exerciseState = null; // { inputs: { nodeId: { faz, fez, saz, sez, gp, fp } } }
  let _exerciseChecked = false;
  let _exerciseSolution = null;

  function renderExercises(container) {
    currentExerciseIdx = 0;
    renderExercise(container);
  }

  function renderExercise(container) {
    const ex = EXERCISES[currentExerciseIdx];
    _exerciseChecked = false;
    _exerciseSolution = null;
    exerciseState = { inputs: {} };
    ex.nodes.forEach((n) => {
      exerciseState.inputs[n.id] = {
        faz: '',
        fez: '',
        saz: '',
        sez: '',
        gp: '',
        fp: '',
      };
    });

    container.innerHTML = `
      <div class="np-exercises">
        <div class="np-exercise-nav">
          ${EXERCISES.map(
            (e, i) => `
            <button class="np-exercise-nav-btn ${i === currentExerciseIdx ? 'active' : ''}"
              data-idx="${i}">
              ${e.title}
              <span class="np-diff-badge np-diff-${e.difficulty.toLowerCase()}">${e.difficulty}</span>
            </button>
          `
          ).join('')}
        </div>

        <div class="np-exercise-card">
          <div class="np-exercise-header">
            <h3>${ex.title}</h3>
            <span class="np-diff-badge np-diff-${ex.difficulty.toLowerCase()}">${ex.difficulty}</span>
            ${ex.startAt === 1 ? '<span class="np-start-badge">Start bei 1!</span>' : ''}
          </div>
          <p class="np-text">${ex.description}</p>
          <div class="np-exam-tip">${ex.hint}</div>

          <div class="np-exercise-diagram" id="npExDiagram">
            <svg class="np-svg np-ex-svg" id="npExSvg">
              <defs>
                <marker id="npExArrow" markerWidth="10" markerHeight="7"
                  refX="10" refY="3.5" orient="auto" fill="var(--text-secondary)">
                  <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
                <marker id="npExArrowCrit" markerWidth="10" markerHeight="7"
                  refX="10" refY="3.5" orient="auto" fill="var(--danger)">
                  <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
              </defs>
            </svg>
          </div>

          <div class="np-exercise-actions">
            <button class="btn btn-primary" id="npCheckExercise">Pruefen</button>
            <button class="btn" id="npShowSolution">Loesung anzeigen</button>
            <button class="btn" id="npResetExercise">Zuruecksetzen</button>
          </div>

          <div id="npExFeedback"></div>
          <div id="npExSolution"></div>
        </div>
      </div>
    `;

    // Render the diagram with input fields
    renderExerciseDiagram(container, ex);

    // Exercise nav
    container.querySelectorAll('.np-exercise-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentExerciseIdx = parseInt(btn.dataset.idx, 10);
        renderExercise(container);
      });
    });

    // Check
    container
      .querySelector('#npCheckExercise')
      .addEventListener('click', () => {
        checkExercise(container, ex);
      });

    // Show solution
    container.querySelector('#npShowSolution').addEventListener('click', () => {
      showExerciseSolution(container, ex);
    });

    // Reset
    container
      .querySelector('#npResetExercise')
      .addEventListener('click', () => {
        renderExercise(container);
      });
  }

  function renderExerciseDiagram(container, ex) {
    const diagram = container.querySelector('#npExDiagram');
    const svg = container.querySelector('#npExSvg');

    // Build connections from predecessors
    const connections = [];
    ex.nodes.forEach((n) => {
      if (n.predecessors) {
        n.predecessors.forEach((pred) => {
          connections.push({ from: pred, to: n.id });
        });
      }
    });

    // Create exercise nodes (with input fields)
    ex.nodes.forEach((node) => {
      const el = document.createElement('div');
      el.className = 'np-node np-node-exercise';
      el.dataset.id = node.id;
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;

      el.innerHTML = `
        <div class="np-node-header">
          <span class="np-cell np-cell-input">
            <small>FAZ</small>
            <input type="number" class="np-ex-input" data-node="${node.id}" data-field="faz" />
          </span>
          <span class="np-cell np-cell-dur"><small>Dauer</small>${node.duration}</span>
          <span class="np-cell np-cell-input">
            <small>FEZ</small>
            <input type="number" class="np-ex-input" data-node="${node.id}" data-field="fez" />
          </span>
        </div>
        <div class="np-node-name">${node.name}</div>
        <div class="np-node-footer">
          <span class="np-cell np-cell-input">
            <small>SAZ</small>
            <input type="number" class="np-ex-input" data-node="${node.id}" data-field="saz" />
          </span>
          <span class="np-cell np-cell-input">
            <small>GP</small>
            <input type="number" class="np-ex-input" data-node="${node.id}" data-field="gp" />
          </span>
          <span class="np-cell np-cell-input">
            <small>SEZ</small>
            <input type="number" class="np-ex-input" data-node="${node.id}" data-field="sez" />
          </span>
        </div>
      `;

      diagram.appendChild(el);
    });

    // Draw connections
    const nodeMap = {};
    ex.nodes.forEach((n) => {
      nodeMap[n.id] = n;
    });
    drawExerciseSVGConnections(svg, nodeMap, connections);

    // Input event listeners
    diagram.querySelectorAll('.np-ex-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const nodeId = e.target.dataset.node;
        const field = e.target.dataset.field;
        exerciseState.inputs[nodeId][field] = e.target.value;
      });
    });
  }

  function drawExerciseSVGConnections(
    svg,
    nodeMap,
    connections,
    criticalConnections = []
  ) {
    svg.querySelectorAll('.np-arrow').forEach((el) => {
      el.remove();
    });

    const NODE_W = 174;
    const NODE_H = 98;

    connections.forEach((conn) => {
      const from = nodeMap[conn.from];
      const to = nodeMap[conn.to];
      if (!from || !to) return;

      const isCritical = criticalConnections.some(
        (c) => c.from === conn.from && c.to === conn.to
      );

      const d = computeArrowPath(from, to, NODE_W, NODE_H);

      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );
      path.setAttribute('d', d);
      path.setAttribute(
        'class',
        `np-arrow${isCritical ? ' np-arrow-critical' : ''}`
      );
      path.setAttribute(
        'marker-end',
        isCritical ? 'url(#npExArrowCrit)' : 'url(#npExArrow)'
      );
      svg.appendChild(path);
    });
  }

  function checkExercise(container, ex) {
    // Calculate correct solution
    const result = calculateNetwork(ex.nodes, null, ex.startAt);
    _exerciseSolution = result;

    const feedback = container.querySelector('#npExFeedback');
    let totalFields = 0;
    let correctFields = 0;
    const _fields = ['faz', 'fez', 'saz', 'sez', 'gp'];

    // Check each input
    container.querySelectorAll('.np-ex-input').forEach((input) => {
      const nodeId = input.dataset.node;
      const field = input.dataset.field;
      const solNode = result.nodes.find((n) => n.id === nodeId);
      if (!solNode) return;

      const userVal = input.value.trim();
      const correctVal = solNode[field];
      totalFields++;

      input.classList.remove('np-input-correct', 'np-input-wrong');

      if (userVal === '') {
        input.classList.add('np-input-wrong');
      } else if (parseInt(userVal, 10) === correctVal) {
        input.classList.add('np-input-correct');
        correctFields++;
      } else {
        input.classList.add('np-input-wrong');
      }
    });

    const percentage = Math.round((correctFields / totalFields) * 100);
    const isAllCorrect = correctFields === totalFields;

    feedback.innerHTML = `
      <div class="module-feedback ${isAllCorrect ? 'module-feedback-success' : 'module-feedback-error'}">
        <strong>${isAllCorrect ? 'Perfekt!' : 'Noch nicht ganz richtig.'}</strong>
        ${correctFields} von ${totalFields} Feldern korrekt (${percentage}%).
        ${!isAllCorrect ? 'Falsche Felder sind rot markiert.' : ''}
        ${isAllCorrect && result.criticalNodes ? `<br>Kritischer Pfad: <strong>${result.criticalNodes.join(' → ')}</strong>` : ''}
      </div>
    `;

    // Highlight critical path on success
    if (isAllCorrect) {
      const svg = container.querySelector('#npExSvg');
      const nodeMap = {};
      ex.nodes.forEach((n) => {
        nodeMap[n.id] = n;
      });
      const connections = [];
      ex.nodes.forEach((n) => {
        if (n.predecessors) {
          n.predecessors.forEach((pred) => {
            connections.push({ from: pred, to: n.id });
          });
        }
      });
      drawExerciseSVGConnections(
        svg,
        nodeMap,
        connections,
        result.criticalConnections
      );

      // Highlight critical nodes
      container.querySelectorAll('.np-node-exercise').forEach((el) => {
        if (result.criticalNodes.includes(el.dataset.id)) {
          el.classList.add('np-node-critical');
        }
      });
    }

    _exerciseChecked = true;
  }

  function showExerciseSolution(container, ex) {
    const result = calculateNetwork(ex.nodes, null, ex.startAt);
    _exerciseSolution = result;

    // Fill in inputs with correct values
    container.querySelectorAll('.np-ex-input').forEach((input) => {
      const nodeId = input.dataset.node;
      const field = input.dataset.field;
      const solNode = result.nodes.find((n) => n.id === nodeId);
      if (!solNode) return;

      input.value = solNode[field];
      input.classList.remove('np-input-wrong');
      input.classList.add('np-input-correct');
    });

    // Show critical path
    const svg = container.querySelector('#npExSvg');
    const nodeMap = {};
    ex.nodes.forEach((n) => {
      nodeMap[n.id] = n;
    });
    const connections = [];
    ex.nodes.forEach((n) => {
      if (n.predecessors) {
        n.predecessors.forEach((pred) => {
          connections.push({ from: pred, to: n.id });
        });
      }
    });
    drawExerciseSVGConnections(
      svg,
      nodeMap,
      connections,
      result.criticalConnections
    );
    container.querySelectorAll('.np-node-exercise').forEach((el) => {
      if (result.criticalNodes.includes(el.dataset.id)) {
        el.classList.add('np-node-critical');
      }
    });

    // Show step-by-step solution
    const solContainer = container.querySelector('#npExSolution');
    solContainer.innerHTML = `
      <div class="module-steps">
        <div class="module-steps-title">Loesungsweg</div>

        <div class="module-step">
          <div class="module-step-title">Schritt 1: Vorwaertsrechnung</div>
          <div class="module-step-text">
            ${result.nodes
              .map((n) => {
                const preds =
                  ex.nodes.find((e) => e.id === n.id)?.predecessors || [];
                if (preds.length === 0) {
                  return `<strong>${n.name}:</strong> FAZ = ${ex.startAt} (Startknoten), FEZ = ${ex.startAt} + ${n.duration} = ${n.fez}`;
                }
                const predFEZs = preds.map((p) => {
                  const pNode = result.nodes.find((rn) => rn.id === p);
                  return `FEZ(${pNode.name})=${pNode.fez}`;
                });
                return `<strong>${n.name}:</strong> FAZ = ${preds.length > 1 ? `max(${predFEZs.join(', ')})` : predFEZs[0]} = ${n.faz}, FEZ = ${n.faz} + ${n.duration} = ${n.fez}`;
              })
              .join('<br>')}
          </div>
        </div>

        <div class="module-step">
          <div class="module-step-title">Schritt 2: Projektdauer</div>
          <div class="module-step-text">
            Projektdauer = max(alle FEZ) = <strong>${result.projectEnd} ZE</strong>
          </div>
        </div>

        <div class="module-step">
          <div class="module-step-title">Schritt 3: Rueckwaertsrechnung</div>
          <div class="module-step-text">
            ${[...result.nodes]
              .reverse()
              .map((n) => {
                const succs = result.successors[n.id] || [];
                if (succs.length === 0) {
                  return `<strong>${n.name}:</strong> SEZ = ${result.projectEnd} (Endknoten), SAZ = ${result.projectEnd} - ${n.duration} = ${n.saz}`;
                }
                const succSAZs = succs.map((s) => {
                  const sNode = result.nodes.find((rn) => rn.id === s);
                  return `SAZ(${sNode.name})=${sNode.saz}`;
                });
                return `<strong>${n.name}:</strong> SEZ = ${succs.length > 1 ? `min(${succSAZs.join(', ')})` : succSAZs[0]} = ${n.sez}, SAZ = ${n.sez} - ${n.duration} = ${n.saz}`;
              })
              .join('<br>')}
          </div>
        </div>

        <div class="module-step">
          <div class="module-step-title">Schritt 4: Pufferzeiten</div>
          <div class="module-step-text">
            ${result.nodes
              .map((n) => {
                return `<strong>${n.name}:</strong> GP = ${n.saz} - ${n.faz} = <strong>${n.gp}</strong>, FP = ${n.fp}`;
              })
              .join('<br>')}
          </div>
        </div>

        <div class="module-step">
          <div class="module-step-title">Schritt 5: Kritischer Pfad</div>
          <div class="module-step-text">
            Vorgaenge mit GP = 0: <strong>${result.criticalNodes.join(' → ')}</strong>
            <br>Das ist der kritische Pfad — diese Vorgaenge duerfen sich nicht verspaeten!
          </div>
        </div>
      </div>
    `;

    const feedback = container.querySelector('#npExFeedback');
    feedback.innerHTML = `
      <div class="module-feedback module-feedback-success">
        <strong>Loesung angezeigt.</strong> Kritischer Pfad: ${result.criticalNodes.join(' → ')}
        | Projektdauer: ${result.projectEnd} ZE
      </div>
    `;
  }

  // ============================================================
  // TAB 4: KNOTEN-TETRIS (Gamification)
  // ============================================================

  let tetrisScore = 0;
  let tetrisRound = 0;
  let _tetrisCurrentNode = null;
  let tetrisSolution = null;
  let tetrisPlaced = {};

  function renderTetris(container) {
    tetrisScore = 0;
    tetrisRound = 0;
    generateTetrisRound();

    container.innerHTML = `
      <div class="np-tetris">
        <div class="np-tetris-header">
          <div class="np-tetris-info">
            <h3>Knoten-Tetris</h3>
            <p class="np-text">Ziehe die richtigen Zahlen in die passenden Felder des Knotens!</p>
          </div>
          <div class="np-tetris-score">
            <span class="np-tetris-score-label">Punkte</span>
            <span class="np-tetris-score-value" id="npTetrisScore">0</span>
          </div>
        </div>

        <div class="np-tetris-context" id="npTetrisContext"></div>

        <div class="np-tetris-area">
          <div class="np-tetris-chips" id="npTetrisChips"></div>
          <div class="np-tetris-node-wrapper">
            <div class="np-node np-node-tetris" id="npTetrisNode">
              <div class="np-node-header">
                <span class="np-cell np-tetris-drop" data-field="faz"><small>FAZ</small><span class="np-drop-zone" data-field="faz">?</span></span>
                <span class="np-cell np-cell-dur"><small>Dauer</small><span id="npTetrisDur">?</span></span>
                <span class="np-cell np-tetris-drop" data-field="fez"><small>FEZ</small><span class="np-drop-zone" data-field="fez">?</span></span>
              </div>
              <div class="np-node-name" id="npTetrisName">?</div>
              <div class="np-node-footer">
                <span class="np-cell np-tetris-drop" data-field="saz"><small>SAZ</small><span class="np-drop-zone" data-field="saz">?</span></span>
                <span class="np-cell np-tetris-drop" data-field="gp"><small>GP</small><span class="np-drop-zone" data-field="gp">?</span></span>
                <span class="np-cell np-tetris-drop" data-field="sez"><small>SEZ</small><span class="np-drop-zone" data-field="sez">?</span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="np-tetris-actions">
          <button class="btn btn-primary" id="npTetrisCheck">Pruefen</button>
          <button class="btn" id="npTetrisNext">Naechste Runde</button>
        </div>
        <div id="npTetrisFeedback"></div>
      </div>
    `;

    renderTetrisRound(container);
    setupTetrisEvents(container);
  }

  function generateTetrisRound() {
    tetrisRound++;
    tetrisPlaced = {};

    // Generate random node values
    const faz = Math.floor(Math.random() * 15);
    const duration = Math.floor(Math.random() * 8) + 1;
    const fez = faz + duration;
    const gpVal = Math.floor(Math.random() * 6);
    const saz = faz + gpVal;
    const sez = saz + duration;
    const fpVal = Math.floor(Math.random() * (gpVal + 1));

    const names = [
      'Planung',
      'Analyse',
      'Design',
      'Umsetzung',
      'Test',
      'Rollout',
      'Doku',
      'Review',
      'Migration',
      'Schulung',
      'Backup',
      'Konfigur.',
    ];
    const name = names[Math.floor(Math.random() * names.length)];

    tetrisSolution = {
      faz,
      fez,
      saz,
      sez,
      gp: gpVal,
      fp: fpVal,
      duration,
      name,
    };
    _tetrisCurrentNode = { name, duration };
  }

  function renderTetrisRound(container) {
    const sol = tetrisSolution;

    // Context info
    const context = container.querySelector('#npTetrisContext');
    context.innerHTML = `
      <div class="np-tetris-context-card">
        <strong>Runde ${tetrisRound}:</strong> Vorgang "${sol.name}" hat eine Dauer von <strong>${sol.duration}</strong> ZE.
        FAZ = ${sol.faz}. Der Gesamtpuffer betraegt ${sol.gp}.
        <em>Berechne die restlichen Werte und ordne sie zu!</em>
      </div>
    `;

    // Set node display
    container.querySelector('#npTetrisDur').textContent = sol.duration;
    container.querySelector('#npTetrisName').textContent = sol.name;

    // Generate chips (correct values + some distractors)
    const correctValues = [sol.faz, sol.fez, sol.saz, sol.sez, sol.gp];
    const distractors = new Set();
    while (distractors.size < 3) {
      const d = Math.floor(Math.random() * (sol.sez + 10));
      if (!correctValues.includes(d)) distractors.add(d);
    }

    const allValues = [...correctValues, ...distractors];
    // Shuffle
    for (let i = allValues.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allValues[i], allValues[j]] = [allValues[j], allValues[i]];
    }

    const chipsContainer = container.querySelector('#npTetrisChips');
    chipsContainer.innerHTML = allValues
      .map(
        (v) =>
          `<div class="np-tetris-chip" draggable="true" data-value="${v}">${v}</div>`
      )
      .join('');

    // Reset drop zones
    container.querySelectorAll('.np-drop-zone').forEach((zone) => {
      zone.textContent = '?';
      zone.classList.remove(
        'np-drop-filled',
        'np-input-correct',
        'np-input-wrong'
      );
    });

    // Reset tetrisPlaced
    tetrisPlaced = {};
  }

  function setupTetrisEvents(container) {
    const chipsContainer = container.querySelector('#npTetrisChips');
    const tetrisNode = container.querySelector('#npTetrisNode');

    // Drag start
    chipsContainer.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('np-tetris-chip')) {
        e.dataTransfer.setData('text/plain', e.target.dataset.value);
        e.target.classList.add('np-chip-dragging');
      }
    });

    chipsContainer.addEventListener('dragend', (e) => {
      e.target.classList.remove('np-chip-dragging');
    });

    // Drop zones
    tetrisNode.querySelectorAll('.np-drop-zone').forEach((zone) => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('np-drop-hover');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('np-drop-hover');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('np-drop-hover');
        const value = e.dataTransfer.getData('text/plain');
        const field = zone.dataset.field;

        zone.textContent = value;
        zone.classList.add('np-drop-filled');
        tetrisPlaced[field] = parseInt(value, 10);

        // Hide the used chip
        const chip = chipsContainer.querySelector(
          `.np-tetris-chip[data-value="${value}"]:not(.np-chip-used)`
        );
        if (chip) chip.classList.add('np-chip-used');
      });

      // Touch support for drop zones
      zone.addEventListener('click', () => {
        // If there's an active touch chip, place it here
        const activeChip = chipsContainer.querySelector(
          '.np-chip-touch-active'
        );
        if (activeChip) {
          const value = activeChip.dataset.value;
          const field = zone.dataset.field;
          zone.textContent = value;
          zone.classList.add('np-drop-filled');
          tetrisPlaced[field] = parseInt(value, 10);
          activeChip.classList.add('np-chip-used');
          activeChip.classList.remove('np-chip-touch-active');
        }
      });
    });

    // Touch support: tap chip to select, tap zone to place
    chipsContainer.addEventListener('click', (e) => {
      if (
        e.target.classList.contains('np-tetris-chip') &&
        !e.target.classList.contains('np-chip-used')
      ) {
        // Deselect others
        chipsContainer
          .querySelectorAll('.np-chip-touch-active')
          .forEach((c) => {
            c.classList.remove('np-chip-touch-active');
          });
        e.target.classList.add('np-chip-touch-active');
      }
    });

    // Check button
    container.querySelector('#npTetrisCheck').addEventListener('click', () => {
      checkTetris(container);
    });

    // Next round
    container.querySelector('#npTetrisNext').addEventListener('click', () => {
      generateTetrisRound();
      renderTetrisRound(container);
      container.querySelector('#npTetrisFeedback').innerHTML = '';
    });
  }

  function checkTetris(container) {
    const sol = tetrisSolution;
    const fields = ['faz', 'fez', 'saz', 'sez', 'gp'];
    let correct = 0;

    container.querySelectorAll('.np-drop-zone').forEach((zone) => {
      const field = zone.dataset.field;
      zone.classList.remove('np-input-correct', 'np-input-wrong');

      if (tetrisPlaced[field] === sol[field]) {
        zone.classList.add('np-input-correct');
        correct++;
      } else {
        zone.classList.add('np-input-wrong');
      }
    });

    const allCorrect = correct === fields.length;
    if (allCorrect) {
      tetrisScore += 10;
    } else {
      tetrisScore = Math.max(
        0,
        tetrisScore + correct - (fields.length - correct)
      );
    }

    container.querySelector('#npTetrisScore').textContent = tetrisScore;

    const feedback = container.querySelector('#npTetrisFeedback');
    feedback.innerHTML = `
      <div class="module-feedback ${allCorrect ? 'module-feedback-success' : 'module-feedback-error'}">
        ${
          allCorrect
            ? '<strong>Perfekt!</strong> Alle Werte korrekt zugeordnet. +10 Punkte!'
            : `<strong>${correct} von ${fields.length} korrekt.</strong> Die richtigen Werte: FAZ=${sol.faz}, FEZ=${sol.fez}, SAZ=${sol.saz}, SEZ=${sol.sez}, GP=${sol.gp}`
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
              <h1 class="page-title">Netzplantechnik</h1>
              <p class="page-subtitle">Vorwaerts-/Rueckwaertsrechnung, Kritischer Pfad, Pufferzeiten</p>
            </div>
          </div>
        </div>

        <div class="module-tabs" id="npTabs">
          <button class="module-tab active" data-tab="explanation">Erklaerung</button>
          <button class="module-tab" data-tab="freemode">Freier Modus</button>
          <button class="module-tab" data-tab="exercises">Aufgaben</button>
          <button class="module-tab" data-tab="tetris">Knoten-Tetris</button>
        </div>

        <div id="npTabContent"></div>
      </div>
    `;

    const tabContent = container.querySelector('#npTabContent');

    // Tab switching
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

    // Render initial tab
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
      case 'tetris':
        renderTetris(tabContent);
        break;
    }
  }

  function cleanup() {
    cleanup_fns.forEach((fn) => {
      fn();
    });
    cleanup_fns = [];
    freeNodes = [];
    freeConnections = [];
    freeNextId = 1;
    freeSelectedNode = null;
    freeConnectMode = false;
    freeConnectSource = null;
    freeDragState = null;
    freeShowCritical = false;
    freeCalcResult = null;
  }

  return { render, cleanup };
})();

export default NetworkPlanView;
