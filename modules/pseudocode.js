// ============================================================
// pseudocode.js — Pseudocode Trainer Module (Modul 8)
// Tabs: Code-Puzzle, Fehler-Finder, Schreibtischtest
// ============================================================

const PseudocodeView = (() => {
    let currentTab = 'puzzle';
    let currentPuzzle = 0;
    let currentErrorCase = 0;
    let currentTrace = 0;
    let dragSrcEl = null;

    // ============================================================
    // DATA: Code Puzzles
    // ============================================================
    const PUZZLES = [
        {
            id: 1,
            title: 'Rabattberechnung',
            difficulty: 'Leicht',
            description: 'Ordne die Zeilen so, dass der Rabatt korrekt berechnet wird.',
            correctOrder: [
                'rabatt = 0',
                'WENN bestellwert > 100 DANN',
                '  rabatt = 10',
                'SONST',
                '  rabatt = 0',
                'ENDE WENN',
                'ausgabe = bestellwert - rabatt'
            ],
            scrambled: [
                '  rabatt = 10',
                'WENN bestellwert > 100 DANN',
                'ausgabe = bestellwert - rabatt',
                'SONST',
                'rabatt = 0',
                'ENDE WENN',
                '  rabatt = 0'
            ]
        },
        {
            id: 2,
            title: 'Bubble Sort (Innen)',
            difficulty: 'Mittel',
            description: 'Sortiere die Zeilen für den inneren Tausch-Logik eines Bubble Sorts.',
            correctOrder: [
                'WENN array[i] > array[i+1] DANN',
                '  temp = array[i]',
                '  array[i] = array[i+1]',
                '  array[i+1] = temp',
                'ENDE WENN'
            ],
            scrambled: [
                '  array[i] = array[i+1]',
                'WENN array[i] > array[i+1] DANN',
                'ENDE WENN',
                '  array[i+1] = temp',
                '  temp = array[i]'
            ]
        },
        {
            id: 3,
            title: 'Summe berechnen',
            difficulty: 'Leicht',
            description: 'Bringe die Schleife zur Berechnung der Summe von 1 bis n in die richtige Reihenfolge.',
            correctOrder: [
                'summe = 0',
                'i = 1',
                'SOLANGE i <= n MACHE',
                '  summe = summe + i',
                '  i = i + 1',
                'ENDE SOLANGE',
                'AUSGABE summe'
            ],
            scrambled: [
                '  i = i + 1',
                'SOLANGE i <= n MACHE',
                'summe = 0',
                'ENDE SOLANGE',
                '  summe = summe + i',
                'i = 1',
                'AUSGABE summe'
            ]
        }
    ];

    // ============================================================
    // DATA: Error Finder
    // ============================================================
    const ERRORS = [
        {
            id: 1,
            title: 'Endlosschleife',
            description: 'Finde den Fehler, der zu einer Endlosschleife führt.',
            code: [
                'x = 0',
                'SOLANGE x < 5 MACHE',
                '  AUSGABE x',
                '  x = x - 1', // Error
                'ENDE SOLANGE'
            ],
            errorLineIndex: 3,
            explanation: 'Die Variable x wird verringert statt erhöht. Dadurch bleibt x immer kleiner als 5 und die Schleife endet nie.'
        },
        {
            id: 2,
            title: 'Array Index Out of Bounds',
            description: 'Welche Zeile verursacht einen Fehler beim Zugriff auf das Array (Länge 5)?',
            code: [
                'liste = [10, 20, 30, 40, 50]',
                'i = 1',
                'SOLANGE i <= 5 MACHE', // Logic error depending on 0-based index, but let's assume 0-based for specific error
                '  AUSGABE liste[i]',
                '  i = i + 1',
                'ENDE SOLANGE',
                'AUSGABE liste[5]' // Error: Index 5 is out of bounds (0-4)
            ],
            errorLineIndex: 6,
            explanation: 'Array-Indizes beginnen meist bei 0. Ein Array der Länge 5 hat die Indizes 0 bis 4. Der Zugriff auf liste[5] ist ungültig.'
        },
        {
            id: 3,
            title: 'Logischer Fehler im Rabatt',
            description: 'Der Kunde soll ab 100€ einen Rabatt bekommen. Wo ist der Logikfehler?',
            code: [
                'bestellwert = 120',
                'rabatt = 0',
                'WENN bestellwert < 100 DANN', // Error: Should be > or >=
                '  rabatt = 10',
                'ENDE WENN',
                'preis = bestellwert - rabatt'
            ],
            errorLineIndex: 2,
            explanation: 'Die Bedingung "bestellwert < 100" ist falsch. Es soll Rabatt geben, wenn der Wert GRÖSSER oder GLEICH 100 ist.'
        }
    ];

    // ============================================================
    // DATA: Trace Tables
    // ============================================================
    const TRACES = [
        {
            id: 1,
            title: 'Einfache Schleife',
            code: [
                'x = 1',
                'y = 0',
                'SOLANGE x < 4 MACHE',
                '  y = y + x',
                '  x = x + 1',
                'ENDE SOLANGE'
            ],
            vars: ['x', 'y'],
            steps: [
                { x: 1, y: 0 }, // Init
                { x: 1, y: 1 }, // Loop 1: y = 0+1
                { x: 2, y: 1 }, // Loop 1: x = 1+1
                { x: 2, y: 3 }, // Loop 2: y = 1+2
                { x: 3, y: 3 }, // Loop 2: x = 2+1
                { x: 3, y: 6 }, // Loop 3: y = 3+3
                { x: 4, y: 6 }  // Loop 3: x = 3+1 -> End
            ]
        },
        {
            id: 2,
            title: 'Verzweigung',
            code: [
                'a = 5',
                'b = 3',
                'WENN a > b DANN',
                '  temp = a',
                '  a = b',
                '  b = temp',
                'ENDE WENN'
            ],
            vars: ['a', 'b', 'temp'],
            steps: [
                { a: 5, b: 3, temp: '-' },
                { a: 5, b: 3, temp: '-' }, // Check
                { a: 5, b: 3, temp: 5 },   // temp = a
                { a: 3, b: 3, temp: 5 },   // a = b
                { a: 3, b: 5, temp: 5 }    // b = temp
            ]
        }
    ];

    // ============================================================
    // MAIN RENDER
    // ============================================================
    function render(container) {
        container.innerHTML = `
      <div class="view-enter pseudocode-wrapper">
        <div class="page-header" style="margin-bottom: var(--space-6);">
          <div class="page-header-left">
            <div>
              <h1 class="pseudocode-title">Pseudocode-Trainer</h1>
              <p class="pseudocode-subtitle">Algorithmen verstehen, Fehler finden und Code analysieren.</p>
            </div>
          </div>
        </div>

        <div class="module-tabs" id="pseudoTabs"></div>
        <div id="pseudoContent"></div>
      </div>
    `;

        renderTabs();
        renderContent();
    }

    function renderTabs() {
        const tabsEl = document.getElementById('pseudoTabs');
        if (!tabsEl) return;

        const tabs = [
            { id: 'puzzle', label: 'Code-Puzzle' },
            { id: 'error', label: 'Fehler-Finder' },
            { id: 'trace', label: 'Schreibtischtest' }
        ];

        tabsEl.innerHTML = tabs.map(t =>
            `<button class="module-tab ${currentTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`
        ).join('');

        tabsEl.querySelectorAll('.module-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                currentTab = btn.dataset.tab;
                renderTabs();
                renderContent();
            });
        });
    }

    function renderContent() {
        const contentEl = document.getElementById('pseudoContent');
        if (!contentEl) return;

        switch (currentTab) {
            case 'puzzle': renderPuzzle(contentEl); break;
            case 'error': renderErrorFinder(contentEl); break;
            case 'trace': renderTraceTable(contentEl); break;
        }
    }

    // ============================================================
    // TAB 1: CODE PUZZLE
    // ============================================================
    function renderPuzzle(container) {
        const puzzle = PUZZLES[currentPuzzle];

        container.innerHTML = `
      <div class="module-exercise-card">
        <div class="module-exercise-header">
           <span class="module-exercise-badge">Puzzle ${currentPuzzle + 1}/${PUZZLES.length}</span>
           <span class="nwa-diff-badge nwa-diff-${puzzle.difficulty.toLowerCase()}">${puzzle.difficulty}</span>
        </div>
        <h3>${puzzle.title}</h3>
        <p class="module-questions-text">${puzzle.description}</p>

        <div class="puzzle-container" id="puzzleList">
          ${puzzle.scrambled.map((line, idx) => `
            <div class="code-line" draggable="true" data-index="${idx}">
              <span class="code-line-content">${escapeHTML(line)}</span>
              <span style="color:var(--text-tertiary)">☰</span>
            </div>
          `).join('')}
        </div>

        <div class="module-actions" style="margin-top: var(--space-4);">
          <button class="btn btn-primary" id="btnCheckPuzzle">Prüfen</button>
          ${currentPuzzle < PUZZLES.length - 1 ?
                `<button class="btn" id="btnNextPuzzle" style="display:none; background: var(--bg-tertiary);">Nächstes Puzzle &rarr;</button>` : ''}
        </div>
        <div id="puzzleFeedback" class="module-feedback" style="display:none;"></div>
      </div>
    `;

        setupDragAndDrop();

        document.getElementById('btnCheckPuzzle').addEventListener('click', () => checkPuzzle(puzzle));
        const nextBtn = document.getElementById('btnNextPuzzle');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentPuzzle++;
                renderPuzzle(container);
            });
        }
    }

    function setupDragAndDrop() {
        const list = document.getElementById('puzzleList');
        let items = list.querySelectorAll('.code-line');

        items.forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('dragenter', handleDragEnter);
            item.addEventListener('dragleave', handleDragLeave);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
        });
    }

    function handleDragStart(e) {
        this.style.opacity = '0.4';
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    function handleDragOver(e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        this.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();

        if (dragSrcEl !== this) {
            dragSrcEl.innerHTML = this.innerHTML;
            this.innerHTML = e.dataTransfer.getData('text/html');

            // Swap styles or attributes if needed needed? 
            // Simplified: just swapping content is usually enough for simple text lists, 
            // but if we had data attributes for IDs, we'd swap those too.
            // Here we rely on content for validation.
        }
        return false;
    }

    function handleDragEnd(e) {
        this.style.opacity = '1';
        const list = document.getElementById('puzzleList');
        list.querySelectorAll('.code-line').forEach(item => item.classList.remove('drag-over'));
    }

    function checkPuzzle(puzzle) {
        const list = document.getElementById('puzzleList');
        const lines = Array.from(list.querySelectorAll('.code-line')).map(el => el.querySelector('.code-line-content').innerText);
        const feedback = document.getElementById('puzzleFeedback');
        const nextBtn = document.getElementById('btnNextPuzzle');
        const checkBtn = document.getElementById('btnCheckPuzzle');

        const isCorrect = lines.every((line, i) => line.trim() === puzzle.correctOrder[i].trim());

        feedback.style.display = 'block';
        if (isCorrect) {
            feedback.className = 'module-feedback module-feedback-success';
            feedback.innerHTML = '<strong>Richtig!</strong> Der Algorithmus ist korrekt.';
            checkBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'inline-block';
        } else {
            feedback.className = 'module-feedback module-feedback-error';
            feedback.innerHTML = '<strong>Nicht ganz...</strong> Die Reihenfolge stimmt noch nicht.';
        }
    }

    // ============================================================
    // TAB 2: ERROR FINDER
    // ============================================================
    function renderErrorFinder(container) {
        const errorCase = ERRORS[currentErrorCase];

        container.innerHTML = `
      <div class="module-exercise-card">
        <div class="module-exercise-header">
           <span class="module-exercise-badge">Fall ${currentErrorCase + 1}/${ERRORS.length}</span>
        </div>
        <h3>${errorCase.title}</h3>
        <p class="module-questions-text">${errorCase.description}</p>
        <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">Klicke auf die fehlerhafte Zeile.</p>

        <div class="code-block" id="errorCodeBlock">
          ${errorCase.code.map((line, idx) => `
            <div class="error-finder-line" data-index="${idx}">
              <span class="code-line-number">${idx + 1}</span>
              <span class="code-content">${escapeHTML(line)}</span>
            </div>
          `).join('')}
        </div>

        <div id="errorFeedback" class="module-feedback" style="display:none;"></div>
        
        <div class="module-actions" style="margin-top: var(--space-4);">
             ${currentErrorCase < ERRORS.length - 1 ?
                `<button class="btn" id="btnNextError" style="display:none; background: var(--bg-tertiary);">Nächster Fall &rarr;</button>` : ''}
        </div>
      </div>
    `;

        document.querySelectorAll('.error-finder-line').forEach(line => {
            line.addEventListener('click', () => checkErrorLine(line, errorCase));
        });

        const nextBtn = document.getElementById('btnNextError');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentErrorCase++;
                renderErrorFinder(container);
            });
        }
    }

    function checkErrorLine(element, errorCase) {
        const idx = parseInt(element.dataset.index);
        const feedback = document.getElementById('errorFeedback');
        const nextBtn = document.getElementById('btnNextError');

        // Reset styles
        document.querySelectorAll('.error-finder-line').forEach(el => {
            el.classList.remove('selected', 'correct', 'wrong');
        });

        element.classList.add('selected');

        feedback.style.display = 'block';

        if (idx === errorCase.errorLineIndex) {
            element.classList.add('correct');
            feedback.className = 'module-feedback module-feedback-success';
            feedback.innerHTML = `<strong>Richtig!</strong> ${errorCase.explanation}`;
            if (nextBtn) nextBtn.style.display = 'inline-block';
        } else {
            element.classList.add('wrong');
            feedback.className = 'module-feedback module-feedback-error';
            feedback.innerHTML = `<strong>Das ist nicht der Fehler.</strong> Schaue dir die Logik nochmal genau an.`;
        }
    }

    // ============================================================
    // TAB 3: TRACE TABLE
    // ============================================================
    function renderTraceTable(container) {
        const trace = TRACES[currentTrace];

        container.innerHTML = `
      <div class="module-exercise-card">
        <div class="module-exercise-header">
           <span class="module-exercise-badge">Übung ${currentTrace + 1}/${TRACES.length}</span>
        </div>
        <h3>${trace.title}</h3>
        
        <div class="code-block">
          ${trace.code.map((line, i) => `<div class="code-line-simple"><span class="code-line-number">${i + 1}</span>${escapeHTML(line)}</div>`).join('')}
        </div>

        <p class="module-questions-text">Führe den Code Zeile für Zeile aus und trage die Werte ein. (Initialwerte sind Schritt 0)</p>

        <div class="trace-table-container">
          <table class="trace-table">
            <thead>
              <tr>
                <th>Schritt</th>
                ${trace.vars.map(v => `<th>${v}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${trace.steps.map((step, stepIdx) => `
                <tr>
                  <td>${stepIdx}</td>
                  ${trace.vars.map(v => `
                    <td>
                      <input type="text" data-step="${stepIdx}" data-var="${v}" placeholder="?" autocomplete="off">
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="module-actions">
           <button class="btn btn-primary" id="btnCheckTrace">Prüfen</button>
           <button class="btn" id="btnFillTrace" style="background: var(--bg-tertiary); color: var(--text-secondary);">Lösung</button>
           ${currentTrace < TRACES.length - 1 ?
                `<button class="btn" id="btnNextTrace" style="display:none; background: var(--bg-tertiary);">Nächste &rarr;</button>` : ''}
        </div>
        
        <div id="traceFeedback" class="module-feedback" style="display:none;"></div>
      </div>
    `;

        document.getElementById('btnCheckTrace').addEventListener('click', () => checkTrace(trace));
        document.getElementById('btnFillTrace').addEventListener('click', () => fillTrace(trace));
        const nextBtn = document.getElementById('btnNextTrace');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentTrace++;
                renderTraceTable(container);
            });
        }
    }

    function checkTrace(trace) {
        const inputs = document.querySelectorAll('.trace-table input');
        let allCorrect = true;

        inputs.forEach(input => {
            const stepIdx = parseInt(input.dataset.step);
            const varName = input.dataset.var;
            const expected = String(trace.steps[stepIdx][varName]);
            const val = input.value.trim();

            if (val === expected) {
                input.classList.add('correct');
                input.classList.remove('wrong');
            } else {
                input.classList.add('wrong');
                input.classList.remove('correct');
                allCorrect = false;
            }
        });

        const feedback = document.getElementById('traceFeedback');
        const nextBtn = document.getElementById('btnNextTrace');

        feedback.style.display = 'block';
        if (allCorrect) {
            feedback.className = 'module-feedback module-feedback-success';
            feedback.innerHTML = '<strong>Perfekt!</strong> Tabelle korrekt ausgefüllt.';
            document.getElementById('btnCheckTrace').style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'inline-block';
        } else {
            feedback.className = 'module-feedback module-feedback-error';
            feedback.innerHTML = '<strong>Fehler gefunden.</strong> Überprüfe die rot markierten Felder.';
        }
    }

    function fillTrace(trace) {
        const inputs = document.querySelectorAll('.trace-table input');
        inputs.forEach(input => {
            const stepIdx = parseInt(input.dataset.step);
            const varName = input.dataset.var;
            input.value = trace.steps[stepIdx][varName];
            input.classList.remove('wrong', 'correct');
        });
    }

    // ============================================================
    // UTILS
    // ============================================================
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function cleanup() {
        // Remove events if necessary (mostly handled by DOM removal)
    }

    return { render, cleanup };
})();

export default PseudocodeView;
