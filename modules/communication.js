// ============================================================
// communication.js — 4-Ohren-Modell (Schulz von Thun)
// Modul 21: Interaktives Kommunikationstraining
// ============================================================

const CommunicationView = (() => {
  let currentTab = 'explanation';
  let currentScenarioIdx = 0;
  let cleanup_fns = [];

  // ============================================================
  // DATA: 10 Scenarios for communication training
  // ============================================================

  const SCENARIOS = [
    {
      id: 1,
      title: 'Der Drucker-Vorfall',
      message: '„Der Drucker ist leer.“',
      context:
        'Ein Kollege sagt dies zu dir, während du am Schreibtisch sitzt.',
      statements: [
        {
          id: 's1_1',
          text: 'Es befindet sich kein Papier mehr im Gerät.',
          type: 'fact',
        },
        {
          id: 's1_2',
          text: 'Ich bin frustriert, weil ich meine Arbeit nicht fortsetzen kann.',
          type: 'self',
        },
        {
          id: 's1_3',
          text: 'Ich erwarte von dir, dass du dich um die Hardware kümmerst.',
          type: 'relation',
        },
        {
          id: 's1_4',
          text: 'Füll bitte sofort neues Papier in den Drucker nach!',
          type: 'appeal',
        },
      ],
    },
    {
      id: 2,
      title: 'Datenbank-Performance',
      message: '„Die Datenbank ist schon wieder extrem langsam!“',
      context: 'Ein Entwickler ruft dies in den Raum der Administratoren.',
      statements: [
        {
          id: 's2_1',
          text: 'Die Antwortzeiten der Datenbank liegen über dem Schwellenwert.',
          type: 'fact',
        },
        {
          id: 's2_2',
          text: 'Ich habe Angst, dass wir die Deadline heute nicht einhalten.',
          type: 'self',
        },
        {
          id: 's2_3',
          text: 'Ihr habt die Performance-Optimierung nicht im Griff.',
          type: 'relation',
        },
        {
          id: 's2_4',
          text: 'Prüft die Indizes und optimiert die Abfragen sofort!',
          type: 'appeal',
        },
      ],
    },
    {
      id: 3,
      title: 'Ticket-Unterstützung',
      message: '„Können Sie mir mal eben mit dem Ticket helfen?“',
      context: 'Ein Junior-Kollege kommt an deinen Platz.',
      statements: [
        {
          id: 's3_1',
          text: 'Es gibt ein offenes Ticket, bei dem eine Frage besteht.',
          type: 'fact',
        },
        {
          id: 's3_2',
          text: 'Ich fühle mich überfordert und brauche Sicherheit.',
          type: 'self',
        },
        {
          id: 's3_3',
          text: 'Ich schätze deine Expertise und sehe dich als Mentor.',
          type: 'relation',
        },
        {
          id: 's3_4',
          text: 'Unterbrich deine Arbeit und zeig mir die Lösung!',
          type: 'appeal',
        },
      ],
    },
    {
      id: 4,
      title: 'Projektdokumentation',
      message: '„Ich habe die Dokumentation fertiggestellt.“',
      context: 'Eine Mitarbeiterin sagt dies beim Verlassen des Meetings.',
      statements: [
        {
          id: 's4_1',
          text: 'Alle erforderlichen Dokumente wurden im System abgelegt.',
          type: 'fact',
        },
        {
          id: 's4_2',
          text: 'Ich bin stolz auf meine geleistete Arbeit und bin erleichtert.',
          type: 'self',
        },
        {
          id: 's4_3',
          text: 'Ich möchte von dir als Vorgesetztem gelobt werden.',
          type: 'relation',
        },
        {
          id: 's4_4',
          text: 'Lies dir das Dokument durch und gib mir Feedback!',
          type: 'appeal',
        },
      ],
    },
    {
      id: 5,
      title: 'Patch-Management',
      message: '„Warum ist der Server noch nicht gepatcht?“',
      context: 'Der IT-Leiter steht plötzlich hinter deinem Monitor.',
      statements: [
        {
          id: 's5_1',
          text: 'Der aktuelle Patch-Stand des Servers entspricht nicht dem Soll.',
          type: 'fact',
        },
        {
          id: 's5_2',
          text: 'Ich mache mir Sorgen um die Sicherheit unserer Infrastruktur.',
          type: 'self',
        },
        {
          id: 's5_3',
          text: 'Ich vertraue deiner Arbeitsweise gerade nicht ganz.',
          type: 'relation',
        },
        {
          id: 's5_4',
          text: 'Installiere die Updates unverzüglich!',
          type: 'appeal',
        },
      ],
    },
    {
      id: 6,
      title: 'Qualitätssicherung',
      message: '„Das neue Release hat viele Bugs.“',
      context: 'Ein Kunde meldet sich verärgert beim Support.',
      statements: [
        {
          id: 's6_1',
          text: 'Die Software weist diverse Fehlfunktionen auf.',
          type: 'fact',
        },
        {
          id: 's6_2',
          text: 'Ich bin enttäuscht, da ich für ein fehlerfreies Produkt zahle.',
          type: 'self',
        },
        {
          id: 's6_3',
          text: 'Ich fühle mich von Ihrer Firma nicht ernst genommen.',
          type: 'relation',
        },
        {
          id: 's6_4',
          text: 'Fixen Sie die Fehler bis zur nächsten Version!',
          type: 'appeal',
        },
      ],
    },
    {
      id: 7,
      title: 'Zeitdruck im Projekt',
      message: '„Wir brauchen bis morgen den Netzplan.“',
      context: 'Die Projektleiterin schreibt dies in den Slack-Channel.',
      statements: [
        {
          id: 's7_1',
          text: 'Der Netzplan muss in weniger als 24 Stunden vorliegen.',
          type: 'fact',
        },
        {
          id: 's7_2',
          text: 'Ich stehe unter Druck gegenüber dem Lenkungsausschuss.',
          type: 'self',
        },
        {
          id: 's7_3',
          text: 'Ich gebe hier die Anweisungen und erwarte Disziplin.',
          type: 'relation',
        },
        {
          id: 's7_4',
          text: 'Erstell den Plan heute noch fertig!',
          type: 'appeal',
        },
      ],
    },
    {
      id: 8,
      title: 'Code-Review Feedback',
      message: '„Ihr Code ist sehr schwer lesbar.“',
      context: 'Ein Senior-Entwickler kommentiert dein Merge Request.',
      statements: [
        {
          id: 's8_1',
          text: 'Die Quelltextstruktur entspricht nicht den Clean-Code-Regeln.',
          type: 'fact',
        },
        {
          id: 's8_2',
          text: 'Es strengt mich an, mich in deinen Code einzuarbeiten.',
          type: 'self',
        },
        {
          id: 's8_3',
          text: 'Ich sehe mich in einer belehrenden Rolle dir gegenüber.',
          type: 'relation',
        },
        {
          id: 's8_4',
          text: 'Überarbeite den Code und füge Kommentare hinzu!',
          type: 'appeal',
        },
      ],
    },
    {
      id: 9,
      title: 'Kundenkontakt',
      message: '„Der Kunde wartet am Telefon.“',
      context: 'Eine Kollegin hält den Hörer zu und schaut dich an.',
      statements: [
        {
          id: 's9_1',
          text: 'Eine externe Person befindet sich in der Warteschleife.',
          type: 'fact',
        },
        {
          id: 's9_2',
          text: 'Ich möchte das Gespräch endlich loswerden.',
          type: 'self',
        },
        {
          id: 's9_3',
          text: 'Du bist jetzt dran mit der Verantwortung.',
          type: 'relation',
        },
        { id: 's9_4', text: 'Nimm das Gespräch sofort an!', type: 'appeal' },
      ],
    },
    {
      id: 10,
      title: 'Feierabend-Konflikt',
      message: '„Es ist 17 Uhr und ich gehe jetzt.“',
      context:
        'Dein Kollege packt seine Tasche, während du noch voll im Stress bist.',
      statements: [
        {
          id: 's10_1',
          text: 'Die Uhrzeit ist 17:00 Uhr und der Kollege verlässt den Platz.',
          type: 'fact',
        },
        {
          id: 's10_2',
          text: 'Mir ist meine Freizeit wichtiger als Überstunden.',
          type: 'self',
        },
        {
          id: 's10_3',
          text: 'Ich lasse dich mit der restlichen Arbeit allein.',
          type: 'relation',
        },
        {
          id: 's10_4',
          text: 'Akzeptiere meinen Feierabend und frag nicht nach Hilfe!',
          type: 'appeal',
        },
      ],
    },
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
              <h1 class="page-title">4-Ohren-Modell</h1>
              <p class="page-subtitle">Kommunikationstraining nach Schulz von Thun</p>
            </div>
          </div>
        </div>

        <nav class="module-tabs">
          <button class="module-tab ${currentTab === 'explanation' ? 'active' : ''}" data-tab="explanation">Erklärung</button>
          <button class="module-tab ${currentTab === 'training' ? 'active' : ''}" data-tab="training">Szenarien-Training</button>
          <button class="module-tab ${currentTab === 'quiz' ? 'active' : ''}" data-tab="quiz">Wissens-Check</button>
        </nav>

        <div id="commContent" class="view-enter"></div>
      </div>
    `;

    setupTabEvents(container);
    renderCurrentTab();
  }

  function setupTabEvents(container) {
    container.querySelectorAll('.module-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        container.querySelectorAll('.module-tab').forEach((b) => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        renderCurrentTab();
      });
    });
  }

  function renderCurrentTab() {
    const content = document.getElementById('commContent');
    if (!content) return;

    cleanup();

    switch (currentTab) {
      case 'explanation':
        renderExplanation(content);
        break;
      case 'training':
        renderTraining(content);
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
      <div class="comm-explanation">
        <div class="module-exercise-card comm-intro-card">
          <h3 class="comm-section-title">Kommunikation verstehen</h3>
          <p class="comm-text">
            Das <strong>Vier-Seiten-Modell</strong> von Friedemann Schulz von Thun besagt, dass jede Nachricht 
            auf vier Ebenen gleichzeitig gesendet und empfangen wird. Ein Sender hat "vier Schnäbel", 
            ein Empfänger "vier Ohren".
          </p>
          <p class="comm-text" style="margin-bottom: 0;">
            Häufige Missverständnisse entstehen, wenn der Sender eine Nachricht auf einer Ebene meint (z.B. Sache), 
            der Empfänger sie aber auf einer anderen Ebene hört (z.B. Beziehung).
          </p>
        </div>

        <div class="comm-square-container">
          <div class="comm-square">
            <div class="comm-ear comm-ear-fact">
              <span class="comm-ear-title">Sachebene</span>
              <span class="comm-ear-desc">Worüber ich informiere</span>
            </div>
            <div class="comm-ear comm-ear-self">
              <span class="comm-ear-title">Selbstkundgabe</span>
              <span class="comm-ear-desc">Was ich von mir offenbare</span>
            </div>
            <div class="comm-ear comm-ear-relation">
              <span class="comm-ear-title">Beziehung</span>
              <span class="comm-ear-desc">Was ich von dir halte</span>
            </div>
            <div class="comm-ear comm-ear-appeal">
              <span class="comm-ear-title">Appell</span>
              <span class="comm-ear-desc">Was ich erreichen will</span>
            </div>
            <div class="comm-msg-center">„Nachricht“</div>
          </div>
        </div>

        <div class="comm-details-grid">
          <div class="comm-detail-card card-fact">
            <div class="comm-card-header">
              <div class="comm-card-icon">ⓘ</div>
              <div>
                <span class="comm-card-label">Blau</span>
                <div class="comm-card-title">Sachebene</div>
              </div>
            </div>
            <p class="comm-card-text">Enthält die reine Sachinformation. Hier geht es um Daten, Fakten und Sachverhalte. Kriterien: Wahr/Falsch, Relevant/Irrelevant.</p>
            <div class="comm-card-example">„Der Server hat 5% CPU-Last.“</div>
          </div>

          <div class="comm-detail-card card-self">
            <div class="comm-card-header">
              <div class="comm-card-icon">👤</div>
              <div>
                <span class="comm-card-label">Grün</span>
                <div class="comm-card-title">Selbstkundgabe</div>
              </div>
            </div>
            <p class="comm-card-text">Was der Sender (bewusst oder unbewusst) von sich selbst preisgibt: Gefühle, Werte, Eigenheiten oder die aktuelle Verfassung.</p>
            <div class="comm-card-example">„Ich bin heute sehr gestresst.“</div>
          </div>

          <div class="comm-detail-card card-relation">
            <div class="comm-card-header">
              <div class="comm-card-icon">🤝</div>
              <div>
                <span class="comm-card-label">Gelb</span>
                <div class="comm-card-title">Beziehung</div>
              </div>
            </div>
            <p class="comm-card-text">Drückt aus, wie der Sender zum Empfänger steht und was er von ihm hält. Oft transportiert durch Mimik, Gestik und Tonfall.</p>
            <div class="comm-card-example">„Ich vertraue dir bei dieser Aufgabe.“</div>
          </div>

          <div class="comm-detail-card card-appeal">
            <div class="comm-card-header">
              <div class="comm-card-icon">⚡</div>
              <div>
                <span class="comm-card-label">Rot</span>
                <div class="comm-card-title">Appell</div>
              </div>
            </div>
            <p class="comm-card-text">Die beabsichtigte Wirkung. Wozu soll der Empfänger veranlasst werden? Was soll er tun, denken oder fühlen?</p>
            <div class="comm-card-example">„Starte den Server bitte neu!“</div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // TAB 2: TRAINING (Drag & Drop)
  // ============================================================

  function renderTraining(container) {
    const scenario = SCENARIOS[currentScenarioIdx];
    const poolStatements = [...scenario.statements].sort(
      () => Math.random() - 0.5
    );

    container.innerHTML = `
      <div class="comm-scenarios">
        <div class="module-exercise-card">
          <div class="comm-training-header">
            <div>
              <h3 style="margin: 0;">${scenario.title}</h3>
              <p class="comm-text" style="margin: 0; font-size: 12px;">${scenario.context}</p>
            </div>
            <div class="comm-training-progress">
              <span>Szenario ${currentScenarioIdx + 1} / ${SCENARIOS.length}</span>
              <div class="comm-progress-bar" style="width: 80px;">
                <div class="comm-progress-fill" style="width: ${((currentScenarioIdx + 1) / SCENARIOS.length) * 100}%"></div>
              </div>
            </div>
          </div>
          
          <div class="comm-scenario-msg">
            ${scenario.message}
          </div>

          <div class="comm-source-pool">
            <div class="comm-source-title">Verfügbare Botschaften</div>
            <div class="comm-statements-grid" id="statementPool">
              ${poolStatements
                .map(
                  (s) => `
                <div class="comm-statement-item" draggable="true" data-id="${s.id}">
                  <span style="opacity: 0.3">☰</span>
                  ${s.text}
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <div class="comm-drop-zones">
            <div class="comm-drop-zone dz-fact" data-type="fact">
              <div class="comm-dz-header">
                <div class="comm-dz-icon">ⓘ</div>
                <span class="comm-dz-title">Sachebene</span>
              </div>
              <div class="dz-content" id="dz-fact"></div>
            </div>
            <div class="comm-drop-zone dz-self" data-type="self">
              <div class="comm-dz-header">
                <div class="comm-dz-icon">👤</div>
                <span class="comm-dz-title">Selbstkundgabe</span>
              </div>
              <div class="dz-content" id="dz-self"></div>
            </div>
            <div class="comm-drop-zone dz-relation" data-type="relation">
              <div class="comm-dz-header">
                <div class="comm-dz-icon">🤝</div>
                <span class="comm-dz-title">Beziehung</span>
              </div>
              <div class="dz-content" id="dz-relation"></div>
            </div>
            <div class="comm-drop-zone dz-appeal" data-type="appeal">
              <div class="comm-dz-header">
                <div class="comm-dz-icon">⚡</div>
                <span class="comm-dz-title">Appell</span>
              </div>
              <div class="dz-content" id="dz-appeal"></div>
            </div>
          </div>

          <div class="module-actions">
            <button class="btn btn-primary" id="btnCheckScenario" disabled>Zuordnung prüfen</button>
            <button class="btn btn-primary" id="btnNextScenario" style="display:none">
              Nächstes Szenario
              <span style="margin-left: 8px;">→</span>
            </button>
          </div>
          <div id="scenarioFeedback"></div>
        </div>
      </div>
    `;

    setupDragAndDrop(container);

    container
      .querySelector('#btnCheckScenario')
      .addEventListener('click', () => {
        checkScenario(container);
      });

    container
      .querySelector('#btnNextScenario')
      .addEventListener('click', () => {
        currentScenarioIdx = (currentScenarioIdx + 1) % SCENARIOS.length;
        renderTraining(container);
      });
  }

  function setupDragAndDrop(container) {
    const items = container.querySelectorAll('.comm-statement-item');
    const zones = container.querySelectorAll('.comm-drop-zone');
    const checkBtn = container.querySelector('#btnCheckScenario');

    items.forEach((item) => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', item.dataset.id);
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        checkCompletion();
      });
    });

    zones.forEach((zone) => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const id = e.dataTransfer.getData('text/plain');
        const item = container.querySelector(`[data-id="${id}"]`);

        const content = zone.querySelector('.dz-content');
        content.appendChild(item);
        checkCompletion();
      });
    });

    function checkCompletion() {
      const placedItems = container.querySelectorAll(
        '.comm-drop-zone .comm-statement-item'
      );
      checkBtn.disabled = placedItems.length < 4;
    }

    // Support for clicking to move (mobile friendly & quick reset)
    let selectedItem = null;
    items.forEach((item) => {
      item.addEventListener('click', () => {
        // If item is already in a drop zone, move it back to pool on click
        if (item.parentElement.classList.contains('dz-content')) {
          const pool = container.querySelector('#statementPool');
          item.classList.remove('correct', 'wrong');
          pool.appendChild(item);
          checkCompletion();
          return;
        }

        // Otherwise, select it for moving to a zone
        if (selectedItem) selectedItem.style.outline = 'none';
        selectedItem = item;
        selectedItem.style.outline = '2px solid var(--accent-primary)';
      });
    });

    zones.forEach((zone) => {
      zone.addEventListener('click', () => {
        if (selectedItem) {
          const content = zone.querySelector('.dz-content');
          content.appendChild(selectedItem);
          selectedItem.style.outline = 'none';
          selectedItem = null;
          checkCompletion();
        }
      });
    });
  }

  function checkScenario(container) {
    const scenario = SCENARIOS[currentScenarioIdx];
    const zones = container.querySelectorAll('.comm-drop-zone');
    let correctCount = 0;

    zones.forEach((zone) => {
      const type = zone.dataset.type;
      const item = zone.querySelector('.comm-statement-item');
      if (!item) return;

      const statementId = item.dataset.id;
      const original = scenario.statements.find((s) => s.id === statementId);

      if (original && original.type === type) {
        item.classList.add('correct');
        item.classList.remove('wrong');
        correctCount++;
      } else {
        item.classList.add('wrong');
        item.classList.remove('correct');
      }
    });

    const feedback = container.querySelector('#scenarioFeedback');
    const nextBtn = container.querySelector('#btnNextScenario');
    const checkBtn = container.querySelector('#btnCheckScenario');

    if (correctCount === 4) {
      feedback.innerHTML = `
        <div class="module-feedback module-feedback-success">
          <strong>Hervorragend!</strong> Alle Aspekte der Nachricht wurden korrekt zugeordnet.
        </div>
      `;
      checkBtn.style.display = 'none';
      nextBtn.style.display = 'inline-block';
    } else {
      feedback.innerHTML = `
        <div class="module-feedback module-feedback-error">
          <strong>Nicht ganz...</strong> Einige Zuordnungen stimmen noch nicht. Korrigiere die rot markierten Items.
        </div>
      `;
    }
  }

  // ============================================================
  // TAB 3: QUIZ
  // ============================================================

  const QUIZ_QUESTIONS = [
    {
      q: 'Wer hat das 4-Ohren-Modell entwickelt?',
      options: [
        'Sigmund Freud',
        'Friedemann Schulz von Thun',
        'Paul Watzlawick',
        'Carl Rogers',
      ],
      correct: 1,
      explain:
        'Friedemann Schulz von Thun veröffentlichte das Modell 1981 in seinem Werk "Miteinander reden".',
    },
    {
      q: 'Was bedeutet die "Selbstkundgabe" in einer Nachricht?',
      options: [
        'Was der Sender vom Empfänger hält.',
        'Die reine Sachinformation.',
        'Was der Sender von sich selbst preisgibt.',
        'Wozu der Sender den Empfänger bewegen will.',
      ],
      correct: 2,
      explain:
        'Die Selbstkundgabe enthält Informationen über Gefühle, Werte oder die Verfassung des Senders.',
    },
    {
      q: 'Welches "Ohr" ist bei der Aussage "Es ist grün!" am Ampel-Beispiel oft der Auslöser für Streit?',
      options: [
        'Das Sach-Ohr',
        'Das Appell-Ohr',
        'Das Beziehungs-Ohr',
        'Das Fakten-Ohr',
      ],
      correct: 2,
      explain:
        'Das Beziehungs-Ohr hört oft Kritik ("Du fährst nicht gut") heraus, was zu Abwehrhaltungen führt.',
    },
    {
      q: 'Wenn ein Empfänger nur auf das "Appell-Ohr" hört, neigt er dazu...',
      options: [
        '...alles sachlich zu analysieren.',
        '...sofort zu reagieren und es allen recht zu machen.',
        '...sich persönlich angegriffen zu fühlen.',
        '...nur auf die Gefühle des anderen zu achten.',
      ],
      correct: 1,
      explain:
        'Appell-Empfänger versuchen oft voreilig Wünsche zu erfüllen, noch bevor sie die Nachricht ganz verstanden haben.',
    },
  ];

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
          <div class="comm-quiz-score" id="quizScoreDisplay">Score: 0 / ${QUIZ_QUESTIONS.length}</div>
        </div>

        <div id="quizQuestionsList">
          ${QUIZ_QUESTIONS.map(
            (q, i) => `
            <div class="module-exercise-card comm-quiz-card" style="margin-bottom: var(--space-4)" data-idx="${i}">
              <p class="module-exercise-question"><strong>Frage ${i + 1}:</strong> ${q.q}</p>
              <div class="comm-quiz-options">
                ${q.options
                  .map(
                    (opt, oi) => `
                  <div class="comm-quiz-option" data-oi="${oi}">
                    ${opt}
                  </div>
                `
                  )
                  .join('')}
              </div>
              <div class="quiz-feedback" style="display:none; margin-top: var(--space-4);"></div>
            </div>
          `
          ).join('')}
        </div>

        <div id="finalResultContainer"></div>
      </div>
    `;

    setupQuizEvents(container);
  }

  function setupQuizEvents(container) {
    const cards = container.querySelectorAll('.comm-quiz-card');
    const progressFill = container.querySelector('.comm-progress-fill');
    const scoreDisplay = container.querySelector('#quizScoreDisplay');
    const resultContainer = container.querySelector('#finalResultContainer');

    let answeredCount = 0;
    let correctCount = 0;

    cards.forEach((card) => {
      const idx = parseInt(card.dataset.idx, 10);
      const question = QUIZ_QUESTIONS[idx];
      const options = card.querySelectorAll('.comm-quiz-option');
      const feedback = card.querySelector('.quiz-feedback');

      options.forEach((opt) => {
        opt.addEventListener('click', () => {
          if (card.dataset.answered === 'true') return;

          const selectedIdx = parseInt(opt.dataset.oi, 10);
          card.dataset.answered = 'true';
          card.classList.add('answered');
          answeredCount++;

          const isCorrect = selectedIdx === question.correct;
          if (isCorrect) correctCount++;

          // Update UI
          options.forEach((o, i) => {
            if (i === question.correct) {
              o.classList.add('correct');
            } else if (i === selectedIdx) {
              o.classList.add('wrong');
            }
          });

          // Progress & Score
          const progressPct = (answeredCount / QUIZ_QUESTIONS.length) * 100;
          progressFill.style.width = `${progressPct}%`;
          scoreDisplay.textContent = `Score: ${correctCount} / ${QUIZ_QUESTIONS.length}`;

          feedback.style.display = 'block';
          feedback.innerHTML = `
            <div class="module-feedback ${isCorrect ? 'module-feedback-success' : 'module-feedback-error'}">
              <strong>${isCorrect ? 'Richtig!' : 'Falsch.'}</strong> ${question.explain}
            </div>
          `;

          // Check for completion
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

    if (pct === 100) {
      message =
        'Perfekt! Du bist ein wahrer Kommunikationsexperte und beherrschst alle 4 Ohren!';
      icon = '🏆';
    } else if (pct >= 75) {
      message =
        'Sehr gut! Du hast ein starkes Verständnis für die verschiedenen Kommunikationsebenen.';
      icon = '🌟';
    } else if (pct >= 50) {
      message =
        'Gut gemacht! Du verstehst die Grundlagen, achte aber noch mehr auf die Nuancen der Beziehungsebene.';
      icon = '👍';
    } else {
      message =
        'Das war ein guter Versuch. Schau dir die Erklärungen noch einmal an, um Missverständnisse in der Prüfung zu vermeiden.';
      icon = '📚';
    }

    container.innerHTML = `
      <div class="module-exercise-card comm-result-card view-enter">
        <div style="font-size: 48px; margin-bottom: var(--space-2)">${icon}</div>
        <h2 class="comm-result-title">Ergebnis</h2>
        <div class="comm-result-score">${score} / ${QUIZ_QUESTIONS.length}</div>
        <p class="comm-result-text">${message}</p>
        <button class="btn btn-primary" id="btnRestartQuiz">Quiz neustarten</button>
      </div>
    `;

    container.querySelector('#btnRestartQuiz').addEventListener('click', () => {
      renderQuiz(document.getElementById('commContent'));
    });

    // Smooth scroll to result
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function cleanup() {
    cleanup_fns.forEach((fn) => {
      fn();
    });
    cleanup_fns = [];
  }

  return { render, cleanup };
})();

export default CommunicationView;
