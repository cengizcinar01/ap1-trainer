import CardRenderer from '../components/cardRenderer.js';
import ProgressBar from '../components/progressBar.js';
import DataLoader from '../services/DataLoader.js';

const QuizView = (() => {
  let quizCards = [];
  let currentIndex = 0;
  let score = 0;
  let selectedIndices = [];
  let isAnswered = false;
  let sessionTitle = '';
  let keyHandler = null;

  function render(container, params = {}) {
    const topicName = params.topic ? decodeURIComponent(params.topic) : null;

    // If no topic is selected (and not explicitly "all" or filtered by URL), show selection screen
    if (!topicName && !params.all) {
      renderSelectionScreen(container);
      return;
    }

    startQuiz(container, topicName);
  }

  function renderSelectionScreen(container) {
    const topics = DataLoader.getTopics();
    // Filter topics that actually have quiz questions
    const allCards = DataLoader.getAllCards();
    const availableTopics = topics.filter((topic) => {
      const topicCards = allCards.filter(
        (c) => c.topic === topic.name && c.quiz?.options?.length > 0
      );
      return topicCards.length > 0;
    });

    const totalQuizQuestions = allCards.filter((c) => c.quiz?.options).length;

    container.innerHTML = `
      <div class="view-enter quiz-container">
        <div class="page-header" style="text-align: center; margin-bottom: 3rem;">
          <h1 class="page-title">Quiz starten</h1>
          <p class="page-subtitle">Wähle ein Thema für deine Prüfungssimulation</p>
        </div>

        <div class="quiz-selection-grid">
          <!-- All Topics Option -->
          <div class="quiz-selection-card main-option" onclick="window.location.hash='#/quiz/all'">
            <div class="quiz-selection-icon">🚀</div>
            <div class="quiz-selection-content">
              <h3 class="quiz-selection-title">Alle Themen</h3>
              <p class="quiz-selection-subtitle">${totalQuizQuestions} Fragen verfügbar</p>
            </div>
            <div class="quiz-selection-arrow">→</div>
          </div>

          <div class="quiz-selection-divider">oder wähle ein spezifisches Thema</div>

          ${availableTopics
            .map((topic) => {
              const topicCards = allCards.filter(
                (c) => c.topic === topic.name && c.quiz
              ).length;
              const topicNum = topic.name.match(/^(\d+)/)?.[1] || '?';
              const cleanName = topic.name.replace(/^\d+\.\s*/, '');
              const safeTopicName = encodeURIComponent(topic.name);

              return `
              <div class="quiz-selection-card" onclick="window.location.hash='#/quiz/${safeTopicName}'">
                <div class="quiz-selection-number">${topicNum}</div>
                <div class="quiz-selection-content">
                  <h3 class="quiz-selection-title">${CardRenderer.escapeHtml(cleanName)}</h3>
                  <p class="quiz-selection-subtitle">${topicCards} Fragen</p>
                </div>
                <div class="quiz-selection-arrow">→</div>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  function startQuiz(container, topicName) {
    // Load all cards and filter for those with quiz data
    const allCards = DataLoader.getAllCards();
    let eligibleCards = allCards.filter(
      (card) => card.quiz?.options?.length > 0
    );

    if (topicName && topicName !== 'all') {
      eligibleCards = eligibleCards.filter((card) => card.topic === topicName);
      sessionTitle = `Quiz: ${topicName}`;
    } else {
      sessionTitle = 'Quiz: Alle Themen';
    }

    // Shuffle cards for the session
    quizCards = shuffleArray(eligibleCards);
    currentIndex = 0;
    score = 0;
    isAnswered = false;
    selectedIndices = [];

    if (quizCards.length === 0) {
      container.innerHTML = `
        <div class="view-enter">
          <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <h2 class="empty-state-title">Keine Quiz-Fragen verfügbar</h2>
            <p class="empty-state-text">Für die gewählte Auswahl gibt es derzeit keine Quiz-Fragen. Wir arbeiten daran!</p>
            <a href="#/quiz" class="btn btn-primary">Zurück zur Auswahl</a>
          </div>
        </div>
      `;
      return;
    }

    renderCurrentQuestion(container);
    setupKeyboardShortcuts(container);
  }

  function renderCurrentQuestion(container) {
    if (currentIndex >= quizCards.length) {
      renderComplete(container);
      return;
    }

    const card = quizCards[currentIndex];
    const quizData = card.quiz;
    isAnswered = false;
    selectedIndices = [];

    // Randomize options and track correct ones
    const optionsWithStatus = quizData.options.map((opt, idx) => ({
      text: opt,
      isCorrect: quizData.correctIndices.includes(idx),
    }));

    const shuffledOptions = shuffleArray(optionsWithStatus);
    const currentCorrectIndices = shuffledOptions
      .map((opt, idx) => (opt.isCorrect ? idx : null))
      .filter((idx) => idx !== null);

    // Store temporary data for this specific view instance
    card.tempCorrectIndices = currentCorrectIndices;
    card.tempShuffledOptions = shuffledOptions.map((opt) => opt.text);

    container.innerHTML = `
      <div class="view-enter quiz-container">
        <div class="session-topbar">
          <div class="session-topbar-left">
            <a href="#/quiz" class="btn btn-ghost btn-sm">← Beenden</a>
            <span class="text-xs text-tertiary">${CardRenderer.escapeHtml(sessionTitle)}</span>
          </div>
          <span class="session-counter">${currentIndex + 1} / ${quizCards.length}</span>
        </div>

        <div class="session-progress-bar mb-6">
          ${ProgressBar.create((currentIndex / quizCards.length) * 100, 'accent', 'progress-bar-sm')}
        </div>

        <div class="quiz-card">
          <h2 class="quiz-question">${CardRenderer.escapeHtml(card.question)}</h2>
          
          <div class="quiz-options" id="quizOptions">
            ${card.tempShuffledOptions
              .map(
                (option, index) => `
              <button class="quiz-option-btn" data-index="${index}">
                <span class="quiz-option-key">${index + 1}</span>
                ${CardRenderer.escapeHtml(option)}
              </button>
            `
              )
              .join('')}
          </div>

          <div id="quizFeedback"></div>

          <div class="quiz-actions">
            <button id="submitBtn" class="btn btn-primary" disabled>Antworten</button>
            <button id="nextBtn" class="btn btn-secondary" style="display: none;">Nächste Frage</button>
          </div>
        </div>
      </div>
    `;

    // Event Listeners
    const optionsContainer = container.querySelector('#quizOptions');
    optionsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.quiz-option-btn');
      if (!btn || isAnswered) return;

      const index = parseInt(btn.dataset.index, 10);
      toggleSelection(container, index);
    });

    container
      .querySelector('#submitBtn')
      .addEventListener('click', () => submitAnswer(container));
    container
      .querySelector('#nextBtn')
      .addEventListener('click', () => nextQuestion(container));
  }

  function toggleSelection(container, index) {
    const card = quizCards[currentIndex];
    const quizData = card.quiz;
    const isMulti = quizData.type === 'multiple-choice'; // Assuming we add 'type' to data, default to single if check needed, but requirement said standard multiple choice

    const btn = container.querySelector(
      `.quiz-option-btn[data-index="${index}"]`
    );

    if (isMulti) {
      // Requirement: "standardmäßig nur multiplychoise" -> I assume this means checkboxes behavior?
      // But user also said "hat man auch die möglichkeit nur eine richtig antwort zu wählen".
      // Let's implement toggle behavior.
      if (selectedIndices.includes(index)) {
        selectedIndices = selectedIndices.filter((i) => i !== index);
        btn.classList.remove('selected');
      } else {
        selectedIndices.push(index);
        btn.classList.add('selected');
      }
    } else {
      // Single choice behavior if explicit
      selectedIndices = [index];
      container.querySelectorAll('.quiz-option-btn').forEach((b) => {
        b.classList.remove('selected');
      });
      btn.classList.add('selected');
    }

    const submitBtn = container.querySelector('#submitBtn');
    submitBtn.disabled = selectedIndices.length === 0;
  }

  function submitAnswer(container) {
    if (isAnswered) return;
    isAnswered = true;

    const card = quizCards[currentIndex];
    const correctIndices = card.tempCorrectIndices; // Use the shuffled indices

    // Sort for comparison
    const sortedSelected = [...selectedIndices].sort();
    const sortedCorrect = [...correctIndices].sort();

    const isCorrect =
      JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);

    if (isCorrect) {
      score++;
    }

    // Visual Feedback
    container.querySelectorAll('.quiz-option-btn').forEach((btn) => {
      const idx = parseInt(btn.dataset.index, 10);

      if (correctIndices.includes(idx)) {
        btn.classList.add('correct');
        btn.classList.add('selected'); // Ensure correct ones are highlighted
      } else if (selectedIndices.includes(idx)) {
        btn.classList.add('incorrect');
      }
    });

    // Text Feedback
    const feedbackEl = container.querySelector('#quizFeedback');
    feedbackEl.innerHTML = `
      <div class="quiz-feedback ${isCorrect ? 'success' : 'error'}">
        <span class="quiz-feedback-title">${isCorrect ? 'Richtig! 🎉' : 'Leider falsch 😕'}</span>
        ${card.answer ? `<div class="flashcard-answer" style="margin-top:0.5rem; border-top:1px solid currentColor; padding-top:0.5rem">${CardRenderer.formatAnswer(card.answer)}</div>` : ''}
      </div>
    `;

    // Switch Buttons
    container.querySelector('#submitBtn').style.display = 'none';
    const nextBtn = container.querySelector('#nextBtn');
    nextBtn.style.display = 'block';
    nextBtn.focus();
  }

  function nextQuestion(container) {
    currentIndex++;
    renderCurrentQuestion(container);
  }

  function renderComplete(container) {
    cleanup();
    const percentage = Math.round((score / quizCards.length) * 100);

    container.innerHTML = `
      <div class="view-enter quiz-container">
        <div class="quiz-complete card-dealt">
          <div class="quiz-score-circle">
            ${percentage}%
          </div>
          <h2 class="quiz-complete-title">Quiz abgeschlossen!</h2>
          <p style="margin-bottom: 2rem; color: var(--text-secondary);">
            Du hast ${score} von ${quizCards.length} Fragen richtig beantwortet.
          </p>
          
          <div class="quiz-actions" style="justify-content: center;">
            <a href="#/quiz" class="btn btn-secondary">Nochmal üben</a>
            <a href="#/" class="btn btn-primary">Zurück zum Dashboard</a>
          </div>
        </div>
      </div>
    `;
  }

  function setupKeyboardShortcuts(container) {
    cleanup();
    keyHandler = (e) => {
      if (isAnswered) {
        if (e.key === 'Enter') {
          nextQuestion(container);
        }
        return;
      }

      const key = parseInt(e.key, 10);
      if (!Number.isNaN(key) && key >= 1 && key <= 6) {
        // Toggle selection for 1-6
        const index = key - 1;
        // Check if option exists
        if (
          container.querySelector(`.quiz-option-btn[data-index="${index}"]`)
        ) {
          toggleSelection(container, index);
        }
      } else if (e.key === 'Enter') {
        const submitBtn = container.querySelector('#submitBtn');
        if (!submitBtn.disabled) {
          submitAnswer(container);
        }
      }
    };
    document.addEventListener('keydown', keyHandler);
  }

  function cleanup() {
    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
  }

  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  return { render, cleanup };
})();

export default QuizView;
