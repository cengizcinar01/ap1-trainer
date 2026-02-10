// ============================================================
// mailprotocols.js — E-Mail-Protokolle (Standard Design)
// Tabs: Erklaerung, Vergleich, Quiz
// ============================================================

const MailProtocolsView = (() => {
  let currentTab = 'explanation';
  let cleanup_fns = [];

  const ICONS = {
    pop3: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`,
    imap: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7"/><path d="M16 5V3"/><path d="M8 5V3"/><path d="M3 9h18"/><path d="M15 15l2 2 4-4"/></svg>`,
    smtp: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  };

  const QUIZ_DATA = [
    {
      id: 1,
      q: 'Ein Mitarbeiter liest seine E-Mails am Smartphone, am Laptop und in einer Webmail-Oberflaeche. Welches Protokoll ist geeignet?',
      options: [
        'POP3 (Post Office Protocol)',
        'IMAP (Internet Message Access Protocol)',
        'SMTP (Simple Mail Transfer Protocol)',
        'FTP (File Transfer Protocol)',
      ],
      correct: 1,
      explain:
        'IMAP ist korrekt, da alle Geraete synchronisiert werden muessen und die E-Mails zentral auf dem Server liegen bleiben. Aenderungen (gelesen, geloescht, verschoben) sind auf allen Geraeten sichtbar.',
    },
    {
      id: 2,
      q: 'Ein alter Industrie-PC soll E-Mails nur einmal taeglich abrufen und danach offline anzeigen. Welches Protokoll ist sinnvoll?',
      options: ['IMAP', 'POP3', 'SMTP', 'HTTP'],
      correct: 1,
      explain:
        'POP3 ist hier sinnvoll, da nur ein Geraet genutzt wird und der Offline-Zugriff explizit gefordert ist. Die Mails werden heruntergeladen und (standardmaessig) vom Server geloescht.',
    },
    {
      id: 3,
      q: 'Ein Benutzer kann E-Mails empfangen, aber keine versenden. Welches Protokoll oder welcher Port ist wahrscheinlich falsch konfiguriert?',
      options: [
        'IMAP (Port 143)',
        'POP3 (Port 110)',
        'SMTP (z.B. Port 587 oder 465)',
        'DNS (Port 53)',
      ],
      correct: 2,
      explain:
        'SMTP ist fuer den Versand zustaendig. Wenn Empfang geht (IMAP/POP3 ok), aber Versand nicht, liegt es am SMTP-Server oder dessen Port-Einstellungen.',
    },
    {
      id: 4,
      q: 'In welchem OSI-Layer arbeiten SMTP, IMAP und POP3?',
      options: ['Layer 3', 'Layer 4', 'Layer 6', 'Layer 7 (Application)'],
      correct: 3,
      explain:
        'Alle drei Protokolle arbeiten im Application Layer (Anwendungsschicht), da sie direkte Anwendungsdienste bereitstellen und TCP/IP als Transport nutzen.',
    },
    {
      id: 5,
      q: 'Welches Protokoll dient ausschliesslich dem Versand von E-Mails?',
      options: ['IMAP', 'POP3', 'SMTP', 'FTP'],
      correct: 2,
      explain:
        'SMTP (Simple Mail Transfer Protocol) ist nur fuer den Versand (Client -> Server) und die Weiterleitung (Server -> Server) zustaendig.',
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================

  function render(container) {
    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <div class="page-header-left">
            <div>
              <h1 class="page-title">E-Mail-Protokolle</h1>
              <p class="page-subtitle">Vergleich der Uebertragungsstandards fuer die IHK-Pruefung</p>
            </div>
          </div>
        </div>

        <nav class="module-tabs">
          <button class="module-tab ${currentTab === 'explanation' ? 'active' : ''}" data-tab="explanation">Anleitung</button>
          <button class="module-tab ${currentTab === 'comparison' ? 'active' : ''}" data-tab="comparison">Vergleich</button>
          <button class="module-tab ${currentTab === 'quiz' ? 'active' : ''}" data-tab="quiz">Quiz</button>
        </nav>

        <div id="mailContent" class="view-enter"></div>
      </div>
    `;

    setupTabEvents(container);
    renderCurrentTab();
  }

  function setupTabEvents(container) {
    container.querySelectorAll('.module-tab').forEach((btn) => {
      const handler = () => {
        currentTab = btn.dataset.tab;
        container.querySelectorAll('.module-tab').forEach((b) => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        renderCurrentTab();
      };
      btn.addEventListener('click', handler);
      cleanup_fns.push(() => btn.removeEventListener('click', handler));
    });
  }

  function renderCurrentTab() {
    const content = document.getElementById('mailContent');
    if (!content) return;
    switch (currentTab) {
      case 'explanation':
        renderExplanation(content);
        break;
      case 'comparison':
        renderComparison(content);
        break;
      case 'quiz':
        renderQuiz(content);
        break;
    }
  }

  // ============================================================
  // TAB: Erklaerung
  // ============================================================

  function renderExplanation(container) {
    container.innerHTML = `
      <div class="module-explanation">
        <div class="module-exercise-card">
          <h3 class="module-section-title">Die drei Saeulen der E-Mail-Kommunikation</h3>
          <div class="protocol-grid">
            <div class="protocol-card card-pop3">
              <div class="protocol-icon-wrapper">${ICONS.pop3}</div>
              <div class="protocol-name">POP3</div>
              <div class="protocol-desc">Post Office Protocol v3</div>
              <ul class="protocol-features">
                <li>Lokaler Download der Mails</li>
                <li>Standardmaessig Loeschen auf Server</li>
                <li>Ideal fuer Single-Device Nutzung</li>
              </ul>
            </div>
            <div class="protocol-card card-imap">
              <div class="protocol-icon-wrapper">${ICONS.imap}</div>
              <div class="protocol-name">IMAP</div>
              <div class="protocol-desc">Internet Message Access Protocol</div>
              <ul class="protocol-features">
                <li>Zentrale Speicherung auf Server</li>
                <li>Echtzeit-Synchronisation</li>
                <li>Ideal fuer Multi-Device Nutzung</li>
              </ul>
            </div>
            <div class="protocol-card card-smtp">
              <div class="protocol-icon-wrapper">${ICONS.smtp}</div>
              <div class="protocol-name">SMTP</div>
              <div class="protocol-desc">Simple Mail Transfer Protocol</div>
              <ul class="protocol-features">
                <li>Reiner Versand (Push-Verfahren)</li>
                <li>Server-zu-Server Weiterleitung</li>
                <li>Nutzt Store-and-Forward Prinzip</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="module-exercise-card">
          <h3 class="module-section-title">Relevante Port-Konfigurationen</h3>
          <div class="ports-diagram">
            <div class="port-box">
              <span class="port-label">POP3</span>
              <span class="port-number">110</span>
              <span class="port-secure">SSL: 995</span>
            </div>
            <div class="port-box">
              <span class="port-label">IMAP</span>
              <span class="port-number">143</span>
              <span class="port-secure">SSL: 993</span>
            </div>
            <div class="port-box">
              <span class="port-label">SMTP</span>
              <span class="port-number">25</span>
              <span class="port-secure">SSL: 465/587</span>
            </div>
          </div>
        </div>

        <div class="module-exercise-card" style="border-left: 4px solid #ef4444;">
          <h3 class="module-section-title">SMTP (Layer 7) — Versanddetails</h3>
          <p class="module-text">
            SMTP ist ein <strong>Push-Protokoll</strong>. Der Client schiebt die Mail aktiv zum Server.
            Im Gegensatz dazu sind POP3 und IMAP <strong>Pull-Protokolle</strong>.
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-top: var(--space-4);">
            <div class="module-info-box" style="border-left-color: #10b981; border-color: #10b981; background: rgba(16,185,129,0.08);">
              <strong>Vorteile Store-and-Forward:</strong>
              <ul style="font-size: var(--font-size-sm); margin-top: var(--space-2); padding-left: var(--space-4);">
                <li>Zwischenspeicherung bei Nichterreichbarkeit</li>
                <li>Automatisierte Wiederholungsversuche</li>
              </ul>
            </div>
            <div class="module-info-box" style="border-left-color: #ef4444; border-color: #ef4444; background: rgba(239,68,68,0.08);">
              <strong>Einschraenkung:</strong>
              <p style="font-size: var(--font-size-sm); margin-top: var(--space-2);">SMTP kann keine Postfaecher verwalten oder E-Mails zum Lesen bereitstellen.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // TAB: Vergleich
  // ============================================================

  function renderComparison(container) {
    container.innerHTML = `
      <div class="module-exercise-card">
        <h3 class="module-section-title">Direktvergleich: POP3 vs. IMAP</h3>
        <div class="comparison-table-wrapper">
          <table class="mail-table">
            <thead>
              <tr>
                <th>Merkmal</th>
                <th>POP3</th>
                <th>IMAP</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Speicherort</strong></td>
                <td>Lokal (Endgeraet)</td>
                <td>Zentral (Server)</td>
              </tr>
              <tr>
                <td><strong>Synchronisation</strong></td>
                <td>Keine</td>
                <td>Vollstaendig (Gelesen, Geloescht, Ordner)</td>
              </tr>
              <tr>
                <td><strong>Datenverlust-Risiko</strong></td>
                <td>Hoch (bei Geraetedefekt)</td>
                <td>Gering (Zentrales Backup moeglich)</td>
              </tr>
              <tr>
                <td><strong>Mehrere Geraete</strong></td>
                <td>Nicht geeignet</td>
                <td>Optimiert dafuer</td>
              </tr>
              <tr>
                <td><strong>Internet-Bedarf</strong></td>
                <td>Nur zum Abruf</td>
                <td>Staendig fuer Aktionen</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ============================================================
  // TAB: Quiz
  // ============================================================

  function renderQuiz(container) {
    let score = 0;
    let answered = 0;

    container.innerHTML = `
      <div class="module-quiz">
        <div class="module-quiz-header">
          <div class="module-quiz-progress">
            <span class="module-quiz-progress-text">Quiz-Fortschritt</span>
            <div class="module-quiz-progress-bar">
              <div class="module-quiz-progress-fill" id="mailQuizProgress" style="width: 0%"></div>
            </div>
          </div>
          <span class="module-quiz-score" id="mailQuizScore">0 / ${QUIZ_DATA.length}</span>
        </div>

        <div id="mailQuizQuestions">
          ${QUIZ_DATA.map(
            (q, i) => `
            <div class="module-exercise-card module-quiz-card" style="margin-bottom: var(--space-4)" data-idx="${i}">
              <p class="module-exercise-question"><strong>Frage ${i + 1}:</strong> ${q.q}</p>
              <div class="module-quiz-options">
                ${q.options
                  .map(
                    (opt, oi) => `
                  <div class="module-quiz-option" data-qi="${i}" data-oi="${oi}">
                    ${opt}
                  </div>
                `
                  )
                  .join('')}
              </div>
              <div class="module-quiz-explanation" style="display:none;"></div>
            </div>
          `
          ).join('')}
        </div>

        <div id="mailQuizResult"></div>
      </div>
    `;

    container.querySelectorAll('.module-quiz-option').forEach((opt) => {
      const handler = () => {
        const qi = +opt.dataset.qi;
        const oi = +opt.dataset.oi;
        const card = opt.closest('.module-quiz-card');
        if (card.classList.contains('answered')) return;
        card.classList.add('answered');
        answered++;

        const isCorrect = oi === QUIZ_DATA[qi].correct;
        if (isCorrect) score++;
        opt.classList.add(isCorrect ? 'correct' : 'wrong');

        if (!isCorrect) {
          card
            .querySelectorAll('.module-quiz-option')
            [QUIZ_DATA[qi].correct].classList.add('correct');
        }

        const expl = card.querySelector('.module-quiz-explanation');
        expl.style.display = 'block';
        expl.textContent = QUIZ_DATA[qi].explain;

        const pct = (answered / QUIZ_DATA.length) * 100;
        document.getElementById('mailQuizProgress').style.width = `${pct}%`;
        document.getElementById('mailQuizScore').textContent =
          `${score} / ${QUIZ_DATA.length}`;

        if (answered === QUIZ_DATA.length) {
          showQuizResult(score);
        }
      };
      opt.addEventListener('click', handler);
      cleanup_fns.push(() => opt.removeEventListener('click', handler));
    });
  }

  function showQuizResult(score) {
    const pct = Math.round((score / QUIZ_DATA.length) * 100);
    const text =
      pct === 100
        ? 'Perfekt! Alle Fragen richtig!'
        : pct >= 60
          ? 'Gut gemacht! Weiter so.'
          : 'Weiter ueben — du schaffst das!';
    document.getElementById('mailQuizResult').innerHTML = `
      <div class="module-exercise-card module-quiz-result">
        <h2 class="module-quiz-result-title">Quiz beendet!</h2>
        <div class="module-quiz-result-score">${pct}%</div>
        <p class="module-quiz-result-text">${text} ${score} von ${QUIZ_DATA.length} richtig.</p>
        <button class="btn btn-primary" id="mailRestartQuiz">Nochmal versuchen</button>
      </div>
    `;
    const btn = document.getElementById('mailRestartQuiz');
    if (btn) {
      const handler = () => renderQuiz(document.getElementById('mailContent'));
      btn.addEventListener('click', handler);
      cleanup_fns.push(() => btn.removeEventListener('click', handler));
    }
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  function cleanup() {
    cleanup_fns.forEach((fn) => {
      fn();
    });
    cleanup_fns = [];
  }

  return { render, cleanup };
})();

export default MailProtocolsView;
