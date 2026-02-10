import CardRenderer from '../js/components/cardRenderer.js';

const ElectricalView = (() => {
  let currentTab = 'explanation';
  let currentScenarioIdx = 0;
  let cleanup_fns = [];

  const SCENARIOS = [
    {
      id: 'psu_sizing',
      title: 'Szenario 1: CAD-PC Konfiguration',
      description:
        'Ein Ingenieurbüro benötigt neue CAD-Rechner. Berechnen Sie die benötigte Netzteil-Leistung basierend auf der Komponentenliste.',
      task: 'Ermitteln Sie die Gesamtleistung, addieren Sie den geforderten Puffer und wählen Sie das kleinste passende Netzteil aus dem Lagerbestand (400W bis 1200W in 50W-Schritten).',
      data: null,
    },
    {
      id: 'efficiency_costs',
      title: 'Szenario 2: Jährliche Stromkosten',
      description:
        'Ein PC wird für eine bestimmte Anzahl an Arbeitstagen genutzt. Das installierte Netzteil hat einen bekannten Wirkungsgrad und eine durchschnittliche Auslastung.',
      task: 'Berechnen Sie die jährlichen Stromkosten basierend auf der Netzteilleistung, der Auslastung und dem Wirkungsgrad.',
      data: null,
    },
    {
      id: 'ups_capacity',
      title: 'Szenario 3: USV-Absicherung',
      description:
        'Ein kritischer Datenbank-Server soll über eine USV (Unterbrechungsfreie Stromversorgung) abgesichert werden.',
      task: 'Ermitteln Sie die benötigte Scheinleistung (S) in VA (Volt-Ampere).',
      data: null,
    },
    {
      id: 'pue_value',
      title: 'Szenario 4: Green IT (PUE-Wert)',
      description:
        'Ein Rechenzentrum verbraucht Energie für IT-Hardware sowie Kühlung und Beleuchtung.',
      task: 'Berechnen Sie den PUE-Wert (Power Usage Effectiveness) und bewerten Sie die Effizienz.',
      data: null,
    },
    {
      id: 'battery_runtime',
      title: 'Szenario 5: Akkulaufzeit Tablet',
      description:
        'Ein Außendienst-Tablet hat einen Akku mit bestimmter Kapazität (mAh) bei einer Spannung von 3,7 V.',
      task: 'Wie lange kann ein Techniker arbeiten, wenn das Gerät durchschnittlich Last verbraucht?',
      data: null,
    },
  ];

  // ============================================================
  // HELPERS
  // ============================================================

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ============================================================
  // GENERATORS
  // ============================================================

  function generateDataForScenario(scenarioId) {
    if (scenarioId === 'psu_sizing') {
      const cpus = [
        { name: 'Intel Core i5', w: 65 },
        { name: 'Intel Core i7', w: 125 },
        { name: 'Intel Core i9', w: 253 },
        { name: 'AMD Ryzen 5', w: 65 },
        { name: 'AMD Ryzen 7', w: 105 },
        { name: 'AMD Ryzen 9', w: 170 },
      ];
      const gpus = [
        { name: 'NVIDIA RTX 4060', w: 115 },
        { name: 'NVIDIA RTX 4070', w: 200 },
        { name: 'NVIDIA RTX 4080', w: 320 },
        { name: 'NVIDIA RTX 4090', w: 450 },
        { name: 'AMD Radeon RX 7600', w: 165 },
        { name: 'AMD Radeon RX 7900 XT', w: 315 },
      ];
      const extras = [
        { name: '32GB DDR5 RAM (2x)', w: 10 },
        { name: '64GB DDR5 RAM (4x)', w: 20 },
        { name: 'NVMe SSD (1TB)', w: 5 },
        { name: 'SATA HDD (4TB)', w: 15 },
        { name: 'Wasserkühlung (AIO)', w: 35 },
        { name: 'Gehäuselüfter (4x)', w: 12 },
      ];

      const components = [
        { name: 'Mainboard', w: [25, 35, 50][randomInt(0, 2)] },
        cpus[randomInt(0, cpus.length - 1)],
        gpus[randomInt(0, gpus.length - 1)],
        extras[randomInt(0, 1)],
        extras[randomInt(2, 3)],
        extras[randomInt(4, 5)],
      ];

      const sum = components.reduce((a, b) => a + b.w, 0);
      const buffer = [10, 20, 25][randomInt(0, 2)];
      const totalNeeded = sum * (1 + buffer / 100);

      let target = 400;
      while (target < totalNeeded) target += 50;

      return { components, buffer, target, sum };
    }

    if (scenarioId === 'efficiency_costs') {
      const psuWatt = [500, 600, 750, 850, 1000][randomInt(0, 4)];
      const efficiency = [80, 85, 90, 92][randomInt(0, 3)];
      const utilization = [40, 50, 60, 75][randomInt(0, 3)];
      const hours = [8, 9, 10, 24][randomInt(0, 3)];
      const days = [200, 220, 250, 365][randomInt(0, 3)];
      const priceKWh = [0.35, 0.4, 0.42, 0.45, 0.5][randomInt(0, 4)];

      return { psuWatt, efficiency, utilization, hours, days, priceKWh };
    }

    if (scenarioId === 'ups_capacity') {
      const watt = [350, 500, 750, 1000, 1500][randomInt(0, 4)];
      const cosPhi = [0.7, 0.8, 0.9][randomInt(0, 2)];
      const reserve = [20, 25, 30][randomInt(0, 2)];
      const s = watt / cosPhi;
      const target = Math.ceil(s * (1 + reserve / 100));
      return { watt, cosPhi, reserve, target };
    }

    if (scenarioId === 'pue_value') {
      const it = [50000, 100000, 250000, 750000][randomInt(0, 3)];
      const pueFactor = (Math.random() * (2.0 - 1.1) + 1.1).toFixed(2);
      const total = Math.round(it * pueFactor);
      return { total, it, target: pueFactor };
    }

    if (scenarioId === 'battery_runtime') {
      const mah = [5000, 8000, 10000, 20000][randomInt(0, 3)];
      const voltage = 3.7;
      const consumption = [5, 8, 12, 15][randomInt(0, 3)];
      const wh = (mah * voltage) / 1000;
      const target = (wh / consumption).toFixed(1);
      return { mah, voltage, consumption, target };
    }
    return {};
  }

  // ============================================================
  // LOGIC
  // ============================================================

  function getDetailedSolution(sc) {
    const d = sc.data;
    if (sc.id === 'psu_sizing') {
      const sum = d.components.reduce((a, b) => a + b.w, 0);
      const buffVal = sum * (d.buffer / 100);
      const total = sum + buffVal;
      return `
**1. Summe der Einzelkomponenten:**
${d.components.map((c) => `* ${c.name}: ${c.w}W`).join('\n')}
**Zwischensumme: ${sum} Watt**

**2. Sicherheitsreserve (${d.buffer}%):**
${sum} W * ${d.buffer / 100} = **${buffVal.toFixed(1)} Watt**

**3. Benötigte Gesamtleistung:**
${sum} + ${buffVal.toFixed(1)} = **${total.toFixed(1)} Watt**

**4. Wahl des Netzteils:**
In 50W-Schritten ist die nächste Stufe: **${d.target} Watt**
      `.trim();
    }

    if (sc.id === 'efficiency_costs') {
      const loadPC = d.psuWatt * (d.utilization / 100);
      const p_zu = loadPC / (d.efficiency / 100);
      const energy = (p_zu * d.hours * d.days) / 1000;
      const cost = energy * d.priceKWh;
      return `
**1. Tatsächliche Last am PC berechnen (Sekundärseite):**
${d.psuWatt} W * ${d.utilization / 100} = **${loadPC.toFixed(1)} Watt**

**2. Leistung an der Steckdose berechnen (Primärseite):**
WICHTIG: Teile durch den Wirkungsgrad!
Formel: $P_{zu} = P_{ab} / eta$
${loadPC.toFixed(1)} W / ${d.efficiency / 100} = **${p_zu.toFixed(1)} Watt**

**3. Jahresverbrauch (kWh):**
(${p_zu.toFixed(1)} W * ${d.hours} h * ${d.days} d) / 1000 = **${energy.toFixed(2)} kWh**

**4. Kosten:**
${energy.toFixed(2)} kWh * ${d.priceKWh.toFixed(2)} € = **${cost.toFixed(2)} €**
      `.trim();
    }

    if (sc.id === 'ups_capacity') {
      const s = d.watt / d.cosPhi;
      const total = s * (1 + d.reserve / 100);
      return `
**1. Scheinleistung (S) in VA:**
Formel: $S = P / cos phi$
${d.watt} W / ${d.cosPhi} = **${s.toFixed(1)} VA**

**2. Sicherheitsreserve (${d.reserve}%):**
${s.toFixed(1)} VA * ${1 + d.reserve / 100} = **${total.toFixed(0)} VA**
      `.trim();
    }

    if (sc.id === 'pue_value') {
      const pue = d.total / d.it;
      return `
**1. PUE-Formel:**
$PUE = \text{Gesamtenergie} / \text{IT-Energie}$
${d.total.toLocaleString()} / ${d.it.toLocaleString()} = **${pue.toFixed(2)}**
      `.trim();
    }

    if (sc.id === 'battery_runtime') {
      const wh = (d.mah * d.voltage) / 1000;
      const hours = wh / d.consumption;
      return `
**1. Energieinhalt (Wh):**
(${d.mah} mAh * ${d.voltage} V) / 1000 = **${wh.toFixed(1)} Wh**

**2. Laufzeit:**
${wh.toFixed(1)} Wh / ${d.consumption} W = **${hours.toFixed(1)} Stunden**
      `.trim();
    }
    return '';
  }

  // ============================================================
  // RENDERING
  // ============================================================

  function render(container) {
    cleanup();
    SCENARIOS.forEach((sc) => {
      if (!sc.data) sc.data = generateDataForScenario(sc.id);
    });

    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <div class="page-header-left">
            <div>
              <h1 class="page-title">Elektrotechnik & Energie</h1>
              <p class="page-subtitle">Prüfungsnahe Szenarien zu Netzteilen, Stromkosten und Green IT.</p>
            </div>
          </div>
        </div>
        <nav class="module-tabs">
          <button class="module-tab ${currentTab === 'explanation' ? 'active' : ''}" data-tab="explanation">Anleitung</button>
          <button class="module-tab ${currentTab === 'exercise' ? 'active' : ''}" data-tab="exercise">Übung</button>
        </nav>
        <div id="elecContent" class="view-enter"></div>
      </div>
    `;
    setupTabEvents(container);
    renderCurrentTab();
  }

  function setupTabEvents(container) {
    container.querySelectorAll('.module-tab').forEach((btn) => {
      const handler = () => {
        currentTab = btn.dataset.tab;
        container.querySelectorAll('.module-tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderCurrentTab();
      };
      btn.addEventListener('click', handler);
      cleanup_fns.push(() => btn.removeEventListener('click', handler));
    });
  }

  function renderCurrentTab() {
    const content = document.getElementById('elecContent');
    if (!content) return;
    if (currentTab === 'explanation') renderExplanation(content);
    else renderExerciseLayout(content);
  }

  function renderExplanation(container) {
    container.innerHTML = `
      <div class="module-explanation">
        <div class="module-exercise-card">
          <h3 class="module-section-title">IHK-Kernwissen: Energie</h3>
          <p class="module-text">Die IHK-Pruefung fragt haeufig nach Netzteil-Dimensionierung, Stromkosten und USV-Auslegung. Hier die drei wichtigsten Formeln:</p>
        </div>

        <div class="module-exercise-card">
          <h3 class="module-section-title">1. Der Wirkungsgrad-Trick</h3>
          <p class="module-text">Das Netzteil liefert Strom an den PC (P_ab), zieht aber mehr aus der Wand (P_zu). Die Differenz ist Abwaerme.</p>
          <div class="module-info-box">
            <strong>Formel:</strong> P_zu = P_ab / Wirkungsgrad (z.B. 400W / 0,90 = 444W)
          </div>
        </div>

        <div class="module-exercise-card">
          <h3 class="module-section-title">2. USV & Scheinleistung (VA)</h3>
          <p class="module-text">USVs werden in VA (Volt-Ampere) angegeben. Um von Watt (W) dorthin zu kommen, teilt man durch den Leistungsfaktor cos phi.</p>
          <div class="module-info-box">
            <strong>Formel:</strong> S (VA) = P (Watt) / cos phi
          </div>
        </div>

        <div class="module-exercise-card">
          <h3 class="module-section-title">3. Green IT: PUE-Wert</h3>
          <p class="module-text">Power Usage Effectiveness: Verhaeltnis von Gesamtenergie zu IT-Energie. Ein PUE von 1.0 waere perfekt, ab 2.0 gilt ein Rechenzentrum als ineffizient.</p>
          <div class="module-info-box">
            <strong>Formel:</strong> PUE = Gesamt-Energie / IT-Energie
          </div>
        </div>

        <div class="module-exercise-card">
          <h3 class="module-section-title">4. Akkulaufzeit</h3>
          <p class="module-text">Energie in Wh = (Kapazitaet in mAh * Spannung in V) / 1000. Laufzeit = Energie / Verbrauch.</p>
          <div class="module-info-box">
            <strong>Formel:</strong> Laufzeit (h) = (mAh * V / 1000) / Verbrauch (W)
          </div>
        </div>

        <div class="module-exercise-card">
          <h3 class="module-section-title">5. Netzteil-Dimensionierung</h3>
          <p class="module-text">Alle Komponentenleistungen addieren, Sicherheitspuffer draufrechnen, dann die naechste verfuegbare Netzteilegroesse waehlen.</p>
          <div class="module-tip-box">
            <strong>Tipp:</strong> Netzteile gibt es typisch in 50W-Schritten (400W, 450W, 500W, ...). Immer aufrunden!
          </div>
        </div>
      </div>
    `;
  }

  function renderExerciseLayout(container) {
    const sc = SCENARIOS[currentScenarioIdx];
    container.innerHTML = `
      <div class="scenario-nav">
        <span class="scenario-nav-label">Aufgaben</span>
        <div class="scenario-nav-controls">
          <button class="scenario-nav-btn" id="prevScen" ${currentScenarioIdx === 0 ? 'disabled' : ''}>&larr;</button>
          <span class="scenario-nav-current">${currentScenarioIdx + 1} / ${SCENARIOS.length}</span>
          <button class="scenario-nav-btn" id="nextScen" ${currentScenarioIdx === SCENARIOS.length - 1 ? 'disabled' : ''}>&rarr;</button>
        </div>
      </div>
      <div class="module-exercise-card">
        <div class="module-exercise-header">
          <span class="module-exercise-badge">${sc.title}</span>
        </div>
        <div class="module-info-box">
          ${CardRenderer.formatAnswer(sc.description)}
        </div>
        <p class="module-exercise-question"><strong>Aufgabe:</strong> ${sc.task}</p>
        <div id="exerciseSpecificContent"></div>
        <div class="module-actions">
          <button class="btn btn-primary" id="btnShowSolution">Loesungsweg anzeigen</button>
          <button class="btn" id="btnNextTask">Zufaellige Werte</button>
        </div>
        <div id="elecSolution" class="module-steps" style="display:none;"></div>
      </div>
    `;
    const exContent = container.querySelector('#exerciseSpecificContent');
    renderTaskInputs(exContent, sc);

    container.querySelector('#prevScen').addEventListener('click', () => {
      currentScenarioIdx--;
      renderExerciseLayout(container);
    });
    container.querySelector('#nextScen').addEventListener('click', () => {
      currentScenarioIdx++;
      renderExerciseLayout(container);
    });
    container
      .querySelector('#btnShowSolution')
      .addEventListener('click', () => {
        const solEl = container.querySelector('#elecSolution');
        solEl.style.display = 'block';
        solEl.innerHTML = `<div class="module-step"><div class="module-step-title">Detaillierter Rechenweg</div><div class="module-step-text">${CardRenderer.formatAnswer(getDetailedSolution(sc))}</div></div>`;
        solEl.scrollIntoView({ behavior: 'smooth' });
      });
    container.querySelector('#btnNextTask').addEventListener('click', () => {
      sc.data = generateDataForScenario(sc.id);
      renderExerciseLayout(container);
    });
  }

  function renderDataGrid(pairs) {
    return `
      <div class="module-input-grid">
        ${pairs.map(([label, value]) => `
          <div class="module-input-group">
            <label class="module-label">${label}</label>
            <div class="module-text" style="margin:0;">${value}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderTaskInputs(container, sc) {
    const d = sc.data;
    if (sc.id === 'psu_sizing') {
      const rows = d.components
        .map(
          (c) =>
            `<tr><td>${c.name}</td><td class="elec-val">${c.w} W</td></tr>`
        )
        .join('');
      container.innerHTML = `
        <table class="module-table">
          <thead><tr><th>Komponente</th><th>Leistung</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="module-text"><strong>Sicherheitsreserve:</strong> ${d.buffer}%</p>
        <div class="module-input-grid">
          <div class="module-input-group">
            <label class="module-label">Netzteil (Watt)</label>
            <input type="text" class="module-input module-input-mono" placeholder="z.B. 600">
          </div>
        </div>`;
    } else if (sc.id === 'efficiency_costs') {
      container.innerHTML = `
        ${renderDataGrid([
          ['Netzteil', `${d.psuWatt} Watt`],
          ['Auslastung', `${d.utilization} %`],
          ['Wirkungsgrad', `${d.efficiency} %`],
          ['Zeitraum', `${d.days} Tage / ${d.hours} h`],
          ['Preis', `${d.priceKWh.toFixed(2)} EUR/kWh`],
        ])}
        <div class="module-input-grid">
          <div class="module-input-group">
            <label class="module-label">Jahreskosten (EUR)</label>
            <input type="text" class="module-input module-input-mono" placeholder="0.00">
          </div>
        </div>`;
    } else if (sc.id === 'ups_capacity') {
      container.innerHTML = `
        ${renderDataGrid([
          ['Last', `${d.watt} W`],
          ['cos phi', `${d.cosPhi}`],
          ['Reserve', `${d.reserve} %`],
        ])}
        <div class="module-input-grid">
          <div class="module-input-group">
            <label class="module-label">Benoetigte VA</label>
            <input type="text" class="module-input module-input-mono" placeholder="0">
          </div>
        </div>`;
    } else if (sc.id === 'pue_value') {
      container.innerHTML = `
        ${renderDataGrid([
          ['Gesamtenergie', `${d.total.toLocaleString()} kWh`],
          ['IT-Energie', `${d.it.toLocaleString()} kWh`],
        ])}
        <div class="module-input-grid">
          <div class="module-input-group">
            <label class="module-label">PUE-Wert</label>
            <input type="text" class="module-input module-input-mono" placeholder="1.00">
          </div>
        </div>`;
    } else if (sc.id === 'battery_runtime') {
      container.innerHTML = `
        ${renderDataGrid([
          ['Kapazitaet', `${d.mah} mAh`],
          ['Spannung', `3.7 V`],
          ['Verbrauch', `${d.consumption} W`],
        ])}
        <div class="module-input-grid">
          <div class="module-input-group">
            <label class="module-label">Laufzeit (h)</label>
            <input type="text" class="module-input module-input-mono" placeholder="0.0">
          </div>
        </div>`;
    }
  }

  function cleanup() {
    cleanup_fns.forEach((fn) => {
      fn();
    });
    cleanup_fns = [];
  }
  return { render, cleanup };
})();

export default ElectricalView;
