// ============================================================
// pseudocode.js — Pseudocode Trainer (Exam Edition)
// Fill-in-the-Blanks logic for IHK AP1 preparation.
// ============================================================

const PseudocodeView = (() => {
  let currentScenarioIdx = 0;
  let score = 0;
  let cleanup_fns = [];

  // ============================================================
  // DATA: 10 Exam-style Scenarios
  // ============================================================

  const SCENARIOS = [
    {
      id: 1,
      title: 'EAN-Prüfziffer (Gewichtung)',
      description: 'Berechne die Prüfziffer für einen 13-stelligen EAN-Code. Die Stellen werden abwechselnd mit 1 und 3 gewichtet.',
      code: `summe = 0
FÜR i VON 0 BIS 11 MACHE
  WENN {{0}} == 0 DANN
    summe = summe + ean[i] * 1
  SONST
    summe = summe + ean[i] * {{1}}
  ENDE WENN
ENDE FÜR
pruefziffer = (10 - ({{2}} % 10)) % 10`,
      solution: ['i % 2', '3', 'summe'],
      pool: ['i % 2', '3', 'summe', 'ean.laenge', '10', 'i / 2']
    },
    {
      id: 2,
      title: 'Lineare Suche mit Flag',
      description: 'Suche eine Artikelnummer im Lager-Array. Setze einen Indikator, wenn der Artikel gefunden wurde.',
      code: `gefunden = {{0}}
i = 0
SOLANGE {{1}} < lager.laenge UND gefunden == FALSCH MACHE
  WENN lager[i].id == {{2}} DANN
    gefunden = WAHR
    position = i
  ENDE WENN
  i = i + 1
ENDE SOLANGE`,
      solution: ['FALSCH', 'i', 'suchID'],
      pool: ['FALSCH', 'i', 'suchID', 'WAHR', '0', 'lager[i]']
    },
    {
      id: 3,
      title: 'Zweistufige Provision',
      description: 'Berechne die Provision: Unter 10.000€ Umsatz gibt es 2%, ab 10.000€ gibt es 5% auf den gesamten Umsatz.',
      code: `provision = 0
WENN umsatz < {{0}} DANN
  provision = umsatz * {{1}}
{{2}}
  provision = umsatz * 0.05
ENDE WENN
AUSGABE provision`,
      solution: ['10000', '0.02', 'SONST'],
      pool: ['10000', '0.02', 'SONST', 'DANN', '5000', '0.05']
    },
    {
      id: 4,
      title: 'Maximum-Suche',
      description: 'Finde den höchsten Messwert in einer Liste von Temperaturdaten.',
      code: `maxTemp = temperaturen[0]
FÜR i VON 1 BIS {{0}} MACHE
  WENN {{1}} > maxTemp DANN
    maxTemp = {{2}}
  ENDE WENN
ENDE FÜR`,
      solution: ['temperaturen.laenge - 1', 'temperaturen[i]', 'temperaturen[i]'],
      pool: ['temperaturen.laenge - 1', 'temperaturen[i]', 'i', 'maxTemp', 'temperaturen.laenge', '0']
    },
    {
      id: 5,
      title: 'Bestand & Nachbestellung',
      description: 'Prüfe den Bestand. Wenn dieser unter den Meldebestand fällt, berechne die Bestellmenge (Soll - Ist).',
      code: `FÜR JEDEN artikel IN lager MACHE
  WENN artikel.istBestand < {{0}} DANN
    bestellmenge = {{1}} - artikel.istBestand
    {{2}}(artikel.id, bestellmenge)
  ENDE WENN
ENDE FÜR`,
      solution: ['artikel.meldebestand', 'artikel.sollBestand', 'nachbestellen'],
      pool: ['artikel.meldebestand', 'artikel.sollBestand', 'nachbestellen', 'WAHR', 'artikel.id', '0']
    },
    {
      id: 6,
      title: 'Modulo-Logik (Schaltjahr)',
      description: 'Ein Jahr ist ein Schaltjahr, wenn es durch 4 teilbar ist, aber nicht durch 100 (außer es ist durch 400 teilbar).',
      code: `istSchaltjahr = FALSCH
WENN (jahr % 4 == 0 UND jahr % 100 != 0) {{0}} (jahr % 400 == 0) DANN
  {{1}} = WAHR
ENDE WENN
{{2}} istSchaltjahr`,
      solution: ['ODER', 'istSchaltjahr', 'RÜCKGABE'],
      pool: ['ODER', 'istSchaltjahr', 'RÜCKGABE', 'UND', 'jahr', 'AUSGABE']
    },
    {
      id: 7,
      title: 'Mittelwert von Verkäufen',
      description: 'Berechne den Durchschnittswert aller Verkäufe, die größer als 0 sind.',
      code: `summe = 0
anzahl = 0
FÜR i VON 0 BIS verkauf.laenge - 1 MACHE
  WENN verkauf[i] > 0 DANN
    summe = {{0}} + verkauf[i]
    anzahl = anzahl + {{1}}
  ENDE WENN
ENDE FÜR
mittelwert = summe / {{2}}`,
      solution: ['summe', '1', 'anzahl'],
      pool: ['summe', '1', 'anzahl', 'i', '0', 'verkauf.laenge']
    },
    {
      id: 8,
      title: 'Matrix-Durchlauf (Sitzplan)',
      description: 'Zähle alle belegten Sitze (Wert 1) in einem Kinosaal (2D-Array).',
      code: `belegtCount = 0
FÜR reihe VON 0 BIS reihenAnzahl - 1 MACHE
  FÜR sitz VON 0 BIS {{0}} MACHE
    WENN saal[{{1}}][sitz] == 1 DANN
      belegtCount = {{2}}
    ENDE WENN
  ENDE FÜR
ENDE FÜR`,
      solution: ['sitzeProReihe - 1', 'reihe', 'belegtCount + 1'],
      pool: ['sitzeProReihe - 1', 'reihe', 'belegtCount + 1', 'sitz', '1', 'belegtCount']
    },
    {
      id: 9,
      title: 'String-Validierung',
      description: 'Ein Passwort muss mindestens 8 Zeichen lang sein und das Sonderzeichen "!" enthalten.',
      code: `passwortOK = FALSCH
WENN passwort.laenge >= 8 DANN
  WENN {{0}}(passwort, "!") == WAHR DANN
    {{1}} = WAHR
  ENDE WENN
ENDE WENN
{{2}} passwortOK`,
      solution: ['enthaelt', 'passwortOK', 'RÜCKGABE'],
      pool: ['enthaelt', 'passwortOK', 'RÜCKGABE', 'WAHR', '8', 'suche']
    },
    {
      id: 10,
      title: 'Bubble-Sort Tauschlogik',
      description: 'Implementiere den Tausch zweier Elemente in einem Array, wenn das linke Element größer als das rechte ist.',
      code: `WENN liste[i] > liste[i+1] DANN
  temp = {{0}}
  liste[i] = {{1}}
  {{2}} = temp
ENDE WENN`,
      solution: ['liste[i]', 'liste[i+1]', 'liste[i+1]'],
      pool: ['liste[i]', 'liste[i+1]', 'liste[i+1]', 'liste[i-1]', 'temp', 'i']
    }
  ];

  // ============================================================
  // CORE FUNCTIONS
  // ============================================================

  function render(container) {
    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <div class="page-header-left">
            <div>
              <h1 class="page-title">Pseudocode-Trainer</h1>
              <p class="page-subtitle">Interaktive Lückentexte auf IHK-Prüfungsniveau</p>
            </div>
          </div>
        </div>

        <div id="pseudoContent"></div>
      </div>
    `;

    renderScenario(document.getElementById('pseudoContent'));
  }

  function renderScenario(container) {
    const sc = SCENARIOS[currentScenarioIdx];
    
    // Create random pool from scenario pool data
    const shuffledPool = [...sc.pool].sort(() => Math.random() - 0.5);

    // Replace placeholders with drop zones
    let codeHtml = sc.code;
    sc.solution.forEach((_, i) => {
      codeHtml = codeHtml.replace(`{{${i}}}`, `<div class="pseudo-gap" data-index="${i}"></div>`);
    });

    // Highlight basic keywords
    codeHtml = highlightKeywords(codeHtml);

    container.innerHTML = `
      <div class="module-exercise-card">
        <div class="comm-training-header">
          <div>
            <h3 style="margin: 0;">${sc.title}</h3>
            <p class="comm-text" style="margin: 0; font-size: 12px; color: var(--text-tertiary);">${sc.description}</p>
          </div>
          <div class="comm-training-progress">
            <span>Aufgabe ${currentScenarioIdx + 1} / ${SCENARIOS.length}</span>
            <div class="comm-progress-bar" style="width: 80px;">
              <div class="comm-progress-fill" style="width: ${((currentScenarioIdx + 1) / SCENARIOS.length) * 100}%"></div>
            </div>
          </div>
        </div>

        <div class="pseudo-exam-container" style="margin-top: var(--space-6);">
          <div class="pseudo-code-display" id="codeDisplay">${codeHtml}</div>
        </div>

        <div class="pseudo-chip-pool">
          <div class="pseudo-pool-title">Bausteine (Drag & Drop)</div>
          <div class="pseudo-chips-grid" id="chipPool">
            ${shuffledPool.map((chip, i) => `
              <div class="pseudo-chip" draggable="true" data-id="chip-${i}">${chip}</div>
            `).join('')}
          </div>
        </div>

        <div class="module-actions">
          <button class="btn btn-primary" id="btnCheckPseudo" disabled>Lösung prüfen</button>
          <button class="btn btn-primary" id="btnNextPseudo" style="display:none">
            Nächste Aufgabe
            <span style="margin-left: 8px;">→</span>
          </button>
        </div>
        <div id="pseudoFeedback"></div>
      </div>
    `;

    setupDragAndDrop(container);

    container.querySelector('#btnCheckPseudo').addEventListener('click', () => {
      checkSolution(container);
    });

    container.querySelector('#btnNextPseudo').addEventListener('click', () => {
      currentScenarioIdx = (currentScenarioIdx + 1) % SCENARIOS.length;
      renderScenario(container);
    });
  }

  function setupDragAndDrop(container) {
    const chips = container.querySelectorAll('.pseudo-chip');
    const gaps = container.querySelectorAll('.pseudo-gap');
    const checkBtn = container.querySelector('#btnCheckPseudo');

    chips.forEach(chip => {
      chip.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', chip.textContent);
        e.dataTransfer.setData('source-id', chip.dataset.id);
        chip.classList.add('dragging');
      });

      chip.addEventListener('dragend', () => {
        chip.classList.remove('dragging');
      });

      // Mobile click support
      chip.addEventListener('click', () => {
        document.querySelectorAll('.pseudo-chip').forEach(c => c.style.borderColor = '');
        chip.style.borderColor = 'var(--accent-primary)';
        window.selectedPseudoChip = chip;
      });
    });

    gaps.forEach(gap => {
      gap.addEventListener('dragover', (e) => {
        e.preventDefault();
        gap.classList.add('drag-over');
      });

      gap.addEventListener('dragleave', () => {
        gap.classList.remove('drag-over');
      });

      gap.addEventListener('drop', (e) => {
        e.preventDefault();
        gap.classList.remove('drag-over');
        const text = e.dataTransfer.getData('text/plain');
        fillGap(gap, text);
      });

      // Mobile click support
      gap.addEventListener('click', () => {
        if (window.selectedPseudoChip) {
          fillGap(gap, window.selectedPseudoChip.textContent);
          window.selectedPseudoChip.style.borderColor = '';
          window.selectedPseudoChip = null;
        } else if (gap.classList.contains('filled')) {
          // Clear gap on click
          gap.textContent = '';
          gap.classList.remove('filled', 'correct', 'wrong');
          checkCompletion();
        }
      });
    });

    function fillGap(gap, text) {
      gap.textContent = text;
      gap.classList.add('filled');
      gap.classList.remove('correct', 'wrong');
      checkCompletion();
    }

    function checkCompletion() {
      const filledGaps = container.querySelectorAll('.pseudo-gap.filled');
      checkBtn.disabled = filledGaps.length < SCENARIOS[currentScenarioIdx].solution.length;
    }
  }

  function checkSolution(container) {
    const sc = SCENARIOS[currentScenarioIdx];
    const gaps = container.querySelectorAll('.pseudo-gap');
    let correctCount = 0;

    gaps.forEach((gap, i) => {
      const userVal = gap.textContent.trim();
      const correctVal = sc.solution[i].trim();

      gap.classList.remove('correct', 'wrong');
      if (userVal === correctVal) {
        gap.classList.add('correct');
        correctCount++;
      } else {
        gap.classList.add('wrong');
      }
    });

    const feedback = container.querySelector('#pseudoFeedback');
    const checkBtn = container.querySelector('#btnCheckPseudo');
    const nextBtn = container.querySelector('#btnNextPseudo');

    if (correctCount === sc.solution.length) {
      feedback.innerHTML = `
        <div class="module-feedback module-feedback-success" style="margin-top: var(--space-4)">
          <strong>Hervorragend!</strong> Der Algorithmus ist logisch korrekt vervollständigt.
        </div>
      `;
      checkBtn.style.display = 'none';
      nextBtn.style.display = 'inline-block';
    } else {
      feedback.innerHTML = `
        <div class="module-feedback module-feedback-error" style="margin-top: var(--space-4)">
          <strong>Nicht ganz...</strong> Einige Bausteine sind noch an der falschen Stelle. Korrigiere die rot markierten Felder.
        </div>
      `;
    }
  }

  function highlightKeywords(code) {
    const keywords = ['WENN', 'DANN', 'SONST', 'ENDE WENN', 'SOLANGE', 'MACHE', 'ENDE SOLANGE', 'FÜR', 'VON', 'BIS', 'FÜR JEDEN', 'IN', 'ENDE FÜR', 'AUSGABE', 'RÜCKGABE', 'WAHR', 'FALSCH', 'UND', 'ODER', 'ABBRECHEN'];
    let html = code;
    keywords.forEach(kw => {
      const reg = new RegExp(`\\b${kw}\\b`, 'g');
      html = html.replace(reg, `<span class="kw">${kw}</span>`);
    });
    return html;
  }

  function cleanup() {
    cleanup_fns.forEach(fn => fn());
    cleanup_fns = [];
    window.selectedPseudoChip = null;
  }

  return { render, cleanup };
})();

export default PseudocodeView;
