// ============================================================
// osimodel.js — OSI-Modell Interactive Learning Module
// Tabs: Übersicht, Puzzle, Protokolle, Hardware, Quiz
// ============================================================

const OSIModelView = (() => {
  let currentTab = 'overview';
  let cleanup_fns = [];

  // ============================================================
  // DATA STRUCTURES
  // ============================================================

  const OSI_LAYERS = [
    { number: 7, name: 'Anwendungsschicht', nameEn: 'Application', color: '#e74c3c', pdu: 'Daten', description: 'Schnittstelle für Anwendungen (Browser, Mail).', protocols: ['HTTP', 'HTTPS', 'FTP', 'SMTP', 'DNS', 'DHCP'], hardware: ['Gateway', 'L7-Firewall'] },
    { number: 6, name: 'Darstellungsschicht', nameEn: 'Presentation', color: '#e67e22', pdu: 'Daten', description: 'Datenformate, Verschlüsselung, Komprimierung.', protocols: ['TLS', 'SSL', 'ASCII', 'JPEG', 'MPEG'], hardware: [] },
    { number: 5, name: 'Sitzungsschicht', nameEn: 'Session', color: '#f1c40f', pdu: 'Daten', description: 'Verwaltung von Sitzungen und Dialogen.', protocols: ['NetBIOS', 'RPC', 'PPTP', 'SAP'], hardware: [] },
    { number: 4, name: 'Transportschicht', nameEn: 'Transport', color: '#2ecc71', pdu: 'Segment', description: 'Zuverlässige Ende-zu-Ende Verbindung.', protocols: ['TCP', 'UDP'], hardware: [] },
    { number: 3, name: 'Vermittlungsschicht', nameEn: 'Network', color: '#3498db', pdu: 'Paket', description: 'Logische Adressierung (IP) und Routing.', protocols: ['IP', 'ICMP', 'ARP', 'OSPF'], hardware: ['Router', 'L3-Switch'] },
    { number: 2, name: 'Sicherungsschicht', nameEn: 'Data Link', color: '#9b59b6', pdu: 'Frame', description: 'Physische Adressierung (MAC) und Fehlerprüfung.', protocols: ['Ethernet', 'WLAN', 'PPP'], hardware: ['Switch', 'Bridge', 'Access Point'] },
    { number: 1, name: 'Bitübertragungsschicht', nameEn: 'Physical', color: '#1abc9c', pdu: 'Bits', description: 'Übertragung roher Bits über das Medium.', protocols: ['USB', 'Bluetooth', 'DSL'], hardware: ['Hub', 'Repeater', 'Modem', 'Kabel'] }
  ];

  const PROTOCOLS = [
    { name: 'HTTP', layer: 7 }, { name: 'HTTPS', layer: 7 }, { name: 'SMTP', layer: 7 },
    { name: 'DNS', layer: 7 }, { name: 'TLS', layer: 6 }, { name: 'SSH', layer: 7 },
    { name: 'TCP', layer: 4 }, { name: 'UDP', layer: 4 }, { name: 'IP', layer: 3 },
    { name: 'ARP', layer: 3 }, { name: 'ICMP', layer: 3 }, { name: 'Ethernet', layer: 2 }
  ];

  const HARDWARE = [
    { name: 'Hub', layer: 1 }, { name: 'Repeater', layer: 1 }, { name: 'Switch', layer: 2 },
    { name: 'Bridge', layer: 2 }, { name: 'Router', layer: 3 }, { name: 'Access Point', layer: 2 }
  ];

  const QUIZ_QUESTIONS = [
    {
      q: 'Welches Gerät arbeitet primär auf Schicht 3 (Vermittlungsschicht)?',
      options: ['Switch', 'Hub', 'Router', 'Repeater'],
      correct: 2,
      explain: 'Router verbinden Netzwerke auf Schicht 3 und nutzen IP-Adressen für das Routing.'
    },
    {
      q: 'Wie heißt die PDU (Protocol Data Unit) auf Schicht 2?',
      options: ['Paket', 'Segment', 'Frame', 'Bits'],
      correct: 2,
      explain: 'Auf der Sicherungsschicht (Layer 2) werden Daten in "Frames" verpackt.'
    },
    {
      q: 'Auf welcher Schicht arbeitet das Protokoll TCP?',
      options: ['Schicht 3', 'Schicht 4', 'Schicht 5', 'Schicht 7'],
      correct: 1,
      explain: 'TCP (und UDP) sind Protokolle der Transportschicht (Layer 4).'
    },
    {
      q: 'Was ist die Hauptaufgabe der Bitübertragungsschicht (Layer 1)?',
      options: ['Routing', 'Fehlerkorrektur', 'Übertragung roher Bits', 'Verschlüsselung'],
      correct: 2,
      explain: 'Schicht 1 definiert die physischen Eigenschaften wie Kabel, Stecker und Signale.'
    },
    {
      q: 'Welches Protokoll ist für die Auflösung von IP-Adressen in MAC-Adressen zuständig?',
      options: ['DNS', 'DHCP', 'ARP', 'ICMP'],
      correct: 2,
      explain: 'ARP (Address Resolution Protocol) arbeitet auf Schicht 3/2, um die Hardware-Adresse zu finden.'
    },
    {
      q: 'Was ist der wesentliche Vorteil von UDP gegenüber TCP?',
      options: ['Hohe Zuverlässigkeit', 'Geringerer Overhead/Schnelligkeit', 'Garantierte Reihenfolge', '3-Wege-Handshake'],
      correct: 1,
      explain: 'UDP verzichtet auf Bestätigungen und ist daher schneller, aber unzuverlässiger als TCP.'
    },
    {
      q: 'Wo findet die logische Adressierung (IP-Adressen) statt?',
      options: ['Sicherungsschicht', 'Vermittlungsschicht', 'Transportschicht', 'Anwendungsschicht'],
      correct: 1,
      explain: 'Die Vermittlungsschicht (Layer 3) ist für die IP-Adressierung und Paketweiterleitung zuständig.'
    },
    {
      q: 'Welche Schicht kümmert sich um die Darstellung von Daten (z.B. Kompression, Verschlüsselung)?',
      options: ['Schicht 5', 'Schicht 6', 'Schicht 7', 'Schicht 4'],
      correct: 1,
      explain: 'Layer 6 (Presentation) bereitet Daten für die Anwendungsebene auf.'
    }
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
              <p class="page-subtitle">Die 7 Schichten der Netzwerkkommunikation verstehen und ordnen.</p>
            </div>
          </div>
        </div>

        <nav class="module-tabs">
          <button class="module-tab ${currentTab === 'overview' ? 'active' : ''}" data-tab="overview">Übersicht</button>
          <button class="module-tab ${currentTab === 'puzzle' ? 'active' : ''}" data-tab="puzzle">Schichten-Puzzle</button>
          <button class="module-tab ${currentTab === 'protocols' ? 'active' : ''}" data-tab="protocols">Protokolle</button>
          <button class="module-tab ${currentTab === 'hardware' ? 'active' : ''}" data-tab="hardware">Hardware</button>
          <button class="module-tab ${currentTab === 'quiz' ? 'active' : ''}" data-tab="quiz">Wissens-Check</button>
        </nav>

        <div id="osiContent" class="view-enter"></div>
      </div>
    `;

    setupTabEvents(container);
    renderCurrentTab();
  }

  function setupTabEvents(container) {
    container.querySelectorAll('.module-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        container.querySelectorAll('.module-tab').forEach(b => { b.classList.remove('active'); });
        btn.classList.add('active');
        renderCurrentTab();
      });
    });
  }

  function renderCurrentTab() {
    const content = document.getElementById('osiContent');
    if (!content) return;

    switch (currentTab) {
      case 'overview': renderOverview(content); break;
      case 'puzzle': renderPuzzle(content); break;
      case 'protocols': renderDnd(content, PROTOCOLS, 'Protokolle'); break;
      case 'hardware': renderDnd(content, HARDWARE, 'Hardware'); break;
      case 'quiz': renderQuiz(content); break;
    }
  }

  // ============================================================
  // TAB 1: OVERVIEW
  // ============================================================

  function renderOverview(container) {
    container.innerHTML = `
      <div class="osi-tower">
        ${OSI_LAYERS.map(l => `
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
              
              <div class="osi-detail-section">
                <div class="osi-detail-label">Protokolle</div>
                <div class="osi-badge-grid">
                  ${l.protocols.map(p => `<span class="osi-badge osi-badge-protocol">${p}</span>`).join('')}
                </div>
              </div>

              ${l.hardware.length ? `
                <div class="osi-detail-section">
                  <div class="osi-detail-label">Hardware / Beispiele</div>
                  <div class="osi-badge-grid">
                    ${l.hardware.map(h => `<span class="osi-badge osi-badge-hardware">${h}</span>`).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="module-feedback" style="margin-top: var(--space-6); background: var(--bg-secondary); border: 1px solid var(--border-color);">
        <strong>Merksatz:</strong> <strong>An</strong>ton <strong>Dar</strong>f <strong>Si</strong>tzen <strong>Tr</strong>inkt <strong>Ver</strong>mutlich <strong>Si</strong>cheres <strong>Bi</strong>er
      </div>
    `;

    // Add click events for accordion
    container.querySelectorAll('.osi-layer').forEach(layerEl => {
      layerEl.querySelector('.osi-layer-header').addEventListener('click', () => {
        layerEl.classList.toggle('open');
      });
    });
  }

  // ============================================================
  // TAB 2: PUZZLE
  // ============================================================

  function renderPuzzle(container) {
    const shuffledLayers = [...OSI_LAYERS].sort(() => Math.random() - 0.5);
    
    container.innerHTML = `
      <div class="module-exercise-card">
        <h3>Schichten-Puzzle</h3>
        <p class="comm-text">Bringe die OSI-Schichten in die richtige Reihenfolge (Schicht 7 oben, Schicht 1 unten).</p>
        
        <div class="osi-puzzle-container" id="puzzleList">
          ${[7, 6, 5, 4, 3, 2, 1].map(num => `
            <div class="osi-puzzle-slot" data-expected="${num}">
              <div class="osi-puzzle-slot-num">${num}</div>
              <div class="slot-content" style="flex: 1; height: 100%;"></div>
            </div>
          `).join('')}
        </div>

        <div class="pseudo-chip-pool" style="margin-top: var(--space-8);">
          <div class="pseudo-pool-title">Verfügbare Schichten</div>
          <div class="pseudo-chips-grid" id="layerPool">
            ${shuffledLayers.map(l => `
              <div class="pseudo-chip" draggable="true" data-layer="${l.number}">${l.name}</div>
            `).join('')}
          </div>
        </div>

        <div class="module-actions">
          <button class="btn btn-primary" id="btnCheckPuzzle">Reihenfolge prüfen</button>
          <button class="btn" id="btnResetPuzzle">Neustarten</button>
        </div>
        <div id="puzzleFeedback"></div>
      </div>
    `;

    setupPuzzleEvents(container);
  }

  function setupPuzzleEvents(container) {
    const chips = container.querySelectorAll('.pseudo-chip');
    const slots = container.querySelectorAll('.osi-puzzle-slot');

    chips.forEach(chip => {
      chip.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', chip.dataset.layer);
        chip.classList.add('dragging');
      });
      chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
      chip.addEventListener('click', () => {
        container.querySelectorAll('.pseudo-chip').forEach(c => c.style.borderColor = '');
        chip.style.borderColor = 'var(--accent-primary)';
        window.selectedLayerChip = chip;
      });
    });

    slots.forEach(slot => {
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        slot.classList.add('drag-over');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        const layerNum = e.dataTransfer.getData('text/plain');
        const chip = container.querySelector(`.pseudo-chip[data-layer="${layerNum}"]`);
        placeInSlot(slot, chip);
      });
      slot.addEventListener('click', () => {
        if (window.selectedLayerChip) {
          placeInSlot(slot, window.selectedLayerChip);
          window.selectedLayerChip.style.borderColor = '';
          window.selectedLayerChip = null;
        } else if (slot.querySelector('.pseudo-chip')) {
          const chip = slot.querySelector('.pseudo-chip');
          container.querySelector('#layerPool').appendChild(chip);
          slot.classList.remove('filled');
        }
      });
    });

    function placeInSlot(slot, chip) {
      if (!chip) return;
      const content = slot.querySelector('.slot-content');
      content.appendChild(chip);
      slot.classList.add('filled');
    }

    container.querySelector('#btnCheckPuzzle').addEventListener('click', () => {
      let correct = 0;
      slots.forEach(slot => {
        const expected = slot.dataset.expected;
        const chip = slot.querySelector('.pseudo-chip');
        if (chip) {
          const actual = chip.dataset.layer;
          chip.classList.remove('correct', 'wrong');
          if (actual === expected) {
            chip.classList.add('correct');
            correct++;
          } else {
            chip.classList.add('wrong');
          }
        }
      });

      const feedback = container.querySelector('#puzzleFeedback');
      if (correct === 7) {
        feedback.innerHTML = `<div class="module-feedback module-feedback-success" style="margin-top: var(--space-4)">
          <strong>Hervorragend!</strong> Alle 7 Schichten sind in der korrekten Reihenfolge.
        </div>`;
      } else {
        feedback.innerHTML = `<div class="module-feedback module-feedback-error" style="margin-top: var(--space-4)">
          <strong>Nicht ganz korrekt.</strong> Du hast ${correct} von 7 Schichten richtig platziert.
        </div>`;
      }
    });

    container.querySelector('#btnResetPuzzle').addEventListener('click', () => {
      renderPuzzle(container);
    });
  }

  // ============================================================
  // TAB 3+4: PROTOCOLS / HARDWARE
  // ============================================================

  function renderDnd(container, items, title) {
    const shuffledItems = [...items].sort(() => Math.random() - 0.5);
    
    container.innerHTML = `
      <div class="module-exercise-card">
        <h3>${title}-Zuordnung</h3>
        <p class="comm-text">Ziehe die Bausteine in die richtige OSI-Schicht.</p>
        
        <div class="osi-dnd-layout">
          <div class="osi-dnd-source">
            <div class="pseudo-pool-title">Bausteine</div>
            <div class="pseudo-chips-grid" id="dndPool">
              ${shuffledItems.map((item, i) => `
                <div class="pseudo-chip" draggable="true" data-layer="${item.layer}" data-id="${i}">${item.name}</div>
              `).join('')}
            </div>
          </div>
          <div class="osi-dnd-zones">
            ${OSI_LAYERS.filter(l => [7, 4, 3, 2, 1].includes(l.number)).map(l => `
              <div class="osi-drop-zone" data-layer="${l.number}">
                <span class="osi-dz-title" style="color: ${l.color}">Schicht ${l.number} (${l.name})</span>
                <div class="dz-content"></div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="module-actions" style="margin-top: var(--space-6);">
          <button class="btn btn-primary" id="btnCheckDnd">Zuordnung prüfen</button>
          <button class="btn" id="btnResetDnd">Neustarten</button>
        </div>
        <div id="dndFeedback"></div>
      </div>
    `;

    setupDndEvents(container);
  }

  function setupDndEvents(container) {
    const chips = container.querySelectorAll('.pseudo-chip');
    const zones = container.querySelectorAll('.osi-drop-zone');

    chips.forEach(chip => {
      chip.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', chip.dataset.id);
        chip.classList.add('dragging');
      });
      chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
      chip.addEventListener('click', () => {
        if (chip.parentElement.classList.contains('dz-content')) {
          container.querySelector('#dndPool').appendChild(chip);
          return;
        }
        container.querySelectorAll('.pseudo-chip').forEach(c => c.style.borderColor = '');
        chip.style.borderColor = 'var(--accent-primary)';
        window.selectedDndChip = chip;
      });
    });

    zones.forEach(zone => {
      zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const id = e.dataTransfer.getData('text/plain');
        const chip = container.querySelector(`.pseudo-chip[data-id="${id}"]`);
        zone.querySelector('.dz-content').appendChild(chip);
      });
      zone.addEventListener('click', () => {
        if (window.selectedDndChip) {
          zone.querySelector('.dz-content').appendChild(window.selectedDndChip);
          window.selectedDndChip.style.borderColor = '';
          window.selectedDndChip = null;
        }
      });
    });

    container.querySelector('#btnCheckDnd').addEventListener('click', () => {
      let correctCount = 0;
      let totalCount = container.querySelectorAll('.dz-content .pseudo-chip').length;
      
      container.querySelectorAll('.dz-content .pseudo-chip').forEach(chip => {
        const actual = chip.dataset.layer;
        const expected = chip.closest('.osi-drop-zone').dataset.layer;
        chip.classList.remove('correct', 'wrong');
        if (actual === expected) {
          chip.classList.add('correct');
          correctCount++;
        } else {
          chip.classList.add('wrong');
        }
      });

      const feedback = container.querySelector('#dndFeedback');
      feedback.innerHTML = `<div class="module-feedback ${correctCount === totalCount ? 'module-feedback-success' : 'module-feedback-error'}" style="margin-top: var(--space-4)">
        <strong>Ergebnis:</strong> ${correctCount} von ${totalCount} korrekt zugeordnet.
      </div>`;
    });

    container.querySelector('#btnResetDnd').addEventListener('click', () => {
      currentTab === 'protocols' ? renderDnd(container, PROTOCOLS, 'Protokolle') : renderDnd(container, HARDWARE, 'Hardware');
    });
  }

  // ============================================================
  // TAB 5: QUIZ
  // ============================================================

  function renderQuiz(container) {
    container.innerHTML = `
      <div class="comm-quiz">
        <div class="comm-quiz-header">
          <div class="comm-quiz-progress">
            <span class="comm-progress-text">Quiz-Fortschritt</span>
            <div class="comm-progress-bar">
              <div class="comm-progress-fill" style="width: 0%"></div>
            </div>
          </div>
          <div class="comm-quiz-score" id="osiQuizScoreDisplay">Score: 0 / ${QUIZ_QUESTIONS.length}</div>
        </div>

        <div id="osiQuizQuestionsList">
          ${QUIZ_QUESTIONS.map((q, i) => `
            <div class="module-exercise-card comm-quiz-card" style="margin-bottom: var(--space-4)" data-idx="${i}">
              <p class="module-exercise-question"><strong>Frage ${i + 1}:</strong> ${q.q}</p>
              <div class="comm-quiz-options">
                ${q.options.map((opt, oi) => `
                  <div class="comm-quiz-option" data-oi="${oi}">
                    ${opt}
                  </div>
                `).join('')}
              </div>
              <div class="quiz-feedback" style="display:none; margin-top: var(--space-4);"></div>
            </div>
          `).join('')}
        </div>

        <div id="osiFinalResultContainer"></div>
      </div>
    `;

    setupQuizEvents(container);
  }

  function setupQuizEvents(container) {
    const cards = container.querySelectorAll('.comm-quiz-card');
    const progressFill = container.querySelector('.comm-progress-fill');
    const scoreDisplay = container.querySelector('#osiQuizScoreDisplay');
    const resultContainer = container.querySelector('#osiFinalResultContainer');
    
    let answeredCount = 0;
    let correctCount = 0;

    cards.forEach(card => {
      const idx = parseInt(card.dataset.idx, 10);
      const question = QUIZ_QUESTIONS[idx];
      const options = card.querySelectorAll('.comm-quiz-option');
      const feedback = card.querySelector('.quiz-feedback');

      options.forEach(opt => {
        opt.addEventListener('click', () => {
          if (card.dataset.answered === 'true') return;

          const selectedIdx = parseInt(opt.dataset.oi, 10);
          card.dataset.answered = 'true';
          card.classList.add('answered');
          answeredCount++;

          const isCorrect = selectedIdx === question.correct;
          if (isCorrect) correctCount++;

          options.forEach((o, i) => {
            if (i === question.correct) {
              o.classList.add('correct');
            } else if (i === selectedIdx) {
              o.classList.add('wrong');
            }
          });

          const progressPct = (answeredCount / QUIZ_QUESTIONS.length) * 100;
          progressFill.style.width = `${progressPct}%`;
          scoreDisplay.textContent = `Score: ${correctCount} / ${QUIZ_QUESTIONS.length}`;

          feedback.style.display = 'block';
          feedback.innerHTML = `
            <div class="module-feedback ${isCorrect ? 'module-feedback-success' : 'module-feedback-error'}">
              <strong>${isCorrect ? 'Richtig!' : 'Falsch.'}</strong> ${question.explain}
            </div>
          `;

          if (answeredCount === QUIZ_QUESTIONS.length) {
            renderFinalResult(resultContainer, correctCount);
          }
        });
      });
    });
  }

  function renderFinalResult(container, score) {
    const pct = (score / QUIZ_QUESTIONS.length) * 100;
    let message = '';
    let icon = '';

    if (pct === 100) { message = 'Hervorragend! Du beherrschst das OSI-Modell perfekt.'; icon = '🏆'; }
    else if (pct >= 75) { message = 'Sehr gut! Die meisten Konzepte sitzen sicher.'; icon = '🌟'; }
    else if (pct >= 50) { message = 'Gut gemacht! Ein paar Details solltest du noch einmal wiederholen.'; icon = '👍'; }
    else { message = 'Schau dir die Schichten und PDUs am besten noch einmal genau an.'; icon = '📚'; }

    container.innerHTML = `
      <div class="module-exercise-card comm-result-card view-enter">
        <div style="font-size: 48px; margin-bottom: var(--space-2)">${icon}</div>
        <h2 class="comm-result-title">Quiz beendet!</h2>
        <div class="comm-result-score">${score} / ${QUIZ_QUESTIONS.length}</div>
        <p class="comm-result-text">${message}</p>
        <button class="btn btn-primary" id="btnRestartOsiQuiz">Wissens-Check neustarten</button>
      </div>
    `;

    container.querySelector('#btnRestartOsiQuiz').addEventListener('click', () => {
      renderQuiz(document.getElementById('osiContent'));
    });
    
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function cleanup() {
    cleanup_fns.forEach(fn => {
      fn();
    });
    cleanup_fns = [];
    window.selectedLayerChip = null;
    window.selectedDndChip = null;
  }

  return { render, cleanup };
})();

export default OSIModelView;
