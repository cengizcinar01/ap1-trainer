// ============================================================
// uml.js — UML-Werkstatt (Modul 4)
// Minimalist Edition: No emojis, no symbols in instructions, no legend
// ============================================================

const UMLView = (() => {
  let currentTab = 'explanation';
  let currentScenarioIdx = 0;
  let cleanup_fns = [];

  const SCENARIOS = [
    {
      id: 'ihk_optisoft',
      title: 'OptiSoft-XXL: Serviceprozess',
      type: 'use-case',
      taskText: `
**Situation:**
Die OptiSoft-XXL GmbH möchte ihre Servicequalität verbessern. Der bestehende Prozess der Störungsmeldungen zeigt Schwachstellen.

**Informationen der IT-Abteilung:**
1. Kunden senden Störungsmeldungen an das System.
2. Die Störungsmeldungen werden von der IT-Abteilung erfasst.
3. Die IT-Abteilung erstellt die Arbeitsplanung für die kommende Woche freitags. Dies beinhaltet auch immer eine Priorisierung der Aufträge.
4. Die Arbeitsaufträge werden vom Serviceteam bearbeitet. Dies beinhaltet immer eine Rückmeldung an das System.

**Aufgabe:**
Ergänzen Sie das UML-Anwendungsfalldiagramm um die fehlenden Akteure und Anwendungsfälle. Beachten Sie die Abhängigkeiten (Include).
      `,
      nodes: [
        {
          id: 'boundary',
          type: 'boundary',
          text: 'Störungsmeldung-System',
          x: 200,
          y: 20,
          w: 400,
          h: 520,
        },
        {
          id: 'drop_customer',
          type: 'drop-zone',
          correctId: 'actor_customer',
          x: 60,
          y: 100,
          w: 80,
          h: 90,
        },
        {
          id: 'drop_it',
          type: 'drop-zone',
          correctId: 'actor_it',
          x: 640,
          y: 80,
          w: 80,
          h: 90,
        },
        {
          id: 'drop_service',
          type: 'drop-zone',
          correctId: 'actor_service',
          x: 640,
          y: 380,
          w: 80,
          h: 90,
        },
        {
          id: 'uc_send',
          type: 'use-case-oval',
          text: 'Meldung senden',
          x: 280,
          y: 60,
        },
        {
          id: 'drop_uc_record',
          type: 'drop-zone',
          correctId: 'uc_record',
          x: 280,
          y: 150,
          w: 240,
          h: 60,
        },
        {
          id: 'uc_plan',
          type: 'use-case-oval',
          text: 'Arbeitsplanung erstellen',
          x: 280,
          y: 260,
        },
        {
          id: 'drop_uc_prio',
          type: 'drop-zone',
          correctId: 'uc_prio',
          x: 300,
          y: 360,
          w: 200,
          h: 60,
        },
        {
          id: 'drop_uc_work',
          type: 'drop-zone',
          correctId: 'uc_work',
          x: 280,
          y: 460,
          w: 240,
          h: 60,
        },
      ],
      lines: [
        { from: 'drop_customer', to: 'uc_send' },
        { from: 'drop_it', to: 'drop_uc_record' },
        { from: 'drop_it', to: 'uc_plan' },
        {
          from: 'uc_plan',
          to: 'drop_uc_prio',
          label: '<<include>>',
          dashed: true,
          arrow: 'open',
        },
        { from: 'drop_service', to: 'drop_uc_work' },
      ],
      items: [
        { id: 'actor_customer', text: 'Kunde' },
        { id: 'actor_it', text: 'IT-Abteilung' },
        { id: 'actor_service', text: 'Serviceteam' },
        { id: 'uc_record', text: 'Störung erfassen' },
        { id: 'uc_prio', text: 'Aufträge priorisieren' },
        { id: 'uc_work', text: 'Aufträge bearbeiten' },
        { id: 'dist1', text: 'Rechnung bezahlen' },
        { id: 'dist2', text: 'Marketing' },
      ],
    },
    {
      id: 'ihk_vacation',
      title: 'Prozess: Urlaubsantrag',
      type: 'activity',
      taskText: `
**Ablaufbeschreibung:**
Ein Mitarbeiter reicht einen Urlaubsantrag ein. Das System prüft formell die Resturlaubstage.
- Sind nicht genügend Tage vorhanden, wird der Antrag sofort abgelehnt.
- Sind Tage vorhanden, entscheidet der Vorgesetzte.
- Bei Genehmigung wird der Urlaub gebucht und der Mitarbeiter informiert.
- Bei Ablehnung durch den Vorgesetzten wird der Mitarbeiter ebenfalls informiert.

**Aufgabe:**
Vervollständigen Sie das Aktivitätsdiagramm. Achten Sie auf die korrekten Pfade an den Entscheidungsknoten.
      `,
      nodes: [
        { id: 'start', type: 'start', x: 350, y: 20 },
        {
          id: 'act_submit',
          type: 'action',
          text: 'Antrag einreichen',
          x: 280,
          y: 70,
        },
        {
          id: 'drop_check',
          type: 'drop-zone',
          correctId: 'act_check',
          x: 280,
          y: 140,
          w: 140,
          h: 50,
        },
        { id: 'dec_days', type: 'decision', x: 330, y: 220 },
        { id: 'dec_boss_static', type: 'decision', x: 330, y: 320 },
        {
          id: 'drop_reject',
          type: 'drop-zone',
          correctId: 'act_reject',
          x: 80,
          y: 320,
          w: 140,
          h: 50,
        },
        {
          id: 'drop_book',
          type: 'drop-zone',
          correctId: 'act_book',
          x: 280,
          y: 420,
          w: 140,
          h: 50,
        },
        {
          id: 'act_inform',
          type: 'action',
          text: 'MA informieren',
          x: 280,
          y: 500,
        },
        { id: 'end', type: 'end', x: 350, y: 580 },
      ],
      lines: [
        { from: 'start', to: 'act_submit', arrow: 'filled' },
        { from: 'act_submit', to: 'drop_check', arrow: 'filled' },
        { from: 'drop_check', to: 'dec_days', arrow: 'filled' },
        {
          from: 'dec_days',
          to: 'drop_reject',
          label: '[Nein]',
          arrow: 'filled',
          points: [[150, 240]],
        },
        {
          from: 'dec_days',
          to: 'dec_boss_static',
          label: '[Ja]',
          arrow: 'filled',
        },
        {
          from: 'dec_boss_static',
          to: 'drop_reject',
          label: '[Abgelehnt]',
          arrow: 'filled',
        },
        {
          from: 'dec_boss_static',
          to: 'drop_book',
          label: '[Genehmigt]',
          arrow: 'filled',
        },
        {
          from: 'drop_reject',
          to: 'end',
          arrow: 'filled',
          points: [[150, 592]],
        },
        { from: 'drop_book', to: 'act_inform', arrow: 'filled' },
        { from: 'act_inform', to: 'end', arrow: 'filled' },
      ],
      items: [
        { id: 'act_check', text: 'Resturlaub prüfen' },
        { id: 'act_reject', text: 'Antrag ablehnen' },
        { id: 'act_book', text: 'Urlaub buchen' },
        { id: 'dist1', text: 'Gehalt kürzen' },
        { id: 'dist2', text: 'Kunde anrufen' },
      ],
    },
    {
      id: 'ihk_school',
      title: 'Klassendiagramm: Schulverwaltung',
      type: 'class',
      taskText: `
**Szenario:**
Eine Online-Schule verwaltet Personen. Es gibt Dozenten und Teilnehmer.
- Jede Person hat einen Namen.
- Teilnehmer haben eine Matrikelnummer.
- Dozenten haben ein Fachgebiet und können Noten vergeben.
- Ein Kurs wird von genau einem Dozenten geleitet, kann aber viele Teilnehmer haben.

**Aufgabe:**
Ordnen Sie Attribute, Methoden und Kardinalitäten korrekt zu.
      `,
      nodes: [
        {
          id: 'cls_person',
          type: 'class-box',
          name: 'Person',
          x: 300,
          y: 20,
          w: 160,
          attributes: ['+ name: string'],
          methods: [],
        },
        {
          id: 'cls_student',
          type: 'class-box',
          name: 'Teilnehmer',
          x: 100,
          y: 200,
          w: 160,
          attributes: ['drop-zone:attr_matr'],
          methods: ['+ lernen()'],
        },
        {
          id: 'cls_docent',
          type: 'class-box',
          name: 'Dozent',
          x: 500,
          y: 200,
          w: 160,
          attributes: ['+ fachgebiet: string'],
          methods: ['drop-zone:meth_grade'],
        },
        {
          id: 'cls_course',
          type: 'class-box',
          name: 'Kurs',
          x: 300,
          y: 400,
          w: 160,
          attributes: ['+ titel: string'],
          methods: [],
        },
      ],
      lines: [
        {
          from: 'cls_student',
          to: 'cls_person',
          arrow: 'hollow',
          label: '{abstract}',
        },
        { from: 'cls_docent', to: 'cls_person', arrow: 'hollow' },
        {
          from: 'cls_course',
          to: 'cls_docent',
          label: '1 ... 1',
          arrow: 'open',
        },
        {
          from: 'cls_course',
          to: 'cls_student',
          label: 'drop-zone:kard_multi',
          arrow: 'open',
        },
      ],
      items: [
        { id: 'attr_matr', text: '+ matrikelNr: int' },
        { id: 'meth_grade', text: '+ noteVergeben()' },
        { id: 'kard_multi', text: '0 ... *' },
        { id: 'dist1', text: '+ kündigen()' },
        { id: 'dist2', text: '- geheim: bool' },
      ],
    },
  ];

  function render(container) {
    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <h1 class="page-title">UML-Werkstatt</h1>
          <p class="page-subtitle">Training: Aktivität, Klasse und Anwendungsfall</p>
        </div>

        <div class="module-tabs">
          <button class="module-tab ${currentTab === 'explanation' ? 'active' : ''}" data-tab="explanation">Anleitung</button>
          <button class="module-tab ${currentTab === 'exercises' ? 'active' : ''}" data-tab="exercises">Übung</button>
        </div>

        <div id="module-content"></div>
      </div>
    `;

    container.querySelectorAll('.module-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        currentTab = tab.dataset.tab;
        render(container);
      });
    });

    const contentBox = container.querySelector('#module-content');
    if (currentTab === 'explanation') renderExplanation(contentBox);
    else renderExercises(contentBox);
  }

  function renderExplanation(container) {
    container.innerHTML = `
      <div class="module-exercise-card">
        <h2 class="uml-section-title">UML-Grundlagen für die Prüfung</h2>
        <div class="uml-explanation-grid">
          <div class="uml-info-box">
            <h3>Anwendungsfall (Use Case)</h3>
            <p>Beschreibt Interaktionen zwischen Akteuren und dem System aus Anwendersicht.</p>
            <ul>
              <li><strong>Akteur:</strong> Eine Person oder ein externes System.</li>
              <li><strong>Anwendungsfall:</strong> Eine spezifische Funktion des Systems.</li>
              <li><strong>Include:</strong> Eine zwingende Beziehung zwischen zwei Fällen.</li>
            </ul>
          </div>

          <div class="uml-info-box">
            <h3>Aktivitätsdiagramm</h3>
            <p>Visualisiert den logischen Ablauf eines Prozesses oder Algorithmus.</p>
            <ul>
              <li><strong>Startpunkt:</strong> Der Beginn des Prozesses.</li>
              <li><strong>Aktion:</strong> Ein einzelner Arbeitsschritt.</li>
              <li><strong>Entscheidung:</strong> Eine Verzweigung (Raute).</li>
              <li><strong>Endpunkt:</strong> Der Abschluss des Ablaufs.</li>
            </ul>
          </div>

          <div class="uml-info-box">
            <h3>Klassendiagramm</h3>
            <p>Zeigt die statische Struktur des Systems und seine Beziehungen.</p>
            <ul>
              <li><strong>Attribute:</strong> Die Daten einer Klasse (+ public, - private).</li>
              <li><strong>Methoden:</strong> Die Funktionen einer Klasse.</li>
              <li><strong>Vererbung:</strong> Spezialisierung einer Klasse (hohler Pfeil).</li>
              <li><strong>Kardinalität:</strong> Anzahl der beteiligten Objekte (z.B. 1..*).</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  function renderExercises(container) {
    const scenario = SCENARIOS[currentScenarioIdx];

    container.innerHTML = `
      <div class="scenario-nav">
        <span class="scenario-nav-label">Aufgabe</span>
        <div class="scenario-nav-controls">
          <button class="scenario-nav-btn" id="prevScenario" ${currentScenarioIdx === 0 ? 'disabled' : ''}>◀</button>
          <span class="scenario-nav-current">${currentScenarioIdx + 1} / ${SCENARIOS.length}</span>
          <button class="scenario-nav-btn" id="nextScenario" ${currentScenarioIdx === SCENARIOS.length - 1 ? 'disabled' : ''}>▶</button>
        </div>
      </div>

      <div class="module-exercise-card">
        <div class="module-exercise-header">
           <span class="module-exercise-badge">${scenario.type.toUpperCase()}</span>
           <h3 class="module-exercise-question" style="margin-top:10px">${scenario.title}</h3>
           <div class="uml-task-box">
             ${marked.parse(scenario.taskText)}
           </div>
        </div>

        <div class="uml-exercise-layout">
          <div class="uml-palette-container">
            <div class="module-label" style="margin-bottom:8px">Bausteine</div>
            <div class="uml-items-list" id="uml-items">${renderItems(scenario)}</div>
          </div>
          
          <div class="uml-canvas-container">
             <div class="uml-canvas-wrapper" id="uml-canvas-root">
                <svg class="uml-svg-layer" id="uml-svg"></svg>
                <div class="uml-nodes-layer" id="uml-nodes"></div>
             </div>
          </div>
        </div>
        
        <div class="module-actions" style="margin-top:20px">
          <button class="btn btn-secondary" id="reset-uml">Reset</button>
        </div>
      </div>
    `;

    container.querySelector('#prevScenario').onclick = () => {
      currentScenarioIdx--;
      renderExercises(container);
    };
    container.querySelector('#nextScenario').onclick = () => {
      currentScenarioIdx++;
      renderExercises(container);
    };
    container.querySelector('#reset-uml').onclick = () => {
      renderExercises(container);
    };

    initDiagram(scenario);
    initDnD(container, scenario);
  }

  function renderItems(scenario) {
    return [...scenario.items]
      .sort(() => Math.random() - 0.5)
      .map(
        (item) => `
      <div class="uml-drag-item" draggable="true" data-id="${item.id}">
        <span class="drag-icon">⠿</span>
        <span class="drag-text">${item.text}</span>
      </div>
    `
      )
      .join('');
  }

  function initDiagram(scenario) {
    const nodesLayer = document.getElementById('uml-nodes');
    const svgLayer = document.getElementById('uml-svg');
    if (!nodesLayer || !svgLayer) return;

    const getPos = (id) => {
      const n = scenario.nodes.find((x) => x.id === id);
      if (!n) return { x: 0, y: 0 };
      const w =
        n.w || (n.type.includes('actor') || n.type === 'drop-zone' ? 60 : 100);
      const h = n.h || 50;
      if (n.type === 'class-box') return { x: n.x + w / 2, y: n.y + 60 };
      return { x: n.x + w / 2, y: n.y + h / 2 };
    };

    let svgHtml = `<defs>
      <marker id="arrow-filled" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--text-primary)" /></marker>
      <marker id="arrow-open" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polyline points="0 0, 9 3.5, 0 7" fill="none" stroke="var(--text-primary)" stroke-width="1.5" /></marker>
      <marker id="arrow-hollow" markerWidth="14" markerHeight="14" refX="14" refY="7" orient="auto"><path d="M0,0 L14,7 L0,14 Z" fill="var(--card-bg)" stroke="var(--text-primary)" stroke-width="1.5" /></marker>
    </defs>`;

    scenario.lines.forEach((line) => {
      const s = getPos(line.from);
      const e = getPos(line.to);
      const d = line.points
        ? `M ${s.x} ${s.y} ${line.points.map((p) => `L ${p[0]} ${p[1]}`).join(' ')} L ${e.x} ${e.y}`
        : `M ${s.x} ${s.y} L ${e.x} ${e.y}`;
      const marker =
        line.arrow === 'filled'
          ? 'url(#arrow-filled)'
          : line.arrow === 'open'
            ? 'url(#arrow-open)'
            : line.arrow === 'hollow'
              ? 'url(#arrow-hollow)'
              : '';
      svgHtml += `<path d="${d}" stroke="var(--text-primary)" stroke-width="1.5" fill="none" marker-end="${marker}" ${line.dashed ? 'stroke-dasharray="5,5"' : ''} />`;
      if (line.label) {
        let labelText = line.label;
        if (labelText.startsWith('drop-zone:')) labelText = '?';
        const mx = (s.x + e.x) / 2;
        const my = (s.y + e.y) / 2;
        svgHtml += `<rect x="${mx - labelText.length * 3.5}" y="${my - 8}" width="${labelText.length * 7}" height="14" fill="var(--card-bg)" opacity="0.9" />`;
        svgHtml += `<text x="${mx}" y="${my + 3}" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text-primary)">${labelText}</text>`;
      }
    });
    svgLayer.innerHTML = svgHtml;

    scenario.nodes.forEach((n) => {
      const el = document.createElement('div');
      el.className = `uml-node-v2 node-${n.type}`;
      el.style.left = `${n.x}px`;
      el.style.top = `${n.y}px`;
      if (n.w) el.style.width = `${n.w}px`;
      if (n.h) el.style.height = `${n.h}px`;

      if (n.type === 'actor')
        el.innerHTML = `<svg class="actor-svg" viewBox="0 0 50 80"><circle cx="25" cy="15" r="10" /><line x1="25" y1="25" x2="25" y2="55" /><line x1="25" y1="35" x2="5" y2="25" /><line x1="25" y1="35" x2="45" y2="25" /><line x1="25" y1="55" x2="10" y2="80" /><line x1="25" y1="55" x2="40" y2="80" /></svg><div class="actor-label">${n.text}</div>`;
      else if (n.type === 'use-case-oval' || n.type === 'action')
        el.textContent = n.text;
      else if (n.type === 'boundary')
        el.innerHTML = `<div class="boundary-header">${n.text}</div>`;
      else if (n.type === 'drop-zone') {
        el.classList.add('uml-target');
        el.dataset.correct = n.correctId;
        el.innerHTML = '<span class="target-placeholder">?</span>';
      } else if (n.type === 'class-box') {
        let html = `<div class="class-header">${n.name}</div><div class="class-section">`;
        n.attributes.forEach((a) => {
          html += a.startsWith('drop-zone:')
            ? `<div class="uml-target uml-target-inline" data-correct="${a.split(':')[1]}">?</div>`
            : `<div>${a}</div>`;
        });
        html += `</div><div class="class-section">`;
        n.methods.forEach((m) => {
          html += m.startsWith('drop-zone:')
            ? `<div class="uml-target uml-target-inline" data-correct="${m.split(':')[1]}">?</div>`
            : `<div>${m}</div>`;
        });
        el.innerHTML = `${html}</div>`;
      }
      nodesLayer.appendChild(el);
    });
  }

  function initDnD(container, _scenario) {
    container.querySelectorAll('.uml-drag-item').forEach((item) => {
      item.ondragstart = (e) => {
        e.dataTransfer.setData('text', item.dataset.id);
        item.classList.add('dragging');
      };
      item.ondragend = () => item.classList.remove('dragging');
    });
    container.querySelectorAll('.uml-target').forEach((target) => {
      target.ondragover = (e) => {
        e.preventDefault();
        target.classList.add('hover');
      };
      target.ondragleave = () => target.classList.remove('hover');
      target.ondrop = (e) => {
        e.preventDefault();
        target.classList.remove('hover');
        const id = e.dataTransfer.getData('text');
        const itemEl = container.querySelector(
          `.uml-drag-item[data-id="${id}"]`
        );
        if (id === target.dataset.correct) {
          target.classList.add('correct');
          if (
            target.classList.contains('node-actor') ||
            id.startsWith('actor_')
          ) {
            target.innerHTML = `<svg class="actor-svg" viewBox="0 0 50 80"><circle cx="25" cy="15" r="10" /><line x1="25" y1="25" x2="25" y2="55" /><line x1="25" y1="35" x2="5" y2="25" /><line x1="25" y1="35" x2="45" y2="25" /><line x1="25" y1="55" x2="10" y2="80" /><line x1="25" y1="55" x2="40" y2="80" /></svg><div class="actor-label">${itemEl.querySelector('.drag-text').textContent}</div>`;
            target.style.border = 'none';
            target.style.background = 'transparent';
          } else {
            target.textContent = itemEl.querySelector('.drag-text').textContent;
          }
          itemEl.classList.add('used');
          itemEl.setAttribute('draggable', 'false');
        } else {
          target.classList.add('wrong');
          setTimeout(() => target.classList.remove('wrong'), 800);
        }
      };
    });
  }

  return {
    render,
    cleanup: () => {
      cleanup_fns.forEach((f) => {
        f();
      });
      cleanup_fns = [];
    },
  };
})();

export default UMLView;
