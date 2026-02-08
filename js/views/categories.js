// ============================================================
// categories.js — Topic/subtopic browser view with card preview
// ============================================================

import CardRenderer from '../components/cardRenderer.js';
import ProgressBar from '../components/progressBar.js';
import DataLoader from '../data/dataLoader.js';
import StorageManager from '../data/storageManager.js';

const CategoriesView = (() => {
  let activeCardPreview = null; // Track currently shown card preview
  let keyHandler = null;
  let _clickHandler = null; // Track the click handler to properly remove it

  function render(container) {
    cleanup();

    const topics = DataLoader.getTopics();
    const allCards = DataLoader.getAllCards();
    const stats = StorageManager.getStatistics(allCards);

    // Parse query parameters from hash
    const hashParts = window.location.hash.split('?');
    const queryString = hashParts[1] || '';
    const params = new URLSearchParams(queryString);
    const openTopicName = params.get('openTopic');
    const highlightSubtopic = params.get('highlight');

    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <h1 class="page-title">Themen</h1>
          <p class="page-subtitle">${topics.length} Themengebiete · ${allCards.length} Karten</p>
        </div>

        <div id="topicAccordions">
          ${topics.map((topic) => renderTopicAccordion(topic, stats, openTopicName)).join('')}
        </div>
      </div>
    `;

    // Bind click handlers directly to each element (more reliable than delegation)

    // Topic accordion headers
    container.querySelectorAll('.accordion-header').forEach((header) => {
      header.onclick = (e) => {
        if (e.target.closest('a')) return; // Allow links
        e.preventDefault();
        e.stopPropagation();
        const currentAccordion = header.closest('.accordion-item');
        const accordionBody = currentAccordion.querySelector('.accordion-body');
        const isOpen = currentAccordion.classList.contains('open');

        // Close all other accordions with animation
        container.querySelectorAll('.accordion-item.open').forEach((item) => {
          if (item !== currentAccordion) {
            const body = item.querySelector('.accordion-body');

            // Also close any open subtopic accordions inside
            item
              .querySelectorAll('.subtopic-accordion.open')
              .forEach((subtopic) => {
                const subtopicBody = subtopic.querySelector('.subtopic-body');
                subtopicBody.style.maxHeight = '0px';
                subtopic.classList.remove('open');
              });

            // Set current height explicitly for smooth close animation
            body.style.maxHeight = body.scrollHeight + 'px';
            // Force reflow
            body.offsetHeight;
            // Animate to 0
            body.style.maxHeight = '0px';
            item.classList.remove('open');
          }
        });

        if (isOpen) {
          // Also close any open subtopic accordions inside
          currentAccordion
            .querySelectorAll('.subtopic-accordion.open')
            .forEach((subtopic) => {
              const subtopicBody = subtopic.querySelector('.subtopic-body');
              subtopicBody.style.maxHeight = '0px';
              subtopic.classList.remove('open');
            });

          // Closing: animate from current height to 0
          accordionBody.style.maxHeight = accordionBody.scrollHeight + 'px';
          // Force reflow
          accordionBody.offsetHeight;
          // Animate to 0
          accordionBody.style.maxHeight = '0px';
          currentAccordion.classList.remove('open');
        } else {
          // First scroll to top of page
          window.scrollTo({ top: 0, behavior: 'smooth' });

          // Then after a short delay, open accordion and scroll to it
          setTimeout(() => {
            // Opening: animate from 0 to actual height
            currentAccordion.classList.add('open');
            accordionBody.style.maxHeight = accordionBody.scrollHeight + 'px';

            // After animation completes, remove inline style for responsiveness
            setTimeout(() => {
              accordionBody.style.maxHeight = '';
            }, 800);

            // Add highlight animation
            currentAccordion.classList.add('accordion-highlight');
            setTimeout(() => {
              currentAccordion.classList.remove('accordion-highlight');
            }, 1500);

            // Scroll to the accordion after it opens
            setTimeout(() => {
              const headerRect = currentAccordion.getBoundingClientRect();
              const offset = 60; // Account for mobile header (52px) + some padding
              const targetY = window.scrollY + headerRect.top - offset;
              window.scrollTo({ top: targetY, behavior: 'smooth' });
            }, 850); // Wait for accordion animation (800ms) to complete
          }, 300); // Wait for scroll to top
        }
      };
    });

    // Subtopic accordion headers
    container.querySelectorAll('.subtopic-header').forEach((header) => {
      header.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const subtopicAccordion = header.closest('.subtopic-accordion');
        const subtopicBody = subtopicAccordion.querySelector('.subtopic-body');
        const isOpen = subtopicAccordion.classList.contains('open');

        if (isOpen) {
          // Closing: animate from current height to 0
          subtopicBody.style.maxHeight = subtopicBody.scrollHeight + 'px';
          subtopicBody.offsetHeight; // Force reflow
          subtopicBody.style.maxHeight = '0px';
          subtopicAccordion.classList.remove('open');
        } else {
          // Opening: animate from 0 to actual height
          subtopicAccordion.classList.add('open');
          subtopicBody.style.maxHeight = subtopicBody.scrollHeight + 'px';

          // After animation completes, remove inline style
          setTimeout(() => {
            subtopicBody.style.maxHeight = '';
          }, 600);
        }
      };
    });

    // Card preview items
    container.querySelectorAll('.card-preview-item').forEach((item) => {
      item.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        showCardPreview(container, item.dataset.cardId);
      };
    });

    // Highlight the previously clicked topic
    if (openTopicName) {
      const topicEl = container.querySelector(`.accordion-item.open`);
      if (topicEl) {
        topicEl.classList.add('accordion-highlight');
        topicEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Remove highlight after animation
        setTimeout(() => {
          topicEl.classList.remove('accordion-highlight');
        }, 1500);
      }
    }

    // Highlight the previously clicked subtopic
    if (highlightSubtopic) {
      const subtopicEl = container.querySelector(
        `[data-subtopic="${CSS.escape(highlightSubtopic)}"]`
      );
      if (subtopicEl) {
        subtopicEl.classList.add('subtopic-highlight');
        subtopicEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Remove highlight after animation
        setTimeout(() => {
          subtopicEl.classList.remove('subtopic-highlight');
        }, 1500);
      }
    }

    // Clean up URL (remove query params) after restoring state
    if (openTopicName || highlightSubtopic) {
      history.replaceState(null, '', '#/categories');
    }
  }

  function renderTopicAccordion(topic, stats, openTopicName) {
    const subtopics = DataLoader.getSubtopics(topic.name);
    const progress = StorageManager.getProgress(topic.cards);
    const topicStat = stats.topicStats[topic.name] || {
      knew: 0,
      partial: 0,
      forgot: 0,
    };
    const topicParam = encodeURIComponent(topic.name);
    const topicNum = topic.name.match(/^(\d+)/)?.[1] || '?';
    const isOpen = openTopicName === topic.name;

    return `
      <div class="accordion-item${isOpen ? ' open' : ''}">
        <div class="accordion-header">
          <div class="accordion-header-left">
            <span class="accordion-num">${topicNum}</span>
            <div>
              <div class="font-semibold" style="font-size: var(--font-size-sm);">${topic.name.replace(/^\d+\.\s*/, '')}</div>
              <div class="text-xs text-tertiary">${topic.cardCount} Karten · ${subtopics.length} Unterthemen</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs font-semibold text-secondary">${progress}%</span>
            <div class="accordion-chevron">
              <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>
        <div class="accordion-body">
          <div class="accordion-body-inner">
            <div class="mb-4">
              ${ProgressBar.createMulti(
                {
                  knew: topicStat.knew,
                  partial: topicStat.partial,
                  forgot: topicStat.forgot,
                },
                topic.cardCount,
                'progress-bar-sm'
              )}
            </div>
            <div class="mb-4">
              <a href="#/learn/${topicParam}" class="btn btn-primary btn-sm">Lernen</a>
            </div>
            ${subtopics.map((st) => renderSubtopicAccordion(st)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderSubtopicAccordion(subtopic) {
    const progress = StorageManager.getProgress(subtopic.cards);
    const _subtopicParam = encodeURIComponent(subtopic.name);
    const _topicParam = encodeURIComponent(subtopic.topic);
    const cards = subtopic.cards || [];

    return `
      <div class="subtopic-accordion" data-subtopic="${subtopic.name}">
        <div class="subtopic-header">
          <div class="subtopic-item-left">
            <div>
              <div class="subtopic-item-name">${subtopic.name}</div>
              <div class="subtopic-item-count">${subtopic.cardCount} Karten</div>
            </div>
          </div>
          <div class="subtopic-item-right">
            <span class="text-xs font-semibold text-secondary">${progress}%</span>
            <div class="subtopic-chevron">
              <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>
        <div class="subtopic-body">
          <div class="subtopic-body-inner">
            <div class="card-preview-list">
              ${cards.map((card, index) => renderCardPreviewItem(card, index)).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCardPreviewItem(card, index) {
    const questionPreview =
      card.question.length > 60
        ? `${card.question.substring(0, 60)}...`
        : card.question;

    return `
      <div class="card-preview-item" data-card-id="${card.id}">
        <span class="card-preview-num">${index + 1}</span>
        <span class="card-preview-question">${CardRenderer.escapeHtml(questionPreview)}</span>
        <span class="card-preview-arrow">→</span>
      </div>
    `;
  }

  function showCardPreview(_container, cardId) {
    const card = DataLoader.getCardById(parseInt(cardId, 10));
    if (!card) {
      console.error('Card not found for id:', cardId);
      return;
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'card-preview-modal';
    modal.innerHTML = `
      <div class="card-preview-modal-backdrop"></div>
      <div class="card-preview-modal-content">
        <button type="button" class="card-preview-close" aria-label="Schließen">×</button>
        <div class="card-preview-flashcard">
          ${CardRenderer.renderCard(card, false)}
        </div>
        <div class="card-preview-hint">
          Klicke oder drücke Space zum Umdrehen · Esc zum Schließen
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    activeCardPreview = modal;

    // Setup flashcard flip
    const flashcard = modal.querySelector('#flashcard');
    if (flashcard) {
      flashcard.addEventListener('click', () => {
        flashcard.classList.toggle('flipped');
      });
    }

    // Close handlers
    const closeBtn = modal.querySelector('.card-preview-close');
    const backdrop = modal.querySelector('.card-preview-modal-backdrop');

    closeBtn.addEventListener('click', () => closeCardPreview());
    backdrop.addEventListener('click', () => closeCardPreview());

    // Keyboard handler
    keyHandler = (e) => {
      if (e.key === 'Escape') {
        closeCardPreview();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (flashcard) {
          flashcard.classList.toggle('flipped');
        }
      }
    };
    document.addEventListener('keydown', keyHandler);

    // Animate in
    requestAnimationFrame(() => {
      modal.classList.add('visible');
    });

    // Try to load image
    CardRenderer.tryLoadImage(cardId);
  }

  function closeCardPreview() {
    if (activeCardPreview) {
      activeCardPreview.classList.remove('visible');
      setTimeout(() => {
        activeCardPreview.remove();
        activeCardPreview = null;
      }, 200);
    }
    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
  }

  function cleanup() {
    closeCardPreview();
    // Note: clickHandler is attached to container which gets replaced,
    // so it's automatically cleaned up when container.innerHTML is set
    _clickHandler = null;
  }

  return { render, cleanup };
})();

export default CategoriesView;
