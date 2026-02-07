// ============================================================
// review.js — Alle Karten: All cards sorted by priority
// Nicht gewusst first → Unsicher → Neu → Gewusst last.
// Each card rated once, progress saved immediately.
// ============================================================

import DataLoader from '../data/dataLoader.js';
import StorageManager from '../data/storageManager.js';
import CardRenderer from '../components/cardRenderer.js';
import ProgressBar from '../components/progressBar.js';
import Sidebar from '../components/sidebar.js';

const ReviewView = (() => {
  let sessionCards = [];
  let currentIndex = 0;
  let isFlipped = false;
  let sessionResults = { knew: 0, partial: 0, forgot: 0, total: 0 };
  let keyHandler = null;

  function render(container) {
    const allCards = DataLoader.getAllCards();

    // Get ALL cards sorted by priority (nicht gewusst → unsicher → neu → gewusst)
    sessionCards = StorageManager.getSessionCards(allCards);
    currentIndex = 0;
    isFlipped = false;
    sessionResults = { knew: 0, partial: 0, forgot: 0, total: 0 };

    if (sessionCards.length === 0) {
      container.innerHTML = `
        <div class="view-enter">
          <div class="empty-state">
            <div class="empty-state-title">Keine Karten</div>
            <p class="empty-state-text">Es gibt noch keine Lernkarten.</p>
            <a href="#/" class="btn btn-primary">Dashboard</a>
          </div>
        </div>
      `;
      return;
    }

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
            <a href="#/" class="btn btn-ghost btn-sm">← Zurück</a>
            <span class="text-xs text-tertiary">Alle Karten</span>
          </div>
          <span class="session-counter">${currentIndex + 1} / ${sessionCards.length}</span>
        </div>

        <div class="flashcard-container">
          <div class="session-progress-bar mb-6">
            ${ProgressBar.create((currentIndex / sessionCards.length) * 100, 'accent', 'progress-bar-sm')}
          </div>

          ${CardRenderer.renderCard(card, true)}
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
        handleRating(container, parseInt(btn.dataset.rating));
      });
    });
  }

  function flipCard(container) {
    if (isFlipped) return;
    isFlipped = true;
    const flashcardEl = container.querySelector('#flashcard');
    const ratingBtns = container.querySelector('#ratingButtons');
    if (flashcardEl) flashcardEl.classList.add('flipped');
    if (ratingBtns) ratingBtns.classList.add('visible');
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
      `.rating-btn[data-rating="${rating}"]`,
    );
    if (pressedBtn) pressedBtn.classList.add('rating-pressed');

    const flashcardEl = container.querySelector('#flashcard');
    if (flashcardEl)
      flashcardEl.classList.add(
        rating === 3 ? 'card-exit-right' : 'card-exit-left',
      );

    // Go directly to next card without animation delay
    currentIndex++;
    renderCurrentCard(container);
    Sidebar.updateActive();
  }

  function renderComplete(container) {
    cleanup();
    container.innerHTML = `
      <div class="view-enter">
        <div class="flashcard-container">
          ${CardRenderer.renderSessionComplete(sessionResults)}
        </div>
      </div>
    `;
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

export default ReviewView;
