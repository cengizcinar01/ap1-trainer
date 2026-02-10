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
          <button class="module-tab ${currentTab === 'explanation' ? 'active' : ''}" data-tab="explanation">Anleitung</button>
          <button class="module-tab ${currentTab === 'training' ? 'active' : ''}" data-tab="training">Übung</button>
          <button class="module-tab ${currentTab === 'quiz' ? 'active' : ''}" data-tab="quiz">Quiz</button>
        </nav>

        <div id="commContent" class="view-enter"></div>
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
    const content = document.getElementById('commContent');
    if (!content) return;

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
      <div class="module-explanation">
        <div class="module-exercise-card">
          <h3 class="module-section-title">Was ist das 4-Ohren-Modell?</h3>
          <p class="module-text">
            Das <strong>Vier-Seiten-Modell</strong> von Friedemann Schulz von Thun besagt, dass jede Nachricht
            auf vier Ebenen gleichzeitig gesendet und empfangen wird. Ein Sender hat "vier Schnaebel",
            ein Empfaenger "vier Ohren".
          </p>
          <div class="module-info-box">
            Haeufige Missverstaendnisse entstehen, wenn der Sender eine Nachricht auf einer Ebene meint (z.B. Sache),
            der Empfaenger sie aber auf einer anderen Ebene hoert (z.B. Beziehung).
          </div>
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
            <span class="module-exercise-badge">${scenario.title}</span>
          </div>
          <p class="module-text">${scenario.context}</p>

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
            <button class="btn btn-primary" id="btnCheckScenario" disabled>Zuordnung pruefen</button>
            <button class="btn btn-primary" id="btnNextScenario" style="display:none">Naechstes Szenario &rarr;</button>
          </div>
          <div id="scenarioFeedback"></div>
      </div>
    `;

    setupDragAndDrop(container);

    const prevBtn = container.querySelector('#prevScen');
    const nextBtn = container.querySelector('#nextScen');
    const checkBtn = container.querySelector('#btnCheckScenario');
    const nextScenBtn = container.querySelector('#btnNextScenario');

    if (prevBtn) {
      const h = () => {
        currentScenarioIdx--;
        renderTraining(container);
      };
      prevBtn.addEventListener('click', h);
      cleanup_fns.push(() => prevBtn.removeEventListener('click', h));
    }
    if (nextBtn) {
      const h = () => {
        currentScenarioIdx++;
        renderTraining(container);
      };
      nextBtn.addEventListener('click', h);
      cleanup_fns.push(() => nextBtn.removeEventListener('click', h));
    }
    if (checkBtn) {
      const h = () => checkScenario(container);
      checkBtn.addEventListener('click', h);
      cleanup_fns.push(() => checkBtn.removeEventListener('click', h));
    }
    if (nextScenBtn) {
      const h = () => {
        currentScenarioIdx = (currentScenarioIdx + 1) % SCENARIOS.length;
        renderTraining(container);
      };
      nextScenBtn.addEventListener('click', h);
      cleanup_fns.push(() => nextScenBtn.removeEventListener('click', h));
    }
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
    let score = 0;
    let answered = 0;

    container.innerHTML = `
      <div class="module-quiz">
        <div class="module-quiz-header">
          <div class="module-quiz-progress">
            <span class="module-quiz-progress-text">Quiz-Fortschritt</span>
            <div class="module-quiz-progress-bar">
              <div class="module-quiz-progress-fill" id="commQuizProgress" style="width: 0%"></div>
            </div>
          </div>
          <span class="module-quiz-score" id="commQuizScore">0 / ${QUIZ_QUESTIONS.length}</span>
        </div>

        <div id="commQuizQuestions">
          ${QUIZ_QUESTIONS.map(
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

        <div id="commQuizResult"></div>
      </div>
    `;

    container.querySelectorAll('.module-quiz-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        const qi = +opt.dataset.qi;
        const oi = +opt.dataset.oi;
        const card = opt.closest('.module-quiz-card');
        if (card.classList.contains('answered')) return;
        card.classList.add('answered');
        answered++;

        const isCorrect = oi === QUIZ_QUESTIONS[qi].correct;
        if (isCorrect) score++;
        opt.classList.add(isCorrect ? 'correct' : 'wrong');

        if (!isCorrect) {
          card
            .querySelectorAll('.module-quiz-option')
            [QUIZ_QUESTIONS[qi].correct].classList.add('correct');
        }

        const expl = card.querySelector('.module-quiz-explanation');
        expl.style.display = 'block';
        expl.textContent = QUIZ_QUESTIONS[qi].explain;

        const pct = (answered / QUIZ_QUESTIONS.length) * 100;
        document.getElementById('commQuizProgress').style.width = `${pct}%`;
        document.getElementById('commQuizScore').textContent =
          `${score} / ${QUIZ_QUESTIONS.length}`;

        if (answered === QUIZ_QUESTIONS.length) {
          showCommQuizResult(score);
        }
      });
    });
  }

  function showCommQuizResult(score) {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    const text =
      pct === 100
        ? 'Perfekt! Du beherrschst alle 4 Ohren!'
        : pct >= 60
          ? 'Gut gemacht! Weiter so.'
          : 'Weiter ueben — du schaffst das!';
    document.getElementById('commQuizResult').innerHTML = `
      <div class="module-exercise-card module-quiz-result">
        <h2 class="module-quiz-result-title">Quiz beendet!</h2>
        <div class="module-quiz-result-score">${pct}%</div>
        <p class="module-quiz-result-text">${text} ${score} von ${QUIZ_QUESTIONS.length} richtig.</p>
        <button class="btn btn-primary" id="commRestartQuiz">Nochmal versuchen</button>
      </div>
    `;
    const btn = document.getElementById('commRestartQuiz');
    if (btn) {
      btn.addEventListener('click', () =>
        renderQuiz(document.getElementById('commContent'))
      );
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

export default CommunicationView;
