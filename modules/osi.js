const OSIView = (() => {
  let currentTab = 'explanation';
  let currentExerciseIdx = 0;
  const cleanup_fns = [];
  let sub_cleanup_fns = [];

  let quizScore = 0;
  let quizAnswered = 0;

  const OSI_LAYERS = [
    {
      id: 7,
      name: 'Anwendung',
      desc: 'Schnittstelle zur Software',
      protocols: ['HTTP', 'FTP', 'SMTP', 'DNS', 'SSH'],
      pdu: 'Daten',
      hardware: 'Gateway',
      tcp: 'Anwendung',
    },
    {
      id: 6,
      name: 'Darstellung',
      desc: 'Formatierung & Verschlüsselung',
      protocols: ['JPEG', 'MPEG', 'ASCII', 'TLS/SSL'],
      pdu: 'Daten',
      hardware: 'Gateway',
      tcp: 'Anwendung',
    },
    {
      id: 5,
      name: 'Sitzung',
      desc: 'Dialogsteuerung',
      protocols: ['NetBIOS', 'RPC', 'SQL'],
      pdu: 'Daten',
      hardware: 'Gateway',
      tcp: 'Anwendung',
    },
    {
      id: 4,
      name: 'Transport',
      desc: 'End-zu-End-Kontrolle',
      protocols: ['TCP', 'UDP'],
      pdu: 'Segmente',
      hardware: 'L4-Switch',
      tcp: 'Transport',
    },
    {
      id: 3,
      name: 'Vermittlung',
      desc: 'Routing & Adressierung',
      protocols: ['IP', 'ICMP', 'IPSec', 'BGP'],
      pdu: 'Pakete',
      hardware: 'Router',
      tcp: 'Internet',
    },
    {
      id: 2,
      name: 'Sicherung',
      desc: 'Fehlererkennung & Zugriff',
      protocols: ['Ethernet', 'LLC', 'MAC', 'VLAN'],
      pdu: 'Frames',
      hardware: 'Switch / Bridge',
      tcp: 'Netzzugriff',
    },
    {
      id: 1,
      name: 'Bitübertragung',
      desc: 'Physikalische Signale',
      protocols: ['DSL', '1000Base-T', 'ISDN', 'WiFi'],
      pdu: 'Bits',
      hardware: 'Hub / Repeater / Kabel',
      tcp: 'Netzzugriff',
    },
  ];

  const TCPIP_LAYERS = [
    {name: 'Anwendung'},
    {name: 'Transport'},
    {name: 'Internet'},
    {name: 'Netzzugriff'},
  ];

  const EXERCISES = [
    {
      title: 'Protokolle & Hardware (OSI 7)',
      description:
        'Ordne die Protokolle und Hardware-Komponenten den 7 OSI-Schichten zu.',
      type: 'drag-drop-mixed',
    },
    {
      title: 'PDU-Expertencheck',
      description:
        'Auf welcher Schicht werden Daten zu Frames, Paketen oder Segmenten?',
      type: 'drag-drop-pdu',
    },
    {
      title: 'Kapselungs-Reihenfolge',
      description:
        'Bringe die Schichten in die korrekte Reihenfolge für den Sendeprozess (Top-Down).',
      type: 'sort-layers',
    },
    {
      title: 'TCP/IP 4-Schichten-Modell',
      description:
        'Ordne Protokolle und Hardware den 4 Schichten des TCP/IP-Referenzmodells zu.',
      type: 'tcp-ip-exercise',
    },
  ];

  const QUIZ_QUESTIONS = [
    {
      q: 'Welche Schicht sorgt für das Routing von Paketen durch das Netzwerk?',
      options: ['Schicht 2', 'Schicht 3', 'Schicht 4', 'Schicht 5'],
      correct: 1,
      explain:
        'Die Vermittlungsschicht (Layer 3) ist für die Wegfindung und logische Adressierung (IP) zuständig.',
    },
    {
      q: 'Was ist die korrekte PDU für Schicht 2 (Sicherungsschicht)?',
      options: ['Segmente', 'Pakete', 'Frames', 'Bits'],
      correct: 2,
      explain: 'Auf Schicht 2 werden die Daten in "Frames" (Rahmen) verpackt.',
    },
    {
      q: 'Welche OSI-Schichten werden im TCP/IP-Modell zur "Anwendungsschicht" zusammengefasst?',
      options: ['1, 2, 3', '4, 5, 6', '5, 6, 7', '7, 6, 4'],
      correct: 2,
      explain:
        'Das TCP/IP-Modell fasst Sitzungs-, Darstellungs- und Anwendungsschicht des OSI-Modells zusammen.',
    },
    {
      q: 'Auf welcher Schicht arbeitet ein Access Point oder ein Hub?',
      options: ['Schicht 1', 'Schicht 2', 'Schicht 3', 'Schicht 4'],
      correct: 0,
      explain:
        'Diese Geräte arbeiten rein auf der physikalischen Ebene (Bitübertragung).',
    },
  ];

  // ============================================================
  // CORE RENDER
  // ============================================================

  function render(container) {
    cleanup();

    container.innerHTML = `
      <div class="view-enter osi-module-root">
        <div class="page-header">
          <div class="page-header-left">
            <div>
              <h1 class="page-title">OSI-Referenzmodell</h1>
              <p class="page-subtitle">Interaktives Training zum OSI- und TCP/IP-Stack.</p>
            </div>
          </div>
        </div>
        <nav class="module-tabs">
          <button type="button" class="module-tab ${currentTab === 'explanation' ? 'active' : ''}" data-tab="explanation">Anleitung</button>
          <button type="button" class="module-tab ${currentTab === 'exercise' ? 'active' : ''}" data-tab="exercise">Übung</button>
          <button type="button" class="module-tab ${currentTab === 'quiz' ? 'active' : ''}" data-tab="quiz">Quiz</button>
        </nav>
        <div class="osi-tab-content-wrapper" style="margin-top: var(--space-6);"></div>
      </div>
    `;
    setupTabEvents(container);
    renderCurrentTab(container);
  }

  function setupTabEvents(container) {
    container.querySelectorAll('.module-tab').forEach((btn) => {
      const handler = () => {
        if (currentTab === btn.dataset.tab) return;
        currentTab = btn.dataset.tab;
        container.querySelectorAll('.module-tab').forEach((b) => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        renderCurrentTab(container);
      };
      btn.addEventListener('click', handler);
      cleanup_fns.push(() => btn.removeEventListener('click', handler));
    });
  }

  function renderCurrentTab(root) {
    const content = root.querySelector('.osi-tab-content-wrapper');
    if (!content) return;
    content.innerHTML = '';
    subCleanup();
    switch (currentTab) {
      case 'explanation':
        renderExplanation(content);
        break;
      case 'exercise':
        renderExerciseLayout(content);
        break;
      case 'quiz':
        renderQuiz(content);
        break;
    }
  }

  function renderExplanation(container) {
    const renderLayer = (l) => `
      <div class="osi-stack-layer" data-layer="${l.id}">
        <div class="osi-stack-num">${l.id}</div>
        <div class="osi-stack-info">
          <div class="osi-stack-title">${l.name}</div>
          <div class="osi-stack-desc">${l.desc}</div>
        </div>
        <div class="osi-stack-pdu">${l.pdu}</div>
        <div class="osi-stack-protocols">${l.protocols.map((p) => `<span class="osi-stack-proto-tag">${p}</span>`).join('')}</div>
      </div>
    `;

    container.innerHTML = `
      <div class="module-explanation view-enter">
        <div class="module-exercise-card">
          <h3 class="module-section-title">Theorie-Check</h3>
          <div class="module-info-box">
             <strong>Der Merkspruch (von Schicht 7 zu 1):</strong> <br>
             <em><strong>An</strong>ton <strong>Dar</strong>f <strong>Sitz</strong>en <strong>Tr</strong>inkt <strong>Verm</strong>utlich <strong>Sicher</strong>es <strong>Bi</strong>er</em>
          </div>
        </div>
        <div class="osi-explanation-stack" style="margin-top: 0">
          <div class="osi-stack-group-label">Anwendungsschichten</div>
          ${OSI_LAYERS.filter((l) => l.id >= 5)
            .map(renderLayer)
            .join('')}
          <div class="osi-stack-group-label" style="margin-top: var(--space-4);">Transportschichten</div>
          ${OSI_LAYERS.filter((l) => l.id < 5)
            .map(renderLayer)
            .join('')}
        </div>
      </div>
    `;
  }

  // ============================================================
  // TAB: ÜBUNG
  // ============================================================

  function renderExerciseLayout(container) {
    subCleanup();
    container.innerHTML = `
      <div class="scenario-nav">
        <span class="scenario-nav-label">Übungswahl</span>
        <div class="scenario-nav-controls">
          <button type="button" class="scenario-nav-btn" id="osiPrevEx" ${currentExerciseIdx === 0 ? 'disabled' : ''}>&larr;</button>
          <span class="scenario-nav-current">${currentExerciseIdx + 1} / ${EXERCISES.length}</span>
          <button type="button" class="scenario-nav-btn" id="osiNextEx" ${currentExerciseIdx === EXERCISES.length - 1 ? 'disabled' : ''}>&rarr;</button>
        </div>
      </div>
      <div id="osiExerciseActiveArea" class="view-enter" style="margin-top: var(--space-6);"></div>
    `;

    const prev = container.querySelector('#osiPrevEx');
    const next = container.querySelector('#osiNextEx');

    const hPrev = () => {
      if (currentExerciseIdx > 0) {
        currentExerciseIdx--;
        renderExerciseLayout(container);
      }
    };
    const hNext = () => {
      if (currentExerciseIdx < EXERCISES.length - 1) {
        currentExerciseIdx++;
        renderExerciseLayout(container);
      }
    };

    prev?.addEventListener('click', hPrev);
    next?.addEventListener('click', hNext);
    sub_cleanup_fns.push(() => {
      prev?.removeEventListener('click', hPrev);
      next?.removeEventListener('click', hNext);
    });

    renderCurrentExercise(container.querySelector('#osiExerciseActiveArea'));
  }

  function renderCurrentExercise(target) {
    const ex = EXERCISES[currentExerciseIdx];
    target.innerHTML = `
      <div class="module-exercise-card">
        <div class="module-exercise-header"><span class="module-exercise-badge">${ex.title}</span></div>
        <p class="module-text" style="margin-bottom: var(--space-6);">${ex.description}</p>
        <div class="exercise-specific-content"></div>
        <div class="module-feedback" id="osiExFeedback" style="display:none; margin-top: var(--space-6);"></div>
        <div class="module-actions" style="margin-top: var(--space-8)">
          <button type="button" class="btn btn-primary" id="btnOsiResetEx">Zurücksetzen</button>
        </div>
      </div>
    `;

    const specArea = target.querySelector('.exercise-specific-content');
    const resetBtn = target.querySelector('#btnOsiResetEx');
    const hReset = () => renderCurrentExercise(target);
    resetBtn.addEventListener('click', hReset);
    sub_cleanup_fns.push(() => resetBtn.removeEventListener('click', hReset));

    if (ex.type === 'drag-drop-mixed') renderMixedExercise(specArea);
    else if (ex.type === 'drag-drop-pdu') renderPDUExercise(specArea);
    else if (ex.type === 'sort-layers') renderSortExercise(specArea);
    else if (ex.type === 'tcp-ip-exercise') renderTCPIPExercise(specArea);
  }

  function setupDragDropListeners(container, total, mode) {
    let score = 0;
    const feedback = container
      .closest('.module-exercise-card')
      .querySelector('#osiExFeedback');
    const scoreVal = container.querySelector('.osi-score-val');

    container.querySelectorAll('.osi-drag-item').forEach((d) => {
      const onStart = () => d.classList.add('dragging');
      const onEnd = () => d.classList.remove('dragging');
      d.addEventListener('dragstart', onStart);
      d.addEventListener('dragend', onEnd);
      sub_cleanup_fns.push(() => {
        d.removeEventListener('dragstart', onStart);
        d.removeEventListener('dragend', onEnd);
      });
    });

    container.querySelectorAll('.osi-drop-zone').forEach((zone) => {
      const onOver = (e) => {
        e.preventDefault();
        zone.classList.add('hover');
      };
      const onLeave = () => zone.classList.remove('hover');
      const onDrop = (e) => {
        e.preventDefault();
        zone.classList.remove('hover');
        const draggingEl = container.querySelector('.dragging');
        if (!draggingEl) return;

        let isCorrect = false;
        if (mode === 'osi') {
          isCorrect = draggingEl.dataset.layer === zone.dataset.layer;
        } else if (mode === 'tcp') {
          isCorrect = draggingEl.dataset.target === zone.dataset.layerName;
        }

        if (isCorrect) {
          if (mode === 'osi') {
            const lData = OSI_LAYERS.find(
              (l) => l.id === parseInt(draggingEl.dataset.layer, 10),
            );
            zone.querySelector('.osi-zone-label').innerText =
              `L${lData.id}: ${lData.name}`;
          }
          zone.querySelector('.osi-zone-content').appendChild(draggingEl);
          draggingEl.classList.add('correct');
          draggingEl.setAttribute('draggable', 'false');
          score++;
          if (scoreVal) scoreVal.innerText = score;
          if (score === total)
            showFeedbackLocal(feedback, true, 'Hervorragend gelöst!');
        } else {
          showFeedbackLocal(feedback, false, 'Das ist leider nicht korrekt.');
          setTimeout(() => {
            if (feedback) feedback.style.display = 'none';
          }, 1500);
        }
      };
      zone.addEventListener('dragover', onOver);
      zone.addEventListener('dragleave', onLeave);
      zone.addEventListener('drop', onDrop);
      sub_cleanup_fns.push(() => {
        zone.removeEventListener('dragover', onOver);
        zone.removeEventListener('dragleave', onLeave);
        zone.removeEventListener('drop', onDrop);
      });
    });
  }

  function renderMixedExercise(container) {
    const items = OSI_LAYERS.flatMap((l) => [
      {text: l.protocols[0], layer: l.id, type: 'prot.'},
      {text: l.hardware.split(' / ')[0], layer: l.id, type: 'hw.'},
    ])
      .sort(() => 0.5 - Math.random())
      .slice(0, 8);

    container.innerHTML = `
      <div style="font-weight:600; margin-bottom: var(--space-4);">Score: <span class="osi-score-val">0</span> / ${items.length}</div>
      <div class="osi-game-container">
        <div class="osi-drop-zones">
          ${OSI_LAYERS.map((l) => `<div class="osi-drop-zone" data-layer="${l.id}"><span class="osi-zone-label">?</span><div class="osi-zone-content"></div></div>`).join('')}
        </div>
        <div class="osi-drag-items">
          ${items.map((it) => `<div class="osi-drag-item" draggable="true" data-layer="${it.layer}"><small>${it.type}</small>${it.text}</div>`).join('')}
        </div>
      </div>
    `;
    setupDragDropListeners(container, items.length, 'osi');
  }

  function renderPDUExercise(container) {
    const items = OSI_LAYERS.map((l) => ({text: l.pdu, layer: l.id})).sort(
      () => 0.5 - Math.random(),
    );
    container.innerHTML = `
      <div style="font-weight:600; margin-bottom: var(--space-4);">Fortschritt: <span class="osi-score-val">0</span> / ${items.length}</div>
      <div class="osi-game-container">
        <div class="osi-drop-zones">
          ${OSI_LAYERS.map((l) => `<div class="osi-drop-zone" data-layer="${l.id}"><span class="osi-zone-label">?</span><div class="osi-zone-content"></div></div>`).join('')}
        </div>
        <div class="osi-drag-items">
          ${items.map((it) => `<div class="osi-drag-item" draggable="true" data-layer="${it.layer}">${it.text}</div>`).join('')}
        </div>
      </div>
    `;
    setupDragDropListeners(container, items.length, 'osi');
  }

  function renderSortExercise(container) {
    const shuffled = [...OSI_LAYERS].sort(() => 0.5 - Math.random());
    const feedback = container
      .closest('.module-exercise-card')
      .querySelector('#osiExFeedback');

    container.innerHTML = `
      <p class="module-exercise-sublabel" style="margin-bottom: var(--space-4);">Sortiere die Schichten (Anwendung ganz oben):</p>
      <div class="osi-sort-list" style="display: flex; flex-direction: column; gap: var(--space-2);">
        ${shuffled.map((l) => `<div class="osi-drag-item sortable-node" draggable="true" data-layer="${l.id}" style="width:100%">${l.name}</div>`).join('')}
      </div>
      <button type="button" class="btn btn-primary" id="btnCheckOsiSort" style="margin-top: var(--space-6);">Reihenfolge prüfen</button>
    `;

    const list = container.querySelector('.osi-sort-list');
    const checkBtn = container.querySelector('#btnCheckOsiSort');

    const hOver = (e) => {
      e.preventDefault();
      const after = getDragAfterElement(list, e.clientY);
      const dragging = container.querySelector('.dragging');
      if (!dragging) return;
      if (!after) list.appendChild(dragging);
      else list.insertBefore(dragging, after);
    };
    list.addEventListener('dragover', hOver);

    container.querySelectorAll('.sortable-node').forEach((n) => {
      n.addEventListener('dragstart', () => n.classList.add('dragging'));
      n.addEventListener('dragend', () => n.classList.remove('dragging'));
    });

    const hCheck = () => {
      const order = [...list.querySelectorAll('.sortable-node')].map((n) =>
        parseInt(n.dataset.layer, 10),
      );
      const correct = [7, 6, 5, 4, 3, 2, 1];
      const isCorrect = JSON.stringify(order) === JSON.stringify(correct);
      if (isCorrect) {
        list.querySelectorAll('.sortable-node').forEach((n) => {
          const l = OSI_LAYERS.find(
            (x) => x.id === parseInt(n.dataset.layer, 10),
          );
          n.innerText = `${l.id}: ${l.name}`;
          n.classList.add('correct');
        });
      }
      showFeedbackLocal(
        feedback,
        isCorrect,
        isCorrect ? 'Korrekt!' : 'Falsche Reihenfolge.',
      );
    };
    checkBtn.addEventListener('click', hCheck);
    sub_cleanup_fns.push(() => {
      list.removeEventListener('dragover', hOver);
      checkBtn.removeEventListener('click', hCheck);
    });
  }

  function renderTCPIPExercise(container) {
    const items = [
      {text: 'HTTP/HTTPS', target: 'Anwendung', type: 'prot.'},
      {text: 'TCP/UDP', target: 'Transport', type: 'prot.'},
      {text: 'IP / ICMP', target: 'Internet', type: 'prot.'},
      {text: 'Ethernet / DSL', target: 'Netzzugriff', type: 'prot.'},
      {text: 'Router', target: 'Internet', type: 'hw.'},
      {text: 'Switch', target: 'Netzzugriff', type: 'hw.'},
      {text: 'Webbrowser', target: 'Anwendung', type: 'app'},
      {text: 'Netzwerkkabel', target: 'Netzzugriff', type: 'hw.'},
    ].sort(() => 0.5 - Math.random());

    container.innerHTML = `
      <div style="font-weight:600; margin-bottom: var(--space-4);">Punkte: <span class="osi-score-val">0</span> / ${items.length}</div>
      <div class="osi-game-container">
        <div class="osi-drop-zones">
          ${TCPIP_LAYERS.map((l) => `<div class="osi-drop-zone" data-layer-name="${l.name}"><span class="osi-zone-label">${l.name}</span><div class="osi-zone-content"></div></div>`).join('')}
        </div>
        <div class="osi-drag-items">
          ${items.map((it) => `<div class="osi-drag-item" draggable="true" data-target="${it.target}"><small>${it.type}</small>${it.text}</div>`).join('')}
        </div>
      </div>
    `;
    setupDragDropListeners(container, items.length, 'tcp');
  }

  // ============================================================
  // TAB: QUIZ
  // ============================================================

  function renderQuiz(container) {
    quizScore = 0;
    quizAnswered = 0;
    container.innerHTML = `
      <div class="module-quiz view-enter">
        <div class="module-quiz-header" style="margin-bottom: var(--space-6);">
          <div class="module-quiz-progress">
            <span class="module-quiz-progress-text">Quiz-Fortschritt</span>
            <div class="module-quiz-progress-bar"><div class="module-quiz-progress-fill" style="width: 0%"></div></div>
          </div>
          <span class="module-quiz-score">0 / ${QUIZ_QUESTIONS.length}</span>
        </div>
        ${QUIZ_QUESTIONS.map(
          (q, i) => `
          <div class="module-exercise-card quiz-card" data-idx="${i}" style="margin-bottom: var(--space-6);">
            <p class="module-exercise-question"><strong>Frage ${i + 1}:</strong> ${q.q}</p>
            <div class="module-quiz-options" style="margin-top: var(--space-4);">
              ${q.options.map((opt, oi) => `<div class="module-quiz-option" data-qi="${i}" data-oi="${oi}">${opt}</div>`).join('')}
            </div>
            <div class="module-quiz-explanation" style="display:none; margin-top: var(--space-4); padding: var(--space-3); background: var(--surface-hover); border-radius: var(--radius-sm); font-size: 0.9rem;"></div>
          </div>
        `,
        ).join('')}
        <div id="osiQuizFinal" style="margin-top: var(--space-8);"></div>
      </div>
    `;
    container.querySelectorAll('.module-quiz-option').forEach((opt) => {
      const h = () => {
        const card = opt.closest('.quiz-card');
        if (card.classList.contains('answered')) return;
        card.classList.add('answered');
        quizAnswered++;
        const qi = parseInt(opt.dataset.qi, 10);
        const oi = parseInt(opt.dataset.oi, 10);
        const isCorrect = oi === QUIZ_QUESTIONS[qi].correct;
        if (isCorrect) quizScore++;
        opt.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect)
          card
            .querySelectorAll('.module-quiz-option')
            [QUIZ_QUESTIONS[qi].correct].classList.add('correct');
        const expl = card.querySelector('.module-quiz-explanation');
        expl.style.display = 'block';
        expl.innerHTML = `<strong>${isCorrect ? 'Korrekt!' : 'Falsch.'}</strong> ${QUIZ_QUESTIONS[qi].explain}`;
        container.querySelector('.module-quiz-progress-fill').style.width =
          `${(quizAnswered / QUIZ_QUESTIONS.length) * 100}%`;
        container.querySelector('.module-quiz-score').innerText =
          `${quizScore} / ${QUIZ_QUESTIONS.length}`;
        if (quizAnswered === QUIZ_QUESTIONS.length) showQuizResult(container);
      };
      opt.addEventListener('click', h);
      sub_cleanup_fns.push(() => opt.removeEventListener('click', h));
    });
  }

  function showQuizResult(root) {
    const pct = Math.round((quizScore / QUIZ_QUESTIONS.length) * 100);
    const target = root.querySelector('#osiQuizFinal');
    target.innerHTML = `
      <div class="module-exercise-card view-enter" style="text-align:center; padding: var(--space-8);">
        <h2 class="module-quiz-result-title">Ergebnis</h2>
        <div class="module-quiz-result-score" style="font-size:3rem; font-weight:800; color:var(--brand-primary);">${pct}%</div>
        <button type="button" class="btn btn-primary" id="btnRestartOsiQuiz" style="margin-top:var(--space-6);">Nochmal</button>
      </div>
    `;
    const h = () => renderQuiz(root);
    target.querySelector('#btnRestartOsiQuiz').addEventListener('click', h);
    sub_cleanup_fns.push(() =>
      target
        .querySelector('#btnRestartOsiQuiz')
        ?.removeEventListener('click', h),
    );
  }

  function showFeedbackLocal(el, success, msg) {
    if (!el) return;
    el.style.display = 'block';
    el.className = `module-feedback ${success ? 'module-feedback-success' : 'module-feedback-error'}`;
    el.innerHTML = `<strong>${success ? 'Richtig!' : 'Leider nicht.'}</strong> ${msg}`;
  }

  function getDragAfterElement(container, y) {
    const draggables = [
      ...container.querySelectorAll('.sortable-node:not(.dragging)'),
    ];
    return draggables.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset)
          return {offset, element: child};
        return closest;
      },
      {offset: Number.NEGATIVE_INFINITY},
    ).element;
  }

  function subCleanup() {
    sub_cleanup_fns.forEach((fn) => {
      fn();
    });
    sub_cleanup_fns = [];
  }
  function cleanup() {
    subCleanup();
    cleanup_fns.forEach((fn) => {
      fn();
    });
  }

  return {render, cleanup};
})();

export default OSIView;
