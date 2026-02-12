// ============================================================
// flashcard.js — Flashcard learning session view
// Shows ALL cards of a topic/subtopic sorted by priority.
// Nicht gewusst first → Unsicher → Neu → Gewusst last.
// Each card is rated once, progress saved immediately.
// ============================================================

import CardRenderer from '../components/cardRenderer.js';
import ProgressBar from '../components/progressBar.js';
import Sidebar from '../components/sidebar.js';
import DataLoader from '../services/DataLoader.js';
import StorageManager from '../services/StorageManager.js';

const FlashcardView = (() => {
  let sessionCards = [];
  let currentIndex = 0;
  let isFlipped = false;
  let sessionResults = { knew: 0, partial: 0, forgot: 0, total: 0 };
  let keyHandler = null;
  let sessionTitle = '';

  let currentTopic = null;
  let currentSubtopic = null;

  function render(container, params = {}) {
    const topicName = params.topic ? decodeURIComponent(params.topic) : null;
    const subtopicName = params.subtopic
      ? decodeURIComponent(params.subtopic)
      : null;

    // If no topic is selected (and not explicitly "all" or filtered by URL), show selection screen
    if (!topicName && !params.all) {
      renderSelectionScreen(container);
      return;
    }

    startSession(container, topicName, subtopicName);
  }

  function renderSelectionScreen(container) {
    const topics = DataLoader.getTopics();
    const allCards = DataLoader.getAllCards();

    container.innerHTML = `
      <div class="view-enter quiz-container">
        <div class="page-header" style="text-align: center; margin-bottom: 3rem;">
          <h1 class="page-title">Flashcards</h1>
          <p class="page-subtitle">Wähle ein Thema zum Lernen</p>
        </div>

        <div class="quiz-selection-grid">
          <!-- All Topics Option -->
          <div class="quiz-selection-card main-option" onclick="window.location.hash='#/flashcards/all'">
            <div class="quiz-selection-icon">📚</div>
            <div class="quiz-selection-content">
              <h3 class="quiz-selection-title">Alle Themen</h3>
              <p class="quiz-selection-subtitle">${allCards.length} Karten verfügbar</p>
            </div>
            <div class="quiz-selection-arrow">→</div>
          </div>

          <div class="quiz-selection-divider">oder wähle ein spezifisches Thema</div>

          ${topics
            .map((topic) => {
              const topicCards = topic.cardCount;
              const topicNum = topic.name.match(/^(\d+)/)?.[1] || '?';
              const cleanName = topic.name.replace(/^\d+\.\s*/, '');
              const safeTopicName = encodeURIComponent(topic.name);

              return `
              <div class="quiz-selection-card" onclick="window.location.hash='#/flashcards/${safeTopicName}'">
                <div class="quiz-selection-number">${topicNum}</div>
                <div class="quiz-selection-content">
                  <h3 class="quiz-selection-title">${CardRenderer.escapeHtml(cleanName)}</h3>
                  <p class="quiz-selection-subtitle">${topicCards} Karten</p>
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

  function startSession(container, topicName, subtopicName) {
    currentTopic = topicName;
    currentSubtopic = subtopicName;

    let cards;

    if (subtopicName) {
      cards = DataLoader.getCardsBySubtopic(subtopicName);
      sessionTitle = subtopicName;
    } else if (topicName && topicName !== 'all') {
      cards = DataLoader.getCardsByTopic(topicName);
      sessionTitle = topicName;
    } else {
      cards = DataLoader.getAllCards();
      sessionTitle = 'Alle Themen';
    }

    if (!cards || cards.length === 0) {
      container.innerHTML = `
        <div class="view-enter">
          <div class="empty-state">
            <div class="empty-state-title">Keine Karten</div>
            <p class="empty-state-text">Für dieses Thema gibt es noch keine Lernkarten.</p>
            <a href="#/flashcards" class="btn btn-primary">Zurück zur Auswahl</a>
          </div>
        </div>
      `;
      return;
    }

    // Get ALL cards sorted by priority (nicht gewusst → unsicher → neu → gewusst)
    sessionCards = StorageManager.getSessionCards(cards);
    currentIndex = 0;
    isFlipped = false;
    sessionResults = { knew: 0, partial: 0, forgot: 0, total: 0 };

    renderCurrentCard(container);
    setupKeyboardShortcuts(container);
  }

  function renderCurrentCard(container) {
    if (currentIndex >= sessionCards.length) {
      renderComplete(container);
      return;
    }

    const { card } = sessionCards[currentIndex];
    isFlipped = false;

    container.innerHTML = `
      <div class="view-enter">
        <div class="session-topbar">
          <div class="session-topbar-left">
            <a href="#/flashcards" class="btn btn-ghost btn-sm">← Beenden</a>
            <span class="text-xs text-tertiary">${CardRenderer.escapeHtml(sessionTitle)}</span>
          </div>
          <span class="session-counter">${currentIndex + 1} / ${sessionCards.length}</span>
        </div>

        <div class="flashcard-container">
          <div class="session-progress-bar mb-6">
            ${ProgressBar.create((currentIndex / sessionCards.length) * 100, 'accent', 'progress-bar-sm')}
          </div>

          ${CardRenderer.renderCard(card)}
          ${CardRenderer.renderRatingButtons()}
          ${CardRenderer.renderKeyboardHints()}
        </div>
      </div>
    `;

    CardRenderer.tryLoadImage(card.id);

    const flashcardEl = container.querySelector('#flashcard');
    if (flashcardEl) {
      flashcardEl.addEventListener('click', () => flipCard(container));
      flashcardEl.classList.add('card-dealt');
    }

    container.querySelectorAll('.rating-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rating = parseInt(btn.dataset.rating, 10);
        handleRating(container, rating);
      });
    });
  }

  function flipCard(container) {
    if (isFlipped) return;
    isFlipped = true;

    const flashcardEl = container.querySelector('#flashcard');
    const ratingBtns = container.querySelector('#ratingButtons');

    if (flashcardEl) flashcardEl.classList.add('flipped');
    if (ratingBtns) {
      ratingBtns.classList.add('visible');
    }
  }

  function handleRating(container, rating) {
    if (!isFlipped) return;

    const { card } = sessionCards[currentIndex];
    StorageManager.updateCardProgress(card.id, rating);

    if (rating === 1) sessionResults.forgot++;
    else if (rating === 2) sessionResults.partial++;
    else sessionResults.knew++;
    sessionResults.total++;

    const pressedBtn = container.querySelector(
      `.rating-btn[data-rating="${rating}"]`
    );
    if (pressedBtn) pressedBtn.classList.add('rating-pressed');

    const flashcardEl = container.querySelector('#flashcard');
    if (flashcardEl) {
      flashcardEl.classList.add(
        rating === 3 ? 'card-exit-right' : 'card-exit-left'
      );
    }

    // Go directly to next card without animation delay
    currentIndex++;
    renderCurrentCard(container);
    Sidebar.updateActive();
  }

  function renderComplete(container) {
    cleanup();

    // Build the "learn again" URL based on the current topic/subtopic
    let learnAgainUrl = '#/flashcards/all';
    if (currentTopic) {
      const topicParam = encodeURIComponent(currentTopic);
      if (currentSubtopic) {
        const subtopicParam = encodeURIComponent(currentSubtopic);
        learnAgainUrl = `#/flashcards/${topicParam}/${subtopicParam}`;
      } else {
        learnAgainUrl = `#/flashcards/${topicParam}`;
      }
    }

    container.innerHTML = `
      <div class="view-enter">
        <div class="flashcard-container">
          <div class="session-complete card-dealt">
            <h2 class="session-complete-title">Session abgeschlossen! 🎉</h2>
            <p class="session-complete-text">
              ${sessionResults.total} Karten durchgearbeitet
            </p>
            <div class="session-stats">
              <div class="session-stat">
                <div class="session-stat-value success">${sessionResults.knew}</div>
                <div class="session-stat-label">Gewusst</div>
              </div>
              <div class="session-stat">
                <div class="session-stat-value warning">${sessionResults.partial}</div>
                <div class="session-stat-label">Unsicher</div>
              </div>
              <div class="session-stat">
                <div class="session-stat-value danger">${sessionResults.forgot}</div>
                <div class="session-stat-label">Nicht gewusst</div>
              </div>
            </div>
            <div class="session-actions">
              <a href="#/flashcards" class="btn btn-ghost">Zurück zur Auswahl</a>
              <button type="button" id="learnAgainBtn" class="btn btn-primary">Nochmal lernen</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add click handler for "Nochmal lernen" to force reload even if same URL
    const learnAgainBtn = container.querySelector('#learnAgainBtn');
    if (learnAgainBtn) {
      learnAgainBtn.addEventListener('click', () => {
        window.location.hash = '/';
        setTimeout(() => {
          window.location.hash = learnAgainUrl;
        }, 10);
      });
    }
  }

  function setupKeyboardShortcuts(container) {
    cleanup();
    keyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')
        return;
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (!isFlipped) flipCard(container);
          break;
        case '1':
          if (isFlipped) handleRating(container, 1);
          break;
        case '2':
          if (isFlipped) handleRating(container, 2);
          break;
        case '3':
          if (isFlipped) handleRating(container, 3);
          break;
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

  return { render, cleanup };
})();

export default FlashcardView;
