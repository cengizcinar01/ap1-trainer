import CardRenderer from '../js/components/cardRenderer.js';

const NumberSystemsView = (() => {
  let currentTab = 'explanation';
  let currentScenarioIdx = 0;
  let currentExercise = null;
  let difficulty = 1;
  let cleanup_fns = [];

  const SCENARIOS = [
    {
      id: 'converter',
      title: 'Zahlensysteme',
      description: 'Umrechnung in alle Richtungen (Dezimal, Binär, Hexadezimal).',
    },
    {
      id: 'storage',
      title: 'Speicherbedarf',
      description:
        'Berechnung für Bilder, Audio und komplexe Datenstrukturen (IHK-typisch).',
    },
    {
      id: 'transfer',
      title: 'Datenübertragung',
      description:
        'Berechnung der Übertragungsdauer bei gegebener Bandbreite.',
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

  function generateConverterExercise(diff) {
    let dec;
    if (diff === 1) dec = randomInt(0, 255);
    else if (diff === 2) dec = randomInt(256, 4095);
    else dec = randomInt(4096, 65535);

    const bin = dec.toString(2);
    const hex = dec.toString(16).toUpperCase();
    const givenIdx = randomInt(0, 2);

    let steps = `### 📝 Umrechnungsweg erklärt\n\n`;
    
    // --- DEC -> BIN ---
    steps += `**Weg 1: Dezimal &rarr; Binär (Restwertmethode)**\n`;
    let tempDec = dec;
    let binSteps = [];
    while (tempDec > 0) {
        binSteps.push(`${tempDec} / 2 = ${Math.floor(tempDec / 2)} Rest **${tempDec % 2}**`);
        tempDec = Math.floor(tempDec / 2);
    }
    steps += (binSteps.length ? binSteps.join('\n') : '0 / 2 = 0 Rest 0') + `\n\n`;

    // --- DEC -> HEX ---
    steps += `**Weg 2: Dezimal &rarr; Hexadezimal (Die 16er-Rechnung)**\n`;
    steps += `Hier schauen wir, wie oft die 16 ganz in die Zahl passt und was übrig bleibt (Rest).\n\n`;
    
    tempDec = dec;
    let hexSteps = [];
    if (tempDec === 0) hexSteps.push('0 / 16 = 0 Rest **0**');
    while (tempDec > 0) {
        let quotient = Math.floor(tempDec / 16);
        let rest = tempDec % 16;
        let calcPath = `${tempDec} - (${quotient} * 16) = ${rest}`;
        let restDisplay = rest > 9 ? `**${rest}** &rarr; **${String.fromCharCode(55 + rest)}**` : `**${rest}**`;
        
        hexSteps.push(`${tempDec} / 16 = **${quotient}** | Rest: ${restDisplay} *(Rechnung: ${calcPath})*`);
        tempDec = quotient;
    }
    steps += hexSteps.join('\n') + `\n\n**Ergebnis: ${hex}**\n\n---\n\n`;

    // --- BIN <-> HEX ---
    steps += `**Weg 3: IHK-Shortcut (Binär &harr; Hex)**\n`;
    steps += `Teile die Binärzahl von rechts in **4er-Blöcke**. Jeder Block ist eine Hex-Ziffer:\n\n`;
    const paddedBin = bin.padStart(Math.ceil(bin.length / 4) * 4, '0');
    const nibbles = paddedBin.match(/.{1,4}/g) || [];
    steps += `| Binär | Wert | Hex |\n|:---:|:---:|:---:|\n`;
    nibbles.forEach(n => {
        const val = parseInt(n, 2);
        steps += `| ${n} | ${val} | **${val.toString(16).toUpperCase()}** |\n`;
    });

    return { type: 'converter', dec, bin, hex, givenIdx, steps };
  }

  function generateStorageExercise(diff) {
    const types = ['image', 'audio', 'struct'];
    const type = types[randomInt(0, 2)];

    if (type === 'image') {
      const width = [1024, 1920, 3840][randomInt(0, 2)];
      const height = [768, 1080, 2160][randomInt(0, 2)];
      const depth = [8, 16, 24, 32][randomInt(0, 3)];
      const totalBits = width * height * depth;
      const totalBytes = totalBits / 8;
      const mib = totalBytes / (1024 * 1024);

      return {
        type: 'image',
        desc: `Ein Bild hat die Auflösung **${width} x ${height}** Pixel und eine Farbtiefe von **${depth} Bit**.`,
        sol: {
          display: `${mib.toFixed(2)} MiB`,
          steps: `1. **Gesamt-Bits:** ${width} * ${height} * ${depth} = ${totalBits.toLocaleString()} Bit\n2. **Byte:** / 8 = ${totalBytes.toLocaleString()} B\n3. **MiB:** / 1024 / 1024 = **${mib.toFixed(2)} MiB**`
        },
      };
    } else if (type === 'audio') {
      const freq = [44100, 48000][randomInt(0, 1)];
      const bitDepth = [16, 24][randomInt(0, 1)];
      const channels = [1, 2][randomInt(0, 1)];
      const duration = [60, 180][randomInt(0, 1)];
      const totalBits = freq * bitDepth * channels * duration;
      const totalBytes = totalBits / 8;
      const mib = totalBytes / (1024 * 1024);

      return {
        type: 'audio',
        desc: `Audio: **${duration} Sek.**, **${freq / 1000} kHz**, **${bitDepth} Bit**, **${channels === 1 ? 'Mono' : 'Stereo'}**.`,
        sol: {
          display: `${mib.toFixed(2)} MiB`,
          steps: `1. **Formel:** Hz * Bit * Kanäle * Zeit\n2. **Rechnung:** ${freq} * ${bitDepth} * ${channels} * ${duration} = ${totalBits.toLocaleString()} Bit\n3. **Byte:** / 8 = ${totalBytes.toLocaleString()} B\n4. **MiB:** / 1.048.576 = **${mib.toFixed(2)} MiB**`
        },
      };
    } else {
      const points = [1000, 3840, 5000][randomInt(0, 2)];
      const totalBitsGeo = points * 3 * 32;
      const kibGeo = totalBitsGeo / 8 / 1024;
      const increasePercent = (24 / 96) * 100;

      return {
        type: 'struct',
        desc: `PLY-Datei: **${points} Punkte**. Jeder Punkt hat x, y, z Koordinaten (je **32-Bit Float**). \n\n**da)** Berechnen Sie den Speicherbedarf der Geometrie in **KiB**.\n**db)** Jeder Punkt erhält zusätzlich RGB-Werte (je 8 Bit). Wie viele Farben lassen sich damit darstellen?\n**dc)** Wie viel **% Speicher** wird pro Punkt zusätzlich benötigt?`,
        sol: {
          val_a: kibGeo.toFixed(2), 
          val_b: "16777216",
          val_c: increasePercent.toFixed(1),
          steps: `
**Teil da) Geometrie**
1. Bits pro Punkt: 3 * 32 Bit = 96 Bit
2. Gesamt: ${points} * 96 = ${totalBitsGeo.toLocaleString()} Bit
3. Byte: / 8 = ${(totalBitsGeo / 8).toLocaleString()} B
4. KiB: / 1024 = **${kibGeo.toFixed(2)} KiB**

**Teil db) Farben**
RGB mit 8 Bit pro Kanal bedeutet 24 Bit Gesamtfarbtiefe ($3 \times 8$).
Formel: $2^{Bits} = 2^{24} = \mathbf{16.777.216}$ Farben.

**Teil dc) Zuwachs**
1. Basis: 96 Bit (Geometrie)
2. Zusatz: 24 Bit (Farbe)
3. Prozent: (24 / 96) * 100 = **${increasePercent.toFixed(1)} %**
`
        }
      };
    }
  }

  function generateTransferExercise(diff) {
    const sizeGB = randomInt(1, 20);
    const speedMbit = [50, 100, 250][randomInt(0, 2)];
    const sizeBits = sizeGB * (1024 ** 3) * 8;
    const speedBits = speedMbit * 1000000;
    const seconds = sizeBits / speedBits;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    return {
      type: 'transfer',
      sizeGB, speedMbit, seconds: Math.round(seconds),
      steps: `**1. Menge:** ${sizeGB} GiB * 1024³ * 8 = **${sizeBits.toLocaleString()} Bit**\n**2. Speed:** ${speedMbit} * 10⁶ = **${speedBits.toLocaleString()} Bit/s**\n**3. Zeit:** Menge / Speed = ${seconds.toFixed(1)} s &rarr; **${h}h ${m}m ${s}s**`
    };
  }

  // ============================================================
  // RENDER LOGIC
  // ============================================================

  function render(container) {
    cleanup();
    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <div class="page-header-left">
            <div>
              <h1 class="page-title">Zahlensysteme & Speicher</h1>
              <p class="page-subtitle">Umrechnung, Speicherbedarf und Datenübertragung (IHK-konform).</p>
            </div>
          </div>
        </div>
        <nav class="module-tabs">
          <button class="module-tab ${currentTab === 'explanation' ? 'active' : ''}" data-tab="explanation">Anleitung</button>
          <button class="module-tab ${currentTab === 'exercise' ? 'active' : ''}" data-tab="exercise">Übung</button>
        </nav>
        <div id="nsContent" class="view-enter" style="margin-top: var(--space-6)"></div>
      </div>
    `;
    setupTabEvents(container);
    renderCurrentTab();
  }

  function setupTabEvents(container) {
    container.querySelectorAll('.module-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        container.querySelectorAll('.module-tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderCurrentTab();
      });
    });
  }

  function renderCurrentTab() {
    const content = document.getElementById('nsContent');
    if (!content) return;
    if (currentTab === 'explanation') renderExplanation(content);
    else renderExerciseLayout(content);
  }

  function renderExplanation(container) {
    container.innerHTML = `
      <div class="view-enter">
        <div class="module-exercise-card">
          <h3 class="comm-section-title">Grundlagen & Einheiten</h3>
          <div class="module-steps">
            <div class="module-step">
              <div class="module-step-title">1. SI vs. IEC Präfixe</div>
              <div class="module-step-text"><b>SI (1000er):</b> Übertragung (Mbit/s). <b>IEC (1024er):</b> Speicher (MiB, KiB).</div>
            </div>
            <div class="module-step">
              <div class="module-step-title">2. Hexadezimal-Regeln</div>
              <div class="module-step-text">Basis 16. Ziffern: 0-9 und <b>A (10), B (11), C (12), D (13), E (14), F (15)</b>.</div>
            </div>
            <div class="module-step">
              <div class="module-step-title">3. Der 4-Bit Shortcut</div>
              <div class="module-step-text">Jede Hex-Stelle entspricht genau 4 Bit. <br>F = 1111, 0 = 0000.</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderExerciseLayout(container) {
    const sc = SCENARIOS[currentScenarioIdx];
    container.innerHTML = `
      <div class="module-exercise-card view-enter">
        <div class="scenario-nav">
          <span class="scenario-nav-label">Szenario</span>
          <div class="scenario-nav-controls">
            <button class="scenario-nav-btn" id="prevScen" ${currentScenarioIdx === 0 ? 'disabled' : ''}>&larr;</button>
            <span class="scenario-nav-current">${currentScenarioIdx + 1} / ${SCENARIOS.length}</span>
            <button class="scenario-nav-btn" id="nextScen" ${currentScenarioIdx === SCENARIOS.length - 1 ? 'disabled' : ''}>&rarr;</button>
          </div>
        </div>
        <h3 style="margin-bottom: var(--space-2)">${sc.title}</h3>
        <p class="comm-text" style="margin-bottom: var(--space-6)">${sc.description}</p>
        <div id="exerciseSpecificContent"></div>
      </div>
    `;
    const exContent = container.querySelector('#exerciseSpecificContent');
    if (sc.id === 'converter') renderConverter(exContent);
    else if (sc.id === 'storage') renderStorage(exContent);
    else renderTransfer(exContent);
    setupNav(container);
  }

  function setupNav(container) {
    container.querySelector('#prevScen')?.addEventListener('click', () => {
      if (currentScenarioIdx > 0) {
        currentScenarioIdx--;
        currentExercise = null;
        renderCurrentTab();
      }
    });
    container.querySelector('#nextScen')?.addEventListener('click', () => {
      if (currentScenarioIdx < SCENARIOS.length - 1) {
        currentScenarioIdx++;
        currentExercise = null;
        renderCurrentTab();
      }
    });
  }

  function renderConverter(container) {
    if (!currentExercise || currentExercise.type !== 'converter') {
      currentExercise = generateConverterExercise(difficulty);
    }
    const ex = currentExercise;
    container.innerHTML = `
      <div class="subnet-grid">
        <div class="subnet-input-group"><label class="subnet-label">Dezimal</label><input type="number" class="subnet-input" id="inpDec"></div>
        <div class="subnet-input-group"><label class="subnet-label">Binär</label><input type="text" class="subnet-input module-input-mono" id="inpBin"></div>
        <div class="subnet-input-group"><label class="subnet-label">Hexadezimal</label><input type="text" class="subnet-input module-input-mono" id="inpHex"></div>
      </div>
      <div class="module-difficulty" style="margin: var(--space-6) 0">
        <button class="module-diff-btn ${difficulty === 1 ? 'active' : ''}" data-d="1">Leicht</button>
        <button class="module-diff-btn ${difficulty === 2 ? 'active' : ''}" data-d="2">Mittel</button>
        <button class="module-diff-btn ${difficulty === 3 ? 'active' : ''}" data-d="3">Schwer</button>
      </div>
      <div class="module-actions">
        <button class="btn btn-primary" id="btnCheckConv">Prüfen</button>
        <button class="btn" id="btnSolveConv">Lösungsweg</button>
        <button class="btn" id="btnNextConv">Neu</button>
      </div>
      <div id="convSol" class="module-steps" style="display:none; margin-top: var(--space-6)"></div>
    `;
    const inputs = { inpDec: container.querySelector('#inpDec'), inpBin: container.querySelector('#inpBin'), inpHex: container.querySelector('#inpHex') };
    const fields = ['inpDec', 'inpBin', 'inpHex'];
    const values = [ex.dec, ex.bin, ex.hex];
    inputs[fields[ex.givenIdx]].value = values[ex.givenIdx];
    inputs[fields[ex.givenIdx]].disabled = true;
    inputs[fields[ex.givenIdx]].classList.add('correct');

    container.querySelectorAll('.module-diff-btn').forEach(b => {
      b.addEventListener('click', () => { difficulty = parseInt(b.dataset.d); currentExercise = null; renderConverter(container); });
    });
    container.querySelector('#btnNextConv').addEventListener('click', () => { currentExercise = generateConverterExercise(difficulty); renderConverter(container); });
    container.querySelector('#btnCheckConv').addEventListener('click', () => {
      const uDec = parseInt(inputs.inpDec.value, 10);
      const uBin = inputs.inpBin.value.trim();
      const uHex = inputs.inpHex.value.trim().toUpperCase();
      inputs.inpDec.classList.toggle('correct', uDec === ex.dec);
      inputs.inpBin.classList.toggle('correct', uBin === ex.bin);
      inputs.inpHex.classList.toggle('correct', uHex === ex.hex);
    });
    container.querySelector('#btnSolveConv').addEventListener('click', () => {
       const solEl = container.querySelector('#convSol');
       solEl.style.display = 'block';
       solEl.innerHTML = CardRenderer.formatAnswer(ex.steps);
       inputs.inpDec.value = ex.dec; inputs.inpBin.value = ex.bin; inputs.inpHex.value = ex.hex;
    });
  }

  function renderStorage(container) {
    if (!currentExercise || !['image', 'audio', 'struct'].includes(currentExercise.type)) {
      currentExercise = generateStorageExercise(difficulty);
    }
    const ex = currentExercise;
    const isStruct = ex.type === 'struct';
    container.innerHTML = `
      <div class="module-exercise-question">${CardRenderer.formatAnswer(ex.desc)}</div>
      <div class="subnet-grid">
        ${isStruct ? `
          <div class="subnet-input-group"><label class="subnet-label">da) Geometrie (KiB)</label><input type="text" class="subnet-input" id="inpA"></div>
          <div class="subnet-input-group"><label class="subnet-label">db) Anzahl Farben</label><input type="text" class="subnet-input" id="inpB"></div>
          <div class="subnet-input-group"><label class="subnet-label">dc) Zuwachs (%)</label><input type="text" class="subnet-input" id="inpC"></div>
        ` : `<div class="subnet-input-group"><label class="subnet-label">Speicher (MiB)</label><input type="text" class="subnet-input" id="inpRes"></div>`}
      </div>
      <div class="module-actions">
        <button class="btn btn-primary" id="btnCheckStore">Prüfen</button>
        <button class="btn" id="btnSolveStore">Lösungsweg</button>
        <button class="btn" id="btnNextStore">Neu</button>
      </div>
      <div id="storeSol" class="module-steps" style="display:none; margin-top: var(--space-6)"></div>
    `;
    container.querySelector('#btnNextStore').addEventListener('click', () => { currentExercise = generateStorageExercise(difficulty); renderStorage(container); });
    container.querySelector('#btnCheckStore').addEventListener('click', () => {
      if (isStruct) {
        const okA = Math.abs(parseFloat(container.querySelector('#inpA').value.replace(',', '.')) - parseFloat(ex.sol.val_a)) < 1;
        const okB = container.querySelector('#inpB').value.replace(/\./g, '') === ex.sol.val_b;
        const okC = Math.abs(parseFloat(container.querySelector('#inpC').value.replace(',', '.')) - parseFloat(ex.sol.val_c)) < 0.5;
        container.querySelector('#inpA').classList.toggle('correct', okA);
        container.querySelector('#inpB').classList.toggle('correct', okB);
        container.querySelector('#inpC').classList.toggle('correct', okC);
      } else {
        const val = parseFloat(container.querySelector('#inpRes').value.replace(',', '.'));
        container.querySelector('#inpRes').classList.toggle('correct', Math.abs(val - parseFloat(ex.sol.display)) < 0.1);
      }
    });
    container.querySelector('#btnSolveStore').addEventListener('click', () => {
      const solEl = container.querySelector('#storeSol');
      solEl.style.display = 'block';
      solEl.innerHTML = CardRenderer.formatAnswer(ex.sol.steps);
    });
  }

  function renderTransfer(container) {
    if (!currentExercise || currentExercise.type !== 'transfer') {
      currentExercise = generateTransferExercise(difficulty);
    }
    const ex = currentExercise;
    container.innerHTML = `
      <div class="module-exercise-question">${CardRenderer.formatAnswer(`Dauer für **${ex.sizeGB} GiB** bei **${ex.speedMbit} Mbit/s**?`)}</div>
      <div class="subnet-grid">
        <div class="subnet-input-group"><label class="subnet-label">Std</label><input type="number" class="subnet-input" id="inpH"></div>
        <div class="subnet-input-group"><label class="subnet-label">Min</label><input type="number" class="subnet-input" id="inpM"></div>
        <div class="subnet-input-group"><label class="subnet-label">Sek</label><input type="number" class="subnet-input" id="inpS"></div>
      </div>
      <div class="module-actions">
        <button class="btn btn-primary" id="btnCheckTrans">Prüfen</button>
        <button class="btn" id="btnSolveTrans">Lösungsweg</button>
        <button class="btn" id="btnNextTrans">Neu</button>
      </div>
      <div id="transSol" class="module-steps" style="display:none; margin-top: var(--space-6)"></div>
    `;
    container.querySelector('#btnNextTrans').addEventListener('click', () => { currentExercise = generateTransferExercise(difficulty); renderTransfer(container); });
    container.querySelector('#btnCheckTrans').addEventListener('click', () => {
        const userSec = parseInt(container.querySelector('#inpH').value || 0) * 3600 + parseInt(container.querySelector('#inpM').value || 0) * 60 + parseInt(container.querySelector('#inpS').value || 0);
        const ok = Math.abs(userSec - ex.seconds) <= 2;
        container.querySelectorAll('.subnet-input').forEach(i => i.classList.toggle('correct', ok));
    });
    container.querySelector('#btnSolveTrans').addEventListener('click', () => {
      const solEl = container.querySelector('#transSol');
      solEl.style.display = 'block';
      solEl.innerHTML = CardRenderer.formatAnswer(ex.steps);
    });
  }

  function cleanup() { cleanup_fns.forEach((fn) => fn()); cleanup_fns = []; }
  return { render, cleanup };
})();

export default NumberSystemsView;