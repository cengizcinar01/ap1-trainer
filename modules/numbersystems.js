// ============================================================
// numbersystems.js — Zahlensysteme & Speichergrößen
// Modernized IHK-focused learning module.
// ============================================================

const NumberSystemsView = (() => {
  let currentTab = 'explanation';
  let cleanup_fns = [];

  // ============================================================
  // DATA STRUCTURES
  // ============================================================

  const _UNITS = {
    SI: [
      { label: 'KB (Kilobyte)', value: 1000 },
      { label: 'MB (Megabyte)', value: 1000 ** 2 },
      { label: 'GB (Gigabyte)', value: 1000 ** 3 },
      { label: 'TB (Terabyte)', value: 1000 ** 4 },
    ],
    IEC: [
      { label: 'KiB (Kibibyte)', value: 1024 },
      { label: 'MiB (Mebibyte)', value: 1024 ** 2 },
      { label: 'GiB (Gibibyte)', value: 1024 ** 3 },
      { label: 'TiB (Tebibyte)', value: 1024 ** 4 },
    ],
  };

  const QUIZ_QUESTIONS = [
    {
      q: 'Welcher Divisor wird bei der Umrechnung von Byte in MiB (Mebibyte) verwendet?',
      options: ['1.000.000', '1.024.000', '1.048.576', '1.073.741.824'],
      correct: 2,
      explain: '1 MiB = 1024 * 1024 Byte = 1.048.576 Byte.',
    },
    {
      q: 'Wie viele Bit werden benötigt, um eine Farbtiefe von "True Color" (16,7 Mio. Farben) darzustellen?',
      options: ['8 Bit', '16 Bit', '24 Bit', '32 Bit'],
      correct: 2,
      explain: '2^24 ergibt ca. 16,7 Millionen Farben (True Color).',
    },
    {
      q: 'Welche Hexadezimal-Zahl entspricht der Dezimalzahl 255?',
      options: ['F0', 'FE', 'FF', '100'],
      correct: 2,
      explain: 'FF (hex) = 15 * 16^1 + 15 * 16^0 = 240 + 15 = 255.',
    },
    {
      q: 'Was ist der Unterschied zwischen SI-Einheiten (MB) und IEC-Einheiten (MiB)?',
      options: [
        'Es gibt keinen Unterschied.',
        'SI basiert auf 1000, IEC basiert auf 1024.',
        'SI ist für RAM, IEC für Festplatten.',
        'SI wird nur in Europa verwendet.',
      ],
      correct: 1,
      explain:
        'SI-Präfixe (Kilo, Mega) nutzen die Basis 10 (10^3), IEC-Präfixe (Kibi, Mebi) nutzen die Basis 2 (2^10).',
    },
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
              <h1 class="page-title">Zahlensysteme & Speicher</h1>
              <p class="page-subtitle">Binärlogik, Umrechnungen und IEC/SI-Einheiten für die AP1.</p>
            </div>
          </div>
        </div>

        <nav class="module-tabs">
          <button class="module-tab ${currentTab === 'explanation' ? 'active' : ''}" data-tab="explanation">Erklärung</button>
          <button class="module-tab ${currentTab === 'converter' ? 'active' : ''}" data-tab="converter">Umrechner</button>
          <button class="module-tab ${currentTab === 'storage' ? 'active' : ''}" data-tab="storage">Speicher-Rechner</button>
          <button class="module-tab ${currentTab === 'quiz' ? 'active' : ''}" data-tab="quiz">Wissens-Check</button>
        </nav>

        <div id="nsContent" class="view-enter"></div>
      </div>
    `;

    setupTabEvents(container);
    renderCurrentTab();
  }

  function setupTabEvents(container) {
    container.querySelectorAll('.module-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        container
          .querySelectorAll('.module-tab')
          .forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderCurrentTab();
      });
    });
  }

  function renderCurrentTab() {
    const content = document.getElementById('nsContent');
    if (!content) return;

    switch (currentTab) {
      case 'explanation':
        renderExplanation(content);
        break;
      case 'converter':
        renderConverter(content);
        break;
      case 'storage':
        renderStorage(content);
        break;
      case 'quiz':
        renderQuiz(content);
        break;
    }
  }

  // ============================================================
  // TAB 1: EXPLANATION
  // ============================================================

  function renderExplanation(container) {
    container.innerHTML = `
      <div class="ns-explanation">
        <div class="module-exercise-card">
          <h3 class="comm-section-title">Grundlagen der Datendarstellung</h3>
          <p class="comm-text">
            Computer arbeiten intern ausschließlich mit zwei Zuständen: 0 und 1 (Binärsystem). 
            Zur besseren Lesbarkeit nutzen wir im IT-Bereich das Hexadezimalsystem. 
            Bei Speicherangaben ist die Unterscheidung zwischen 1000er und 1024er Basis kritisch für die AP1.
          </p>
        </div>

        <div class="ns-card-grid">
          <div class="ns-info-card">
            <span class="ns-card-header">Basis 2</span>
            <div class="ns-card-title">Binärsystem</div>
            <p class="ns-card-text">Nutzt nur 0 und 1. Jede Stelle entspricht einer Zweierpotenz (1, 2, 4, 8, 16...).</p>
          </div>
          <div class="ns-info-card">
            <span class="ns-card-header">Basis 16</span>
            <div class="ns-card-title">Hexadezimalsystem</div>
            <p class="ns-card-text">Nutzt 0-9 und A-F. Sehr kompakt: 2 Hex-Ziffern stellen genau 1 Byte (8 Bit) dar.</p>
          </div>
          <div class="ns-info-card">
            <span class="ns-card-header">IEC (Basis 2)</span>
            <div class="ns-card-title">Kibi, Mebi, Gibi</div>
            <p class="ns-card-text">Rechnet mit Faktor 1024. Wichtig für RAM und Betriebssystem-Anzeigen.</p>
          </div>
          <div class="ns-info-card">
            <span class="ns-card-header">SI (Basis 10)</span>
            <div class="ns-card-title">Kilo, Mega, Giga</div>
            <p class="ns-card-text">Rechnet mit Faktor 1000. Typisch für Festplattenhersteller und Netzwerk-Speeds.</p>
          </div>
        </div>

        <div class="module-steps">
          <div class="module-steps-title">Wichtige Prüfungs-Formeln</div>
          <div class="module-step">
            <div class="module-step-title">Bildspeicher-Berechnung</div>
            <div class="module-step-text">Breite × Höhe × Farbtiefe (in Bit) / 8 = Speicherbedarf in Byte.</div>
          </div>
          <div class="module-step">
            <div class="module-step-title">Übertragungszeit</div>
            <div class="module-step-text">Zeit (s) = Datenmenge (Bit) / Übertragungsrate (Bit/s). Achtung: Mebibyte ≠ Megabit!</div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // TAB 2: CONVERTER
  // ============================================================

  function renderConverter(container) {
    container.innerHTML = `
      <div class="ns-converter-card">
        <h3>System-Umrechner</h3>
        <p class="comm-text">Gib einen Wert ein, um die automatische Umrechnung in andere Systeme zu sehen.</p>
        
        <div class="module-input-grid">
          <div class="module-input-group">
            <label class="module-label">Dezimal</label>
            <input type="number" id="inpDec" class="module-input" placeholder="z.B. 255">
          </div>
          <div class="module-input-group">
            <label class="module-label">Binär</label>
            <input type="text" id="inpBin" class="module-input module-input-mono" placeholder="z.B. 11111111">
          </div>
          <div class="module-input-group">
            <label class="module-label">Hexadezimal</label>
            <input type="text" id="inpHex" class="module-input module-input-mono" placeholder="z.B. FF">
          </div>
        </div>

        <div class="ns-result-grid" id="convResults">
           <!-- Dynamically filled -->
        </div>

        <div id="nsCalculationSteps" style="margin-top: var(--space-8);">
           <!-- Detailed steps shown here -->
        </div>
      </div>
    `;

    setupConverterEvents(container);
  }

  function setupConverterEvents(container) {
    const inpDec = container.querySelector('#inpDec');
    const inpBin = container.querySelector('#inpBin');
    const inpHex = container.querySelector('#inpHex');
    const stepsEl = container.querySelector('#nsCalculationSteps');

    function updateSteps(decimalValue) {
      if (Number.isNaN(decimalValue) || decimalValue < 0) {
        stepsEl.innerHTML = '';
        return;
      }

      let html =
        '<div class="module-steps"><h4 class="module-steps-title">Rechenweg (Manuelle Umrechnung)</h4>';

      // 1. Dezimal -> Binär (Restwertmethode)
      let tempDec = decimalValue;
      const binSteps = [];
      if (tempDec === 0) binSteps.push('0 / 2 = 0 Rest 0');
      while (tempDec > 0) {
        const res = Math.floor(tempDec / 2);
        const rem = tempDec % 2;
        binSteps.push(`${tempDec} / 2 = ${res} Rest <strong>${rem}</strong>`);
        tempDec = res;
      }

      html += `
        <div class="module-step">
          <div class="module-step-title">Dezimal → Binär (Restwertmethode)</div>
          <div class="module-step-text">Teile die Zahl wiederholt durch 2 und notiere den Rest. Lies die Reste von unten nach oben.</div>
          <div class="module-step-detail">${binSteps.join('\n')}</div>
        </div>
      `;

      // 2. Dezimal -> Hexadezimal
      tempDec = decimalValue;
      const hexSteps = [];
      const hexChars = '0123456789ABCDEF';
      if (tempDec === 0) hexSteps.push('0 / 16 = 0 Rest 0');
      while (tempDec > 0) {
        const res = Math.floor(tempDec / 16);
        const rem = tempDec % 16;
        hexSteps.push(
          `${tempDec} / 16 = ${res} Rest ${rem} (${hexChars[rem]})`
        );
        tempDec = res;
      }

      html += `
        <div class="module-step">
          <div class="module-step-title">Dezimal → Hexadezimal</div>
          <div class="module-step-text">Teile die Zahl durch 16. Der Rest ergibt die Hex-Ziffer (10=A, 11=B...).</div>
          <div class="module-step-detail">${hexSteps.join('\n')}</div>
        </div>
      `;

      // 3. Binär -> Dezimal (Stellenwertverfahren)
      const binStr = decimalValue.toString(2);
      const binToDecSteps = [];
      const sumParts = [];
      for (let i = 0; i < binStr.length; i++) {
        const bit = binStr[binStr.length - 1 - i];
        const val = parseInt(bit, 10) * 2 ** i;
        if (bit === '1') {
          binToDecSteps.push(`2^${i} = ${val}`);
          sumParts.push(val);
        }
      }

      html += `
        <div class="module-step">
          <div class="module-step-title">Binär → Dezimal (Stellenwertverfahren)</div>
          <div class="module-step-text">Addiere die Zweierpotenzen der Stellen, an denen eine '1' steht.</div>
          <div class="module-step-detail">${binToDecSteps.reverse().join('\n')}\n---\nSumme: ${sumParts.join(' + ')} = <strong>${decimalValue}</strong></div>
        </div>
      `;

      html += '</div>';
      stepsEl.innerHTML = html;
    }

    inpDec.addEventListener('input', () => {
      const val = parseInt(inpDec.value, 10);
      if (!Number.isNaN(val)) {
        inpBin.value = val.toString(2);
        inpHex.value = val.toString(16).toUpperCase();
        updateSteps(val);
      } else {
        inpBin.value = '';
        inpHex.value = '';
        updateSteps(NaN);
      }
    });

    inpBin.addEventListener('input', () => {
      const val = parseInt(inpBin.value, 2);
      if (!Number.isNaN(val)) {
        inpDec.value = val;
        inpHex.value = val.toString(16).toUpperCase();
        updateSteps(val);
      } else {
        updateSteps(NaN);
      }
    });

    inpHex.addEventListener('input', () => {
      const val = parseInt(inpHex.value, 16);
      if (!Number.isNaN(val)) {
        inpDec.value = val;
        inpBin.value = val.toString(2);
        updateSteps(val);
      } else {
        updateSteps(NaN);
      }
    });
  }

  // ============================================================
  // TAB 3: STORAGE CALCULATOR
  // ============================================================

  function renderStorage(container) {
    container.innerHTML = `
      <div class="ns-explanation">
        <div class="module-exercise-card">
          <h3>Bildspeicher-Rechner</h3>
          <div class="ns-calc-grid">
            <div class="module-input-group">
              <label class="module-label">Breite (px)</label>
              <input type="number" id="imgW" class="module-input" value="1920">
            </div>
            <div class="module-input-group">
              <label class="module-label">Höhe (px)</label>
              <input type="number" id="imgH" class="module-input" value="1080">
            </div>
            <div class="module-input-group">
              <label class="module-label">Farbtiefe (Bit)</label>
              <select id="imgD" class="module-input">
                <option value="8">8 Bit (256 Farben)</option>
                <option value="16">16 Bit (High Color)</option>
                <option value="24" selected>24 Bit (True Color)</option>
                <option value="32">32 Bit (True Color + Alpha)</option>
              </select>
            </div>
          </div>
          
          <div class="ns-calc-result-box">
            <div class="ns-calc-res-label">Speicherbedarf</div>
            <div class="ns-calc-res-value" id="imgRes">---</div>
          </div>
        </div>

        <div class="module-exercise-card" style="margin-top: var(--space-6);">
          <h3>Einheiten-Vergleich</h3>
          <table class="ns-comparison-table">
            <thead>
              <tr>
                <th>Präfix</th>
                <th>IEC (Basis 2)</th>
                <th>SI (Basis 10)</th>
                <th>Differenz</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Kilo / Kibi</td><td>1.024 Byte</td><td>1.000 Byte</td><td>2.4%</td></tr>
              <tr><td>Mega / Mebi</td><td>1.048.576 Byte</td><td>1.000.000 Byte</td><td>4.8%</td></tr>
              <tr><td>Giga / Gibi</td><td>1.073.741.824 Byte</td><td>1.000.000.000 Byte</td><td>7.3%</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    setupStorageEvents(container);
  }

  function setupStorageEvents(container) {
    const w = container.querySelector('#imgW');
    const h = container.querySelector('#imgH');
    const d = container.querySelector('#imgD');
    const res = container.querySelector('#imgRes');

    function calc() {
      const bytes =
        (parseInt(w.value, 10) *
          parseInt(h.value, 10) *
          parseInt(d.value, 10)) /
        8;
      const mib = bytes / (1024 * 1024);
      res.textContent = `${mib.toFixed(2)} MiB`;
    }

    [w, h, d].forEach((el) => el.addEventListener('input', calc));
    calc();
  }

  // ============================================================
  // TAB 4: QUIZ
  // ============================================================

  function renderQuiz(container) {
    container.innerHTML = `
      <div class="comm-quiz">
        <div class="comm-quiz-header">
          <div class="comm-quiz-progress">
            <span class="comm-progress-text">Fortschritt</span>
            <div class="comm-progress-bar"><div class="comm-progress-fill" style="width: 0%"></div></div>
          </div>
          <div class="comm-quiz-score" id="nsQuizScore">Score: 0 / ${QUIZ_QUESTIONS.length}</div>
        </div>
        <div id="nsQuizList">
          ${QUIZ_QUESTIONS.map(
            (q, i) => `
            <div class="module-exercise-card ns-quiz-card" style="margin-bottom: var(--space-4)" data-idx="${i}">
              <p class="module-exercise-question"><strong>Frage ${i + 1}:</strong> ${q.q}</p>
              <div class="ns-quiz-options">
                ${q.options
                  .map(
                    (opt, oi) => `
                  <div class="ns-quiz-option" data-oi="${oi}">${opt}</div>
                `
                  )
                  .join('')}
              </div>
              <div class="quiz-feedback" style="display:none; margin-top: var(--space-4);"></div>
            </div>
          `
          ).join('')}
        </div>
        <div id="nsFinalResult"></div>
      </div>
    `;

    setupQuizEvents(container);
  }

  function setupQuizEvents(container) {
    const cards = container.querySelectorAll('.ns-quiz-card');
    const progressFill = container.querySelector('.comm-progress-fill');
    const scoreDisplay = container.querySelector('#nsQuizScore');

    let answeredCount = 0;
    let correctCount = 0;

    cards.forEach((card) => {
      const idx = parseInt(card.dataset.idx, 10);
      const question = QUIZ_QUESTIONS[idx];
      const options = card.querySelectorAll('.ns-quiz-option');
      const feedback = card.querySelector('.quiz-feedback');

      options.forEach((opt) => {
        opt.addEventListener('click', () => {
          if (card.dataset.answered === 'true') return;
          card.dataset.answered = 'true';
          answeredCount++;

          const selIdx = parseInt(opt.dataset.oi, 10);
          const isCorrect = selIdx === question.correct;
          if (isCorrect) correctCount++;

          options.forEach((o, i) => {
            if (i === question.correct) o.classList.add('correct');
            else if (i === selIdx) o.classList.add('wrong');
          });

          progressFill.style.width = `${(answeredCount / QUIZ_QUESTIONS.length) * 100}%`;
          scoreDisplay.textContent = `Score: ${correctCount} / ${QUIZ_QUESTIONS.length}`;
          feedback.style.display = 'block';
          feedback.innerHTML = `<div class="module-feedback ${isCorrect ? 'module-feedback-success' : 'module-feedback-error'}">
            <strong>${isCorrect ? 'Richtig!' : 'Falsch.'}</strong> ${question.explain}
          </div>`;
        });
      });
    });
  }

  function cleanup() {
    cleanup_fns.forEach((fn) => fn());
    cleanup_fns = [];
  }

  return { render, cleanup };
})();

export default NumberSystemsView;
