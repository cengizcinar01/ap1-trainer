// ============================================================
// osimodel.js — OSI-Modell Trainer (Standard Design)
// Tabs: Anleitung, Übung, Wissens-Check
// ============================================================

const OSIModelView = (() => {
  let currentTab = 'explanation';
  let currentScenarioIdx = 0;
  let cleanup_fns = [];

  // ============================================================
  // DATA STRUCTURES
  // ============================================================

  const OSI_LAYERS = [
    {
      number: 7,
      name: 'Anwendungsschicht',
      nameEn: 'Application',
      color: '#e74c3c',
      pdu: 'Daten',
      description: 'Schnittstelle für Anwendungen (Browser, Mail).',
      protocols: ['HTTP', 'HTTPS', 'FTP', 'SMTP', 'DNS', 'DHCP'],
      hardware: ['Gateway', 'L7-Firewall'],
    },
    {
      number: 6,
      name: 'Darstellungsschicht',
      nameEn: 'Presentation',
      color: '#e67e22',
      pdu: 'Daten',
      description: 'Datenformate, Verschlüsselung, Komprimierung.',
      protocols: ['TLS', 'SSL', 'ASCII', 'JPEG', 'MPEG'],
      hardware: [],
    },
    {
      number: 5,
      name: 'Sitzungsschicht',
      nameEn: 'Session',
      color: '#f1c40f',
      pdu: 'Daten',
      description: 'Verwaltung von Sitzungen und Dialogen.',
      protocols: ['NetBIOS', 'RPC', 'PPTP', 'SAP'],
      hardware: [],
    },
    {
      number: 4,
      name: 'Transportschicht',
      nameEn: 'Transport',
      color: '#2ecc71',
      pdu: 'Segment',
      description: 'Zuverlässige Ende-zu-Ende Verbindung.',
      protocols: ['TCP', 'UDP'],
      hardware: [],
    },
    {
      number: 3,
      name: 'Vermittlungsschicht',
      nameEn: 'Network',
      color: '#3498db',
      pdu: 'Paket',
      description: 'Logische Adressierung (IP) und Routing.',
      protocols: ['IP', 'ICMP', 'ARP', 'OSPF'],
      hardware: ['Router', 'L3-Switch'],
    },
    {
      number: 2,
      name: 'Sicherungsschicht',
      nameEn: 'Data Link',
      color: '#9b59b6',
      pdu: 'Frame',
      description: 'Physische Adressierung (MAC) und Fehlerprüfung.',
      protocols: ['Ethernet', 'WLAN', 'PPP'],
      hardware: ['Switch', 'Bridge', 'Access Point'],
    },
    {
      number: 1,
      name: 'Bitübertragungsschicht',
      nameEn: 'Physical',
      color: '#1abc9c',
      pdu: 'Bits',
      description: 'Übertragung roher Bits über das Medium.',
      protocols: ['USB', 'Bluetooth', 'DSL'],
      hardware: ['Hub', 'Repeater', 'Modem', 'Kabel'],
    },
  ];

  const SCENARIOS = [
    {
      id: 'puzzle',
      title: 'Schichten-Puzzle',
      description:
        'Bringe die 7 OSI-Schichten in die richtige Reihenfolge (Schicht 7 oben, Schicht 1 unten).',
    },
    {
      id: 'protocols',
      title: 'Protokoll-Zuordnung',
      description:
        'Ordne die Netzwerk-Protokolle den korrekten OSI-Schichten zu.',
    },
    {
      id: 'hardware',
      title: 'Hardware-Zuordnung',
      description:
        'Ordne Netzwerk-Geräte (Router, Switch, etc.) den korrekten OSI-Schichten zu.',
    },
    {
      id: 'exam',
      title: 'ipconfig-Analyse (IHK)',
      description:
        'Benenne die OSI-Schichten und ordne die Begriffe aus der ipconfig-Ausgabe korrekt zu.',
    },
  ];

  const EXAM_DATA = {
    output: [
      { label: 'Physische Adresse', value: '50-1A-C5-F2-38-B7' },
      { label: 'DHCP aktiviert', value: 'Ja' },
      { label: 'Autokonfiguration aktiviert', value: 'Ja' },
      {
        label: 'Verbindungslokale IPv6-Adresse',
        value: 'fe80::521a:c5ff:fef2:38b7%5',
      },
      { label: 'IPv4-Adresse', value: '192.168.0.52' },
      { label: 'Subnetzmaske', value: '255.255.255.0' },
    ],
    terms: [
      'Physische Adresse',
      'DHCP',
      'Verbindungslokale IPv6-Adresse',
      'Buchse mit LED',
    ],
    layers: [
      { num: 7, name: 'Anwendungsschicht', term: 'DHCP' },
      { num: 4, name: 'Transportschicht', term: 'TCP', prefilled: true },
      {
        num: 3,
        name: 'Vermittlungsschicht',
        term: 'Verbindungslokale IPv6-Adresse',
      },
      { num: 2, name: 'Sicherungsschicht', term: 'Physische Adresse' },
      { num: 1, name: 'Bitübertragungsschicht', term: 'Buchse mit LED' },
    ],
  };

  const PROTOCOLS = [
    { name: 'HTTP', layer: 7 },
    { name: 'HTTPS', layer: 7 },
    { name: 'SMTP', layer: 7 },
    { name: 'DNS', layer: 7 },
    { name: 'TLS', layer: 6 },
    { name: 'SSH', layer: 7 },
    { name: 'TCP', layer: 4 },
    { name: 'UDP', layer: 4 },
    { name: 'IP', layer: 3 },
    { name: 'ARP', layer: 3 },
    { name: 'ICMP', layer: 3 },
    { name: 'Ethernet', layer: 2 },
  ];

  const HARDWARE = [
    { name: 'Hub', layer: 1 },
    { name: 'Repeater', layer: 1 },
    { name: 'Switch', layer: 2 },
    { name: 'Bridge', layer: 2 },
    { name: 'Router', layer: 3 },
    { name: 'Access Point', layer: 2 },
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
              <h1 class="page-title">OSI-Modell</h1>
              <p class="page-subtitle">Referenzmodell für Netzwerkprotokolle in 7 Schichten.</p>
            </div>
          </div>
        </div>

        <nav class="module-tabs">
          <button class="module-tab ${currentTab === 'explanation' ? 'active' : ''}" data-tab="explanation">Anleitung</button>
          <button class="module-tab ${currentTab === 'exercise' ? 'active' : ''}" data-tab="exercise">Übung</button>
        </nav>

        <div id="osiContent" class="view-enter"></div>
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
    const content = document.getElementById('osiContent');
    if (!content) return;
    if (currentTab === 'explanation') renderExplanation(content);
    else renderExerciseLayout(content);
  }

  // ============================================================
  // TAB 1: ANLEITUNG
  // ============================================================

  function renderExplanation(container) {
    container.innerHTML = `
      <div class="gantt-explanation view-enter">
        <div class="module-exercise-card">
          <h3 class="comm-section-title">Grundlagen des Schichtenmodells</h3>
          <p class="comm-text">Das OSI-Modell (Open Systems Interconnection) ist ein theoretisches Modell zur Beschreibung der Kommunikation zwischen Systemen.</p>
          
          <div class="osi-tower" style="margin-top: var(--space-6)">
            ${OSI_LAYERS.map(
              (l) => `
              <div class="osi-layer" data-layer="${l.number}">
                <div class="osi-layer-header">
                  <div class="osi-layer-num" style="background: ${l.color}">${l.number}</div>
                  <div class="osi-layer-names">
                    <span class="osi-layer-name-de">${l.name}</span>
                    <span class="osi-layer-name-en">${l.nameEn}</span>
                  </div>
                  <span class="osi-layer-pdu">${l.pdu}</span>
                </div>
                <div class="osi-layer-details">
                  <p class="comm-text" style="font-size: 13px; margin-bottom: var(--space-3);">${l.description}</p>
                  <div class="osi-badge-grid">
                    ${l.protocols.map((p) => `<span class="osi-badge osi-badge-protocol">${p}</span>`).join('')}
                    ${l.hardware.map((h) => `<span class="osi-badge osi-badge-hardware">${h}</span>`).join('')}
                  </div>
                </div>
              </div>
            `
            ).join('')}
          </div>

          <div class="module-feedback" style="margin-top: var(--space-6); background: var(--bg-secondary); border: 1px solid var(--border-color);">
            <strong>Merksatz:</strong> <strong>An</strong>ton <strong>Dar</strong>f <strong>Si</strong>tzen <strong>Tr</strong>inkt <strong>Ver</strong>mutlich <strong>Si</strong>cheres <strong>Bi</strong>er
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.osi-layer').forEach((el) => {
      el.querySelector('.osi-layer-header').addEventListener('click', () => {
        el.classList.toggle('open');
      });
    });
  }

  // ============================================================
  // TAB 2: ÜBUNG (Puzzle & DND)
  // ============================================================

  function renderExerciseLayout(container) {
    const sc = SCENARIOS[currentScenarioIdx];
    container.innerHTML = `
      <div class="module-exercise-card view-enter">
        <div class="scenario-nav">
          <span class="scenario-nav-label">Übungstyp</span>
          <div class="scenario-nav-controls">
            <button class="scenario-nav-btn" id="prevScen" ${currentScenarioIdx === 0 ? 'disabled' : ''}>&larr;</button>
            <span class="scenario-nav-current">${currentScenarioIdx + 1} / ${SCENARIOS.length}</span>
            <button class="scenario-nav-btn" id="nextScen" ${currentScenarioIdx === SCENARIOS.length - 1 ? 'disabled' : ''}>&rarr;</button>
          </div>
        </div>

        <h3 style="margin-bottom: var(--space-2)">${sc.title}</h3>
        <p class="comm-text">${sc.description}</p>

        <div id="exerciseSpecificContent"></div>

        <div class="module-actions" style="margin-top: var(--space-8)">
          <button class="btn btn-primary" id="btnCheckExercise">Lösung prüfen</button>
          <button class="btn" id="btnResetExercise">Löschen</button>
        </div>
        <div id="exerciseFeedback" style="margin-top: var(--space-4);"></div>
      </div>
    `;

    const exContent = container.querySelector('#exerciseSpecificContent');
    if (sc.id === 'puzzle') renderPuzzleInner(exContent);
    else if (sc.id === 'protocols') renderDndInner(exContent, PROTOCOLS);
    else if (sc.id === 'hardware') renderDndInner(exContent, HARDWARE);
    else renderExamInner(exContent);

    setupNav(container);
    setupExerciseEvents(container, sc);
  }

  function renderExamInner(container) {
    container.innerHTML = `
      <div class="osi-terminal view-enter">
        <div class="osi-terminal-header">
          <div class="osi-terminal-dots">
            <span></span><span></span><span></span>
          </div>
          <div class="osi-terminal-title">Windows PowerShell</div>
        </div>
        <div class="osi-terminal-body">
          <div class="osi-terminal-prompt">PS C:\\Users\\IHK-Prüfling> ipconfig /all</div>
          <div class="osi-terminal-content">
            ${EXAM_DATA.output
              .map(
                (line) => `
              <div class="osi-terminal-line">
                <span class="osi-terminal-label">${line.label}</span>
                <span class="osi-terminal-dots"></span>
                <span class="osi-terminal-value">: ${line.value}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
      
      <div class="osi-exam-table">
        <div class="osi-exam-header">
          <span>Layer</span>
          <span>Name der Schicht</span>
          <span>Begriff aus Output</span>
        </div>
        ${EXAM_DATA.layers
          .map((l) => {
            const layerColor =
              OSI_LAYERS.find((ol) => ol.number === l.num)?.color ||
              'var(--bg-tertiary)';
            return `
            <div class="osi-exam-row">
              <div class="osi-exam-num" style="background: ${layerColor}; color: white;">${l.num}</div>
              <div class="osi-exam-col-name">
                ${
                  l.prefilled
                    ? `<div style="padding: var(--space-1) 0; font-weight: 600; color: var(--text-secondary); opacity: 0.7;">${l.name}</div>`
                    : `<input type="text" class="osi-exam-input" data-type="name" data-layer="${l.num}" placeholder="Name eingeben...">`
                }
              </div>
              <div class="osi-exam-col-term">
                ${
                  l.prefilled
                    ? `<div class="pseudo-chip" style="opacity: 0.6; cursor: default; border-style: dotted;">${l.term}</div>`
                    : `<div class="osi-exam-dz osi-drop-zone" data-type="term" data-layer="${l.num}"><div class="dz-content"></div></div>`
                }
              </div>
            </div>
          `;
          })
          .join('')}
      </div>

      <div class="pseudo-chip-pool" style="margin-top: var(--space-8)">
        <div class="pseudo-pool-title">Begriffe zum Zuordnen</div>
        <div class="pseudo-chips-grid" id="chipPool">
          ${[...EXAM_DATA.terms]
            .sort(() => Math.random() - 0.5)
            .map(
              (t, i) => `
            <div class="pseudo-chip" draggable="true" data-term="${t}" data-id="exam-${i}">${t}</div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
    setupDndLogic(container, false); // Reuse existing logic for terms
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

  function renderPuzzleInner(container) {
    const shuffled = [...OSI_LAYERS].sort(() => Math.random() - 0.5);
    container.innerHTML = `
      <div class="osi-puzzle-container" id="puzzleList">
        ${[7, 6, 5, 4, 3, 2, 1].map((num) => `<div class="osi-puzzle-slot" data-expected="${num}"><div class="osi-puzzle-slot-num">${num}</div><div class="slot-content" style="flex:1"></div></div>`).join('')}
      </div>
      <div class="pseudo-chip-pool" style="margin-top: var(--space-6)">
        <div class="pseudo-chips-grid" id="chipPool">
          ${shuffled.map((l) => `<div class="pseudo-chip" draggable="true" data-layer="${l.number}">${l.name}</div>`).join('')}
        </div>
      </div>
    `;
    setupDndLogic(container, true);
  }

  function renderDndInner(container, items) {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    container.innerHTML = `
      <div class="osi-dnd-layout">
        <div class="osi-dnd-source">
          <div class="pseudo-chips-grid" id="chipPool">
            ${shuffled.map((it, i) => `<div class="pseudo-chip" draggable="true" data-layer="${it.layer}" data-id="${i}">${it.name}</div>`).join('')}
          </div>
        </div>
        <div class="osi-dnd-zones">
          ${OSI_LAYERS.filter((l) => [7, 4, 3, 2, 1].includes(l.number))
            .map(
              (l) => `
            <div class="osi-drop-zone" data-layer="${l.number}">
              <span class="osi-dz-title" style="color: ${l.color}">Schicht ${l.number}</span>
              <div class="dz-content"></div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
    setupDndLogic(container, false);
  }

  function setupDndLogic(container, isPuzzle) {
    const chips = container.querySelectorAll('.pseudo-chip');
    const drops = container.querySelectorAll(
      isPuzzle ? '.osi-puzzle-slot' : '.osi-drop-zone'
    );

    chips.forEach((chip) => {
      chip.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', chip.dataset.layer);
        e.dataTransfer.setData('source-id', chip.dataset.id || '');
        chip.classList.add('dragging');
      });
      chip.addEventListener('dragend', () => {
        chip.classList.remove('dragging');
      });
      chip.addEventListener('click', () => {
        if (
          chip.parentElement.classList.contains('dz-content') ||
          chip.parentElement.classList.contains('slot-content')
        ) {
          container.querySelector('#chipPool').appendChild(chip);
          return;
        }
        container.querySelectorAll('.pseudo-chip').forEach((c) => {
          c.style.borderColor = '';
        });
        chip.style.borderColor = 'var(--accent-primary)';
        window.selectedOsiChip = chip;
      });
    });

    drops.forEach((drop) => {
      const target =
        drop.querySelector('.dz-content') ||
        drop.querySelector('.slot-content');
      drop.addEventListener('dragover', (e) => {
        e.preventDefault();
        drop.classList.add('drag-over');
      });
      drop.addEventListener('dragleave', () => {
        drop.classList.remove('drag-over');
      });
      drop.addEventListener('drop', (e) => {
        e.preventDefault();
        drop.classList.remove('drag-over');
        const layer = e.dataTransfer.getData('text/plain');
        const id = e.dataTransfer.getData('source-id');
        const chip = id
          ? container.querySelector(`.pseudo-chip[data-id="${id}"]`)
          : container.querySelector(`.pseudo-chip[data-layer="${layer}"]`);
        if (chip) target.appendChild(chip);
      });
      drop.addEventListener('click', () => {
        if (window.selectedOsiChip) {
          target.appendChild(window.selectedOsiChip);
          window.selectedOsiChip.style.borderColor = '';
          window.selectedOsiChip = null;
        }
      });
    });
  }

  function setupExerciseEvents(container, sc) {
    container
      .querySelector('#btnCheckExercise')
      .addEventListener('click', () => {
        let correct = 0;
        let total = 0;
        if (sc.id === 'puzzle') {
          total = 7;
          container.querySelectorAll('.osi-puzzle-slot').forEach((slot) => {
            const chip = slot.querySelector('.pseudo-chip');
            if (chip) {
              chip.classList.remove('correct', 'wrong');
              if (chip.dataset.layer === slot.dataset.expected) {
                chip.classList.add('correct');
                correct++;
              } else {
                chip.classList.add('wrong');
              }
            }
          });
        } else if (sc.id === 'exam') {
          // Validate Layer Names and Terms
          total = EXAM_DATA.layers.filter((l) => !l.prefilled).length * 2;
          EXAM_DATA.layers.forEach((l) => {
            if (l.prefilled) return;

            // Check Name
            const nameInput = container.querySelector(
              `input[data-layer="${l.num}"]`
            );
            const userLabel = nameInput.value.trim().toLowerCase();
            const layerInfo = OSI_LAYERS.find((ol) => ol.number === l.num);
            const isNameCorrect =
              userLabel === layerInfo.name.toLowerCase() ||
              userLabel === layerInfo.nameEn.toLowerCase();

            if (isNameCorrect) {
              nameInput.style.borderColor = 'var(--success)';
              nameInput.style.color = 'var(--success)';
              correct++;
            } else {
              nameInput.style.borderColor = 'var(--danger)';
              nameInput.style.color = 'var(--danger)';
            }

            // Check Term
            const zone = container.querySelector(
              `.osi-drop-zone[data-layer="${l.num}"]`
            );
            const chip = zone.querySelector('.pseudo-chip');
            if (chip) {
              chip.classList.remove('correct', 'wrong');
              if (chip.dataset.term === l.term) {
                chip.classList.add('correct');
                correct++;
              } else {
                chip.classList.add('wrong');
              }
            }
          });
        } else {
          const chips = container.querySelectorAll('.dz-content .pseudo-chip');
          total = chips.length;
          chips.forEach((chip) => {
            chip.classList.remove('correct', 'wrong');
            if (
              chip.dataset.layer ===
              chip.closest('.osi-drop-zone').dataset.layer
            ) {
              chip.classList.add('correct');
              correct++;
            } else {
              chip.classList.add('wrong');
            }
          });
        }
        const fb = container.querySelector('#exerciseFeedback');
        fb.innerHTML = `<div class="module-feedback ${correct === total && total > 0 ? 'module-feedback-success' : 'module-feedback-error'}">Ergebnis: ${correct} von ${total} korrekt.</div>`;
      });
    container
      .querySelector('#btnResetExercise')
      .addEventListener('click', () => {
        renderCurrentTab();
      });
  }

  function cleanup() {
    cleanup_fns.forEach((fn) => {
      fn();
    });
    cleanup_fns = [];
    window.selectedOsiChip = null;
  }
  return { render, cleanup };
})();

export default OSIModelView;
