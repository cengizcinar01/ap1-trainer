// ============================================================
// netzplan.js — Netzplantechnik-Board (Modul 2)
// Interactive network planning with draggable nodes, SVG arrows,
// forward/backward pass, critical path, and buffer times.
// IHK-standard node layout: FAZ|D|FEZ / Name / SAZ|GP|SEZ / FP
// ============================================================

const NetzplanView = (() => {
  let currentExercise = null;
  let currentTab = 'exercise';
  let nodePositions = {};
  let dragState = null;
  let boundMouseMove = null;
  let boundMouseUp = null;
  let boundTouchMove = null;
  let boundTouchEnd = null;

  const NODE_W = 180;
  const NODE_H = 116;
  const H_GAP = 100;
  const V_GAP = 50;
  const PAD = 40;

  // ---- Predefined Exercises ----

  const EXERCISES = {
    easy: [
      {
        title: 'Einfacher Projektablauf',
        description: 'Ein kleines IT-Projekt mit 5 Vorgaengen.',
        activities: [
          { id: 'A', name: 'Anforderungen', duration: 3, predecessors: [] },
          { id: 'B', name: 'Design', duration: 4, predecessors: ['A'] },
          { id: 'C', name: 'Datenbank', duration: 2, predecessors: ['A'] },
          { id: 'D', name: 'Entwicklung', duration: 5, predecessors: ['B', 'C'] },
          { id: 'E', name: 'Test', duration: 3, predecessors: ['D'] },
        ],
      },
      {
        title: 'Netzwerk-Installation',
        description: 'Installation eines Firmennetzwerks.',
        activities: [
          { id: 'A', name: 'Planung', duration: 2, predecessors: [] },
          { id: 'B', name: 'Kabel verlegen', duration: 5, predecessors: ['A'] },
          { id: 'C', name: 'HW bestellen', duration: 3, predecessors: ['A'] },
          { id: 'D', name: 'Installation', duration: 4, predecessors: ['B', 'C'] },
          { id: 'E', name: 'Konfiguration', duration: 2, predecessors: ['D'] },
        ],
      },
    ],
    medium: [
      {
        title: 'Webshop-Projekt',
        description: 'Entwicklung eines Online-Shops mit parallelen Arbeitspaketen.',
        activities: [
          { id: 'A', name: 'Konzept', duration: 3, predecessors: [] },
          { id: 'B', name: 'Frontend', duration: 6, predecessors: ['A'] },
          { id: 'C', name: 'Backend', duration: 5, predecessors: ['A'] },
          { id: 'D', name: 'Datenbank', duration: 3, predecessors: ['A'] },
          { id: 'E', name: 'API', duration: 4, predecessors: ['C', 'D'] },
          { id: 'F', name: 'Integration', duration: 3, predecessors: ['B', 'E'] },
          { id: 'G', name: 'Test', duration: 4, predecessors: ['F'] },
        ],
      },
      {
        title: 'Serverraum-Modernisierung',
        description: 'Modernisierung der Server-Infrastruktur.',
        activities: [
          { id: 'A', name: 'Bestandsaufn.', duration: 2, predecessors: [] },
          { id: 'B', name: 'HW beschaffen', duration: 5, predecessors: ['A'] },
          { id: 'C', name: 'Klimaanlage', duration: 4, predecessors: ['A'] },
          { id: 'D', name: 'Verkabelung', duration: 3, predecessors: ['C'] },
          { id: 'E', name: 'Server aufbau', duration: 4, predecessors: ['B', 'D'] },
          { id: 'F', name: 'Migration', duration: 6, predecessors: ['E'] },
          { id: 'G', name: 'Abnahme', duration: 2, predecessors: ['F'] },
        ],
      },
    ],
    hard: [
      {
        title: 'ERP-Einfuehrung',
        description: 'Komplexes ERP-Einfuehrungsprojekt mit vielen Abhaengigkeiten.',
        activities: [
          { id: 'A', name: 'Kickoff', duration: 1, predecessors: [] },
          { id: 'B', name: 'Ist-Analyse', duration: 4, predecessors: ['A'] },
          { id: 'C', name: 'Soll-Konzept', duration: 3, predecessors: ['B'] },
          { id: 'D', name: 'Customizing', duration: 6, predecessors: ['C'] },
          { id: 'E', name: 'Schnittstellen', duration: 5, predecessors: ['C'] },
          { id: 'F', name: 'Datenmigration', duration: 4, predecessors: ['C'] },
          { id: 'G', name: 'Schulung', duration: 3, predecessors: ['D'] },
          { id: 'H', name: 'Integr.-Test', duration: 4, predecessors: ['D', 'E', 'F'] },
          { id: 'I', name: 'Go-Live', duration: 2, predecessors: ['G', 'H'] },
        ],
      },
      {
        title: 'App-Entwicklung',
        description: 'Mobile-App-Entwicklung mit parallelen Streams.',
        activities: [
          { id: 'A', name: 'Anforderungen', duration: 2, predecessors: [] },
          { id: 'B', name: 'UI-Design', duration: 4, predecessors: ['A'] },
          { id: 'C', name: 'Architektur', duration: 3, predecessors: ['A'] },
          { id: 'D', name: 'iOS-App', duration: 7, predecessors: ['B', 'C'] },
          { id: 'E', name: 'Android-App', duration: 6, predecessors: ['B', 'C'] },
          { id: 'F', name: 'Backend-API', duration: 5, predecessors: ['C'] },
          { id: 'G', name: 'iOS-Test', duration: 3, predecessors: ['D', 'F'] },
          { id: 'H', name: 'Android-Test', duration: 3, predecessors: ['E', 'F'] },
          { id: 'I', name: 'Release', duration: 2, predecessors: ['G', 'H'] },
        ],
      },
    ],
  };

  // ---- Netzplan Calculation Engine ----

  function calculateNetzplan(activities) {
    const acts = activities.map(a => ({
      ...a, faz: 0, fez: 0, saz: 0, sez: 0, gp: 0, fp: 0,
    }));
    const byId = {};
    acts.forEach(a => { byId[a.id] = a; });

    acts.forEach(a => { a.successors = []; });
    acts.forEach(a => {
      a.predecessors.forEach(pId => {
        if (byId[pId]) byId[pId].successors.push(a.id);
      });
    });

    const sorted = topologicalSort(acts, byId);

    // Forward pass
    for (const a of sorted) {
      a.faz = a.predecessors.length === 0 ? 0 : Math.max(...a.predecessors.map(p => byId[p].fez));
      a.fez = a.faz + a.duration;
    }

    const projectDuration = Math.max(...acts.map(a => a.fez));

    // Backward pass
    for (let i = sorted.length - 1; i >= 0; i--) {
      const a = sorted[i];
      a.sez = a.successors.length === 0 ? projectDuration : Math.min(...a.successors.map(s => byId[s].saz));
      a.saz = a.sez - a.duration;
    }

    // Buffer times
    for (const a of acts) {
      a.gp = a.saz - a.faz;
      a.fp = a.successors.length === 0 ? 0 : Math.min(...a.successors.map(s => byId[s].faz)) - a.fez;
    }

    const criticalPath = acts.filter(a => a.gp === 0).map(a => a.id);
    return { activities: acts, projectDuration, criticalPath, byId };
  }

  function topologicalSort(acts, byId) {
    const visited = new Set();
    const result = [];
    function visit(a) {
      if (visited.has(a.id)) return;
      for (const pId of a.predecessors) { if (byId[pId]) visit(byId[pId]); }
      visited.add(a.id);
      result.push(a);
    }
    for (const a of acts) visit(a);
    return result;
  }

  // ---- Auto-Layout ----

  function calculateLayout(activities, byId) {
    const levels = {};
    function getLevel(id) {
      if (levels[id] !== undefined) return levels[id];
      const a = byId[id];
      if (!a || a.predecessors.length === 0) { levels[id] = 0; return 0; }
      const maxPred = Math.max(...a.predecessors.map(p => getLevel(p)));
      levels[id] = maxPred + 1;
      return levels[id];
    }
    activities.forEach(a => getLevel(a.id));

    // Group by level
    const levelGroups = {};
    let maxLevel = 0;
    activities.forEach(a => {
      const lvl = levels[a.id];
      if (!levelGroups[lvl]) levelGroups[lvl] = [];
      levelGroups[lvl].push(a.id);
      if (lvl > maxLevel) maxLevel = lvl;
    });

    // Position nodes
    const positions = {};
    for (let lvl = 0; lvl <= maxLevel; lvl++) {
      const group = levelGroups[lvl] || [];
      const x = PAD + lvl * (NODE_W + H_GAP);
      group.forEach((id, i) => {
        const totalH = group.length * NODE_H + (group.length - 1) * V_GAP;
        const startY = PAD + Math.max(0, (3 * (NODE_H + V_GAP) - totalH) / 2);
        positions[id] = { x, y: startY + i * (NODE_H + V_GAP) };
      });
    }

    const canvasW = PAD * 2 + (maxLevel + 1) * NODE_W + maxLevel * H_GAP;
    const maxPerLevel = Math.max(...Object.values(levelGroups).map(g => g.length));
    const canvasH = PAD * 2 + maxPerLevel * NODE_H + (maxPerLevel - 1) * V_GAP;

    return { positions, canvasW, canvasH };
  }

  // ---- SVG Arrows ----

  function drawArrows(canvasEl, activities, positions, criticalPath) {
    let svgEl = canvasEl.querySelector('.np-arrows-svg');
    if (!svgEl) {
      svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgEl.classList.add('np-arrows-svg');
      svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      canvasEl.prepend(svgEl);
    }

    svgEl.style.width = canvasEl.style.width;
    svgEl.style.height = canvasEl.style.height;
    svgEl.setAttribute('viewBox', `0 0 ${parseInt(canvasEl.style.width)} ${(parseInt(canvasEl.style.height))}`);

    // Build critical edges set
    const critSet = new Set(criticalPath);

    let paths = '';
    // Arrowhead marker
    paths += `<defs>
      <marker id="arrowNormal" viewBox="0 0 10 7" refX="10" refY="3.5"
        markerWidth="8" markerHeight="6" orient="auto-start-reverse">
        <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-tertiary)"/>
      </marker>
      <marker id="arrowCrit" viewBox="0 0 10 7" refX="10" refY="3.5"
        markerWidth="8" markerHeight="6" orient="auto-start-reverse">
        <polygon points="0 0, 10 3.5, 0 7" fill="var(--danger)"/>
      </marker>
    </defs>`;

    activities.forEach(a => {
      if (!positions[a.id]) return;
      a.predecessors.forEach(pId => {
        if (!positions[pId]) return;
        const from = positions[pId];
        const to = positions[a.id];

        const x1 = from.x + NODE_W;
        const y1 = from.y + NODE_H / 2;
        const x2 = to.x;
        const y2 = to.y + NODE_H / 2;
        const dx = (x2 - x1) * 0.4;

        const isCrit = critSet.has(pId) && critSet.has(a.id);
        const color = isCrit ? 'var(--danger)' : 'var(--text-tertiary)';
        const marker = isCrit ? 'url(#arrowCrit)' : 'url(#arrowNormal)';
        const strokeW = isCrit ? 2.5 : 1.5;

        paths += `<path d="M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}"
          fill="none" stroke="${color}" stroke-width="${strokeW}"
          marker-end="${marker}" />`;
      });
    });

    svgEl.innerHTML = paths;
  }

  // ---- Drag & Drop ----

  function initDrag(canvasEl, activities) {
    cleanupDrag();

    boundMouseMove = (e) => onDragMove(e, canvasEl, activities);
    boundMouseUp = () => onDragEnd(canvasEl, activities);
    boundTouchMove = (e) => onTouchDragMove(e, canvasEl, activities);
    boundTouchEnd = () => onDragEnd(canvasEl, activities);

    document.addEventListener('mousemove', boundMouseMove);
    document.addEventListener('mouseup', boundMouseUp);
    document.addEventListener('touchmove', boundTouchMove, { passive: false });
    document.addEventListener('touchend', boundTouchEnd);

    canvasEl.querySelectorAll('.np-node').forEach(node => {
      node.addEventListener('mousedown', (e) => onDragStart(e, node, canvasEl));
      node.addEventListener('touchstart', (e) => onTouchDragStart(e, node, canvasEl), { passive: false });
    });
  }

  function onDragStart(e, node, canvasEl) {
    if (e.target.tagName === 'INPUT') return;
    e.preventDefault();
    const id = node.dataset.id;
    const rect = canvasEl.getBoundingClientRect();
    dragState = {
      id,
      offsetX: e.clientX - (nodePositions[id]?.x || 0) - rect.left + canvasEl.scrollLeft,
      offsetY: e.clientY - (nodePositions[id]?.y || 0) - rect.top + canvasEl.scrollTop,
    };
    node.classList.add('np-node-dragging');
  }

  function onTouchDragStart(e, node, canvasEl) {
    if (e.target.tagName === 'INPUT') return;
    const touch = e.touches[0];
    const id = node.dataset.id;
    const rect = canvasEl.getBoundingClientRect();
    dragState = {
      id,
      offsetX: touch.clientX - (nodePositions[id]?.x || 0) - rect.left + canvasEl.scrollLeft,
      offsetY: touch.clientY - (nodePositions[id]?.y || 0) - rect.top + canvasEl.scrollTop,
    };
    node.classList.add('np-node-dragging');
  }

  function onDragMove(e, canvasEl, activities) {
    if (!dragState) return;
    const rect = canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left + canvasEl.scrollLeft - dragState.offsetX;
    const y = e.clientY - rect.top + canvasEl.scrollTop - dragState.offsetY;
    moveNode(dragState.id, x, y, canvasEl, activities);
  }

  function onTouchDragMove(e, canvasEl, activities) {
    if (!dragState) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasEl.getBoundingClientRect();
    const x = touch.clientX - rect.left + canvasEl.scrollLeft - dragState.offsetX;
    const y = touch.clientY - rect.top + canvasEl.scrollTop - dragState.offsetY;
    moveNode(dragState.id, x, y, canvasEl, activities);
  }

  function moveNode(id, x, y, canvasEl, activities) {
    const clampedX = Math.max(0, x);
    const clampedY = Math.max(0, y);
    nodePositions[id] = { x: clampedX, y: clampedY };

    const nodeEl = canvasEl.querySelector(`.np-node[data-id="${id}"]`);
    if (nodeEl) {
      nodeEl.style.left = `${clampedX}px`;
      nodeEl.style.top = `${clampedY}px`;
    }

    const criticalPath = currentExercise?.result?.criticalPath || [];
    drawArrows(canvasEl, activities, nodePositions, criticalPath);
  }

  function onDragEnd(canvasEl) {
    if (dragState) {
      const node = canvasEl.querySelector(`.np-node[data-id="${dragState.id}"]`);
      if (node) node.classList.remove('np-node-dragging');
      dragState = null;
    }
  }

  function cleanupDrag() {
    if (boundMouseMove) document.removeEventListener('mousemove', boundMouseMove);
    if (boundMouseUp) document.removeEventListener('mouseup', boundMouseUp);
    if (boundTouchMove) document.removeEventListener('touchmove', boundTouchMove);
    if (boundTouchEnd) document.removeEventListener('touchend', boundTouchEnd);
    boundMouseMove = null;
    boundMouseUp = null;
    boundTouchMove = null;
    boundTouchEnd = null;
    dragState = null;
  }

  // ---- Steps Generation ----

  function generateSteps(result) {
    const { activities, projectDuration, criticalPath } = result;
    const steps = [];

    steps.push({
      title: 'Schritt 1: Vorwaertsrechnung (FAZ / FEZ)',
      text: 'FAZ = max(FEZ aller Vorgaenger). FEZ = FAZ + Dauer. Startknoten: FAZ = 0.',
      detail: activities.map(a => {
        const predStr = a.predecessors.length > 0
          ? `max(${a.predecessors.map(p => `FEZ(${p})=${result.byId[p].fez}`).join(', ')}) = ${a.faz}`
          : 'Start = 0';
        return `${a.id} (${a.name}): FAZ = ${predStr}, FEZ = ${a.faz} + ${a.duration} = ${a.fez}`;
      }).join('\n'),
    });

    steps.push({
      title: 'Schritt 2: Rueckwaertsrechnung (SAZ / SEZ)',
      text: `Projektdauer = ${projectDuration}. SEZ = min(SAZ aller Nachfolger). SAZ = SEZ - Dauer.`,
      detail: [...activities].reverse().map(a => {
        const succStr = a.successors.length > 0
          ? `min(${a.successors.map(s => `SAZ(${s})=${result.byId[s].saz}`).join(', ')}) = ${a.sez}`
          : `Projektende = ${projectDuration}`;
        return `${a.id} (${a.name}): SEZ = ${succStr}, SAZ = ${a.sez} - ${a.duration} = ${a.saz}`;
      }).join('\n'),
    });

    steps.push({
      title: 'Schritt 3: Pufferzeiten (GP / FP)',
      text: 'GP (Gesamtpuffer) = SAZ - FAZ. FP (Freier Puffer) = min(FAZ Nachfolger) - FEZ.',
      detail: activities.map(a =>
        `${a.id}: GP = SAZ(${a.saz}) - FAZ(${a.faz}) = ${a.gp}, FP = ${a.fp}`
      ).join('\n'),
    });

    steps.push({
      title: 'Schritt 4: Kritischer Pfad',
      text: 'Alle Vorgaenge mit GP = 0 liegen auf dem kritischen Pfad.',
      detail: `Kritischer Pfad: ${criticalPath.join(' -> ')}\nProjektdauer: ${projectDuration} ZE`,
    });

    return steps;
  }

  // ---- Legend ----

  function renderLegend() {
    return `
      <details class="np-legend" open>
        <summary class="np-legend-title">Legende — Netzplanknoten</summary>
        <div class="np-legend-body">
          <div class="np-legend-node">
            <div class="np-legend-row np-legend-top">
              <div class="np-legend-cell np-legend-label">FAZ</div>
              <div class="np-legend-cell np-legend-accent">D</div>
              <div class="np-legend-cell np-legend-label">FEZ</div>
            </div>
            <div class="np-legend-name">Vorgangsname</div>
            <div class="np-legend-row np-legend-bottom">
              <div class="np-legend-cell np-legend-label">SAZ</div>
              <div class="np-legend-cell np-legend-label">GP</div>
              <div class="np-legend-cell np-legend-label">SEZ</div>
            </div>
            <div class="np-legend-fp">FP</div>
          </div>
          <div class="np-legend-defs">
            <div><strong>FAZ</strong> = Fruehester Anfangszeitpunkt</div>
            <div><strong>FEZ</strong> = Fruehester Endzeitpunkt <span class="np-legend-formula">= FAZ + D</span></div>
            <div><strong>SAZ</strong> = Spaetester Anfangszeitpunkt <span class="np-legend-formula">= SEZ - D</span></div>
            <div><strong>SEZ</strong> = Spaetester Endzeitpunkt</div>
            <div><strong>GP</strong> = Gesamtpuffer <span class="np-legend-formula">= SAZ - FAZ</span></div>
            <div><strong>FP</strong> = Freier Puffer <span class="np-legend-formula">= min(FAZ<sub>Nachf.</sub>) - FEZ</span></div>
            <div><strong>D</strong> = Dauer (Zeiteinheiten)</div>
            <div class="np-legend-crit-hint"><span class="np-legend-crit-dot"></span> Kritischer Pfad (GP = 0)</div>
          </div>
        </div>
      </details>
    `;
  }

  // ---- Rendering ----

  function render(container) {
    cleanup();
    currentTab = 'exercise';
    renderView(container);
  }

  function renderView(container) {
    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <div class="page-header-left">
            <a href="#/" class="btn btn-ghost btn-sm">&larr; Dashboard</a>
            <h1 class="page-title">Netzplantechnik</h1>
          </div>
        </div>

        ${renderLegend()}

        <div class="module-tabs">
          <button class="module-tab ${currentTab === 'exercise' ? 'active' : ''}" data-tab="exercise">
            Uebungsaufgaben
          </button>
          <button class="module-tab ${currentTab === 'free' ? 'active' : ''}" data-tab="free">
            Freier Modus
          </button>
        </div>

        <div id="moduleContent"></div>
      </div>
    `;

    container.querySelectorAll('.module-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        currentTab = tab.dataset.tab;
        renderView(container);
      });
    });

    const content = container.querySelector('#moduleContent');
    if (currentTab === 'exercise') {
      renderExerciseTab(content);
    } else {
      renderFreeTab(content);
    }
  }

  // ---- Tab: Exercise ----

  function renderExerciseTab(container) {
    let difficulty = 1;
    const diffKeys = { 1: 'easy', 2: 'medium', 3: 'hard' };

    function pickExercise() {
      const pool = EXERCISES[diffKeys[difficulty]];
      const ex = pool[Math.floor(Math.random() * pool.length)];
      const result = calculateNetzplan(ex.activities);
      currentExercise = { ...ex, result, steps: generateSteps(result) };
    }

    pickExercise();

    function renderExercise() {
      const ex = currentExercise;
      const result = ex.result;

      // Calculate layout
      const layout = calculateLayout(result.activities, result.byId);
      nodePositions = { ...layout.positions };

      container.innerHTML = `
        ${renderDifficultySelector(difficulty)}

        <div class="module-exercise-card">
          <div class="module-exercise-header">
            <span class="module-exercise-badge">${escapeHtml(ex.title)}</span>
          </div>
          <p class="module-exercise-question">${escapeHtml(ex.description)}</p>

          <div class="np-info-text">
            Fuelle die Felder in den Netzplanknoten aus. Gegeben sind: <strong>Vorgangsname</strong>, <strong>Dauer</strong> und <strong>Vorgaenger</strong>.
            Knoten koennen per Drag &amp; Drop verschoben werden.
          </div>

          ${renderActivityTable(ex.activities)}

          <h3 class="np-section-title">Netzplan</h3>

          <div class="np-canvas" id="npCanvas"
               style="width:${layout.canvasW}px; height:${layout.canvasH}px;">
            ${result.activities.map(a => renderInteractiveNode(a, nodePositions[a.id])).join('')}
          </div>

          <div class="module-actions">
            <button class="btn btn-primary" id="checkBtn">Pruefen</button>
            <button class="btn btn-ghost" id="newBtn">Neue Aufgabe</button>
            <button class="btn btn-ghost" id="showSolutionBtn">Loesung zeigen</button>
          </div>

          <div id="feedback"></div>
          <div id="steps"></div>
        </div>
      `;

      // Draw arrows
      const canvasEl = container.querySelector('#npCanvas');
      drawArrows(canvasEl, result.activities, nodePositions, []);

      // Init drag
      initDrag(canvasEl, result.activities);

      bindDifficultyButtons(container, (d) => {
        difficulty = d;
        pickExercise();
        renderExercise();
      });

      container.querySelector('#checkBtn').addEventListener('click', () => checkExercise(container));
      container.querySelector('#newBtn').addEventListener('click', () => {
        pickExercise();
        renderExercise();
      });
      container.querySelector('#showSolutionBtn').addEventListener('click', () => {
        showExerciseSolution(container);
      });

      container.querySelectorAll('.np-node-input').forEach(input => {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') checkExercise(container);
        });
      });
    }

    renderExercise();
  }

  function renderActivityTable(activities) {
    return `
      <div class="np-table-wrapper">
        <table class="np-table">
          <thead>
            <tr>
              <th>Vorgang</th>
              <th>Name</th>
              <th>Dauer (ZE)</th>
              <th>Vorgaenger</th>
            </tr>
          </thead>
          <tbody>
            ${activities.map(a => `
              <tr>
                <td><strong>${escapeHtml(a.id)}</strong></td>
                <td>${escapeHtml(a.name)}</td>
                <td>${a.duration}</td>
                <td>${a.predecessors.length > 0 ? a.predecessors.join(', ') : '\u2014'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderInteractiveNode(activity, pos) {
    return `
      <div class="np-node" data-id="${activity.id}"
           style="left:${pos.x}px; top:${pos.y}px;">
        <div class="np-node-row np-node-top">
          <input type="text" class="np-node-input" data-id="${activity.id}" data-field="faz" placeholder="FAZ" autocomplete="off">
          <div class="np-node-duration">${activity.duration}</div>
          <input type="text" class="np-node-input" data-id="${activity.id}" data-field="fez" placeholder="FEZ" autocomplete="off">
        </div>
        <div class="np-node-name np-node-drag-handle">${escapeHtml(activity.id)}: ${escapeHtml(activity.name)}</div>
        <div class="np-node-row np-node-bottom">
          <input type="text" class="np-node-input" data-id="${activity.id}" data-field="saz" placeholder="SAZ" autocomplete="off">
          <input type="text" class="np-node-input" data-id="${activity.id}" data-field="gp" placeholder="GP" autocomplete="off">
          <input type="text" class="np-node-input" data-id="${activity.id}" data-field="sez" placeholder="SEZ" autocomplete="off">
        </div>
        <div class="np-node-fp-row">
          <span class="np-node-fp-label">FP:</span>
          <input type="text" class="np-node-input np-node-input-sm" data-id="${activity.id}" data-field="fp" placeholder="FP" autocomplete="off">
        </div>
      </div>
    `;
  }

  function renderStaticNode(activity, pos, isCritical) {
    return `
      <div class="np-node ${isCritical ? 'np-node-critical' : ''}" data-id="${activity.id}"
           style="left:${pos.x}px; top:${pos.y}px;">
        <div class="np-node-row np-node-top">
          <div class="np-node-val">${activity.faz}</div>
          <div class="np-node-duration">${activity.duration}</div>
          <div class="np-node-val">${activity.fez}</div>
        </div>
        <div class="np-node-name np-node-drag-handle">${escapeHtml(activity.id)}: ${escapeHtml(activity.name)}</div>
        <div class="np-node-row np-node-bottom">
          <div class="np-node-val">${activity.saz}</div>
          <div class="np-node-val">${activity.gp}</div>
          <div class="np-node-val">${activity.sez}</div>
        </div>
        <div class="np-node-fp-row">
          <span class="np-node-fp-label">FP:</span>
          <div class="np-node-val np-node-val-sm">${activity.fp}</div>
        </div>
      </div>
    `;
  }

  function checkExercise(container) {
    const result = currentExercise.result;
    const fields = ['faz', 'fez', 'saz', 'sez', 'gp', 'fp'];
    let totalFields = 0;
    let correctFields = 0;
    const errors = [];

    result.activities.forEach(a => {
      fields.forEach(field => {
        const input = container.querySelector(`.np-node-input[data-id="${a.id}"][data-field="${field}"]`);
        if (!input) return;
        totalFields++;
        const userVal = input.value.trim();
        const correctVal = String(a[field]);

        input.classList.remove('module-input-correct', 'module-input-wrong');
        if (userVal === correctVal) {
          correctFields++;
          input.classList.add('module-input-correct');
        } else {
          input.classList.add('module-input-wrong');
          errors.push(`${a.id}.${field.toUpperCase()}: ${userVal || 'leer'} \u2192 ${correctVal}`);
        }
      });
    });

    // Highlight critical path
    result.activities.forEach(a => {
      const node = container.querySelector(`.np-node[data-id="${a.id}"]`);
      if (node && result.criticalPath.includes(a.id)) {
        node.classList.add('np-node-critical');
      }
    });

    // Redraw arrows with critical path
    const canvasEl = container.querySelector('#npCanvas');
    if (canvasEl) drawArrows(canvasEl, result.activities, nodePositions, result.criticalPath);

    const feedbackEl = container.querySelector('#feedback');
    if (correctFields === totalFields) {
      feedbackEl.innerHTML = `
        <div class="module-feedback module-feedback-success">
          Alles richtig! ${correctFields}/${totalFields} Felder korrekt.
          <br>Kritischer Pfad: <strong>${result.criticalPath.join(' \u2192 ')}</strong>
          | Projektdauer: <strong>${result.projectDuration} ZE</strong>
        </div>`;
    } else {
      feedbackEl.innerHTML = `
        <div class="module-feedback module-feedback-error">
          ${correctFields}/${totalFields} Felder korrekt.
          ${errors.length <= 6 ? '<br>' + errors.join('<br>') : `<br>${errors.slice(0, 6).join('<br>')}<br>... und ${errors.length - 6} weitere`}
        </div>`;
    }

    showSteps(container, currentExercise.steps);
  }

  function showExerciseSolution(container) {
    const result = currentExercise.result;
    const fields = ['faz', 'fez', 'saz', 'sez', 'gp', 'fp'];

    result.activities.forEach(a => {
      fields.forEach(field => {
        const input = container.querySelector(`.np-node-input[data-id="${a.id}"][data-field="${field}"]`);
        if (input) { input.value = a[field]; input.classList.add('module-input-correct'); }
      });
      const node = container.querySelector(`.np-node[data-id="${a.id}"]`);
      if (node && result.criticalPath.includes(a.id)) node.classList.add('np-node-critical');
    });

    const canvasEl = container.querySelector('#npCanvas');
    if (canvasEl) drawArrows(canvasEl, result.activities, nodePositions, result.criticalPath);

    container.querySelector('#feedback').innerHTML = `
      <div class="module-feedback module-feedback-success">
        Kritischer Pfad: <strong>${result.criticalPath.join(' \u2192 ')}</strong>
        | Projektdauer: <strong>${result.projectDuration} ZE</strong>
      </div>`;

    showSteps(container, currentExercise.steps);
  }

  // ---- Tab: Free Mode ----

  function renderFreeTab(container) {
    let freeActivities = [
      { id: 'A', name: '', duration: '', predecessors: '' },
      { id: 'B', name: '', duration: '', predecessors: '' },
      { id: 'C', name: '', duration: '', predecessors: '' },
    ];

    function renderFree() {
      container.innerHTML = `
        <div class="module-exercise-card">
          <div class="module-exercise-header">
            <span class="module-exercise-badge">Freier Modus</span>
          </div>
          <p class="module-exercise-question">
            Definiere deine eigenen Vorgaenge und berechne den Netzplan.
          </p>

          <div class="np-table-wrapper">
            <table class="np-table np-table-editable">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Dauer</th><th>Vorgaenger</th><th></th></tr>
              </thead>
              <tbody id="freeTableBody">
                ${freeActivities.map((a, i) => `
                  <tr data-index="${i}">
                    <td><input type="text" class="np-free-input" data-field="id" value="${escapeHtml(a.id)}" maxlength="3"></td>
                    <td><input type="text" class="np-free-input" data-field="name" value="${escapeHtml(a.name)}" placeholder="Vorgangsname"></td>
                    <td><input type="text" class="np-free-input np-free-input-sm" data-field="duration" value="${a.duration}" placeholder="ZE"></td>
                    <td><input type="text" class="np-free-input" data-field="predecessors" value="${escapeHtml(a.predecessors)}" placeholder="z.B. A, B"></td>
                    <td><button class="btn btn-sm btn-ghost np-remove-btn" data-index="${i}" ${freeActivities.length <= 2 ? 'disabled' : ''}>&times;</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="module-actions">
            <button class="btn btn-ghost btn-sm" id="addRowBtn">+ Vorgang hinzufuegen</button>
            <button class="btn btn-primary" id="calcBtn">Netzplan berechnen</button>
          </div>

          <div id="freeResult"></div>
          <div id="feedback"></div>
          <div id="steps"></div>
        </div>
      `;

      container.querySelector('#addRowBtn').addEventListener('click', () => {
        readFreeTable(container);
        const nextId = String.fromCharCode(65 + freeActivities.length);
        freeActivities.push({ id: nextId, name: '', duration: '', predecessors: '' });
        renderFree();
      });

      container.querySelectorAll('.np-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          readFreeTable(container);
          freeActivities.splice(parseInt(btn.dataset.index), 1);
          renderFree();
        });
      });

      container.querySelector('#calcBtn').addEventListener('click', () => {
        readFreeTable(container);
        calculateFree(container);
      });
    }

    function readFreeTable(ctr) {
      freeActivities = [];
      ctr.querySelectorAll('#freeTableBody tr').forEach(row => {
        freeActivities.push({
          id: row.querySelector('[data-field="id"]').value.trim(),
          name: row.querySelector('[data-field="name"]').value.trim(),
          duration: row.querySelector('[data-field="duration"]').value.trim(),
          predecessors: row.querySelector('[data-field="predecessors"]').value.trim(),
        });
      });
    }

    function calculateFree(ctr) {
      const errors = [];
      const parsed = [];

      freeActivities.forEach((a, i) => {
        if (!a.id) { errors.push(`Zeile ${i + 1}: ID fehlt`); return; }
        if (!a.duration || isNaN(parseInt(a.duration))) { errors.push(`${a.id}: Dauer muss eine Zahl sein`); return; }
        const preds = a.predecessors ? a.predecessors.split(',').map(p => p.trim()).filter(p => p) : [];
        parsed.push({ id: a.id, name: a.name || a.id, duration: parseInt(a.duration), predecessors: preds });
      });

      if (errors.length > 0) {
        ctr.querySelector('#feedback').innerHTML = `<div class="module-feedback module-feedback-error">${errors.join('<br>')}</div>`;
        return;
      }

      const ids = new Set(parsed.map(a => a.id));
      for (const a of parsed) {
        for (const p of a.predecessors) {
          if (!ids.has(p)) {
            ctr.querySelector('#feedback').innerHTML = `<div class="module-feedback module-feedback-error">Vorgang "${a.id}" referenziert unbekannten Vorgaenger "${p}".</div>`;
            return;
          }
        }
      }

      const result = calculateNetzplan(parsed);
      const steps = generateSteps(result);
      const layout = calculateLayout(result.activities, result.byId);
      nodePositions = { ...layout.positions };

      // Store result for arrow drawing during drag
      currentExercise = { result };

      const resultEl = ctr.querySelector('#freeResult');
      resultEl.innerHTML = `
        <h3 class="np-section-title">Ergebnis</h3>
        <div class="np-canvas" id="npCanvas"
             style="width:${layout.canvasW}px; height:${layout.canvasH}px;">
          ${result.activities.map(a =>
            renderStaticNode(a, nodePositions[a.id], result.criticalPath.includes(a.id))
          ).join('')}
        </div>

        <div class="module-feedback module-feedback-success">
          Kritischer Pfad: <strong>${result.criticalPath.join(' \u2192 ')}</strong>
          | Projektdauer: <strong>${result.projectDuration} ZE</strong>
        </div>
      `;

      const canvasEl = ctr.querySelector('#npCanvas');
      drawArrows(canvasEl, result.activities, nodePositions, result.criticalPath);
      initDrag(canvasEl, result.activities);

      ctr.querySelector('#feedback').innerHTML = '';
      showSteps(ctr, steps);
    }

    renderFree();
  }

  // ---- Shared UI ----

  function renderDifficultySelector(activeDiff) {
    return `
      <div class="module-difficulty">
        <span class="module-difficulty-label">Schwierigkeit:</span>
        <button class="module-diff-btn ${activeDiff === 1 ? 'active' : ''}" data-diff="1">Leicht</button>
        <button class="module-diff-btn ${activeDiff === 2 ? 'active' : ''}" data-diff="2">Mittel</button>
        <button class="module-diff-btn ${activeDiff === 3 ? 'active' : ''}" data-diff="3">Schwer</button>
      </div>
    `;
  }

  function bindDifficultyButtons(container, callback) {
    container.querySelectorAll('.module-diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.module-diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        callback(parseInt(btn.dataset.diff));
      });
    });
  }

  function showSteps(container, steps) {
    const stepsEl = container.querySelector('#steps');
    if (!stepsEl || !steps) return;
    stepsEl.innerHTML = `
      <div class="module-steps">
        <h3 class="module-steps-title">Loesungsweg</h3>
        ${steps.map(s => `
          <div class="module-step">
            <div class="module-step-title">${s.title}</div>
            <div class="module-step-text">${s.text}</div>
            ${s.detail ? `<pre class="module-step-detail">${escapeHtml(s.detail)}</pre>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function cleanup() {
    cleanupDrag();
    currentExercise = null;
    nodePositions = {};
  }

  return { render, cleanup };
})();

export default NetzplanView;
