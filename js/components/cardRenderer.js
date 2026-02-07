// ============================================================
// cardRenderer.js — Flashcard DOM rendering (with image support)
// ============================================================

const CardRenderer = (() => {
  /**
   * Render a flashcard with optional image support.
   * Images are looked for at: assets/images/{card.id}.png
   * The `card.image` field (if present) overrides this.
   *
   * @param {Object} card — card data from data.json
   * @param {boolean} [showMeta=true]
   * @returns {string}
   */
  function renderCard(card, showMeta = true) {
    const difficultyDots = Array.from(
      { length: 3 },
      (_, i) =>
        `<span class="flashcard-difficulty-dot ${i < card.difficulty ? 'active' : ''}"></span>`,
    ).join('');

    // Image path — cards can have an `image` field, or we check for assets/images/{id}.png
    const imagePath = card.image || null;

    return `
      <div class="flashcard" id="flashcard" tabindex="0">
        <div class="flashcard-inner">
          <div class="flashcard-face flashcard-front">
            <div class="flashcard-front-content">
              <div class="flashcard-question">${escapeHtml(card.question)}</div>
            </div>
            ${showMeta
        ? `
              <div class="flashcard-meta">
                <span class="flashcard-topic-badge">${escapeHtml(card.subtopic)}</span>
                <div class="flashcard-difficulty">${difficultyDots}</div>
              </div>
            `
        : ''
      }
          </div>
          <div class="flashcard-face flashcard-back">
            <div class="flashcard-back-content">
              <div class="flashcard-answer-label">Antwort</div>
              <div class="flashcard-answer">${formatAnswer(card.answer)}</div>
              ${imagePath
        ? `
                <div class="flashcard-image">
                  <img src="${escapeHtml(imagePath)}" alt="Illustration zu: ${escapeHtml(card.question)}" loading="lazy" />
                </div>
              `
        : `
                <div class="flashcard-image flashcard-image-placeholder" data-card-id="${card.id}" style="display:none;">
                  <img src="" alt="" loading="lazy" />
                </div>
              `
      }
            </div>
            ${showMeta
        ? `
              <div class="flashcard-meta">
                <span class="flashcard-topic-badge">${escapeHtml(card.subtopic)}</span>
                <div class="flashcard-difficulty">${difficultyDots}</div>
              </div>
            `
        : ''
      }
          </div>
        </div>
      </div>
    `;
  }

  /**
   * After rendering, try to load images from the default path.
   * Call this after inserting the card HTML into the DOM.
   */
  function tryLoadImage(cardId) {
    const placeholder = document.querySelector(
      `.flashcard-image-placeholder[data-card-id="${cardId}"]`,
    );
    if (!placeholder) return;

    const img = placeholder.querySelector('img');
    const path = `assets/images/${cardId}.png`;

    img.onload = () => {
      placeholder.style.display = '';
      placeholder.classList.remove('flashcard-image-placeholder');
    };
    img.onerror = () => {
      // Try jpg
      img.onerror = () => {
        placeholder.remove();
      };
      img.src = `assets/images/${cardId}.jpg`;
    };
    img.src = path;
  }

  function renderRatingButtons() {
    return `
      <div class="rating-buttons" id="ratingButtons">
        <button class="rating-btn rating-btn-forgot" data-rating="1">
          <span class="rating-btn-label">Nicht gewusst</span>
        </button>
        <button class="rating-btn rating-btn-partial" data-rating="2">
          <span class="rating-btn-label">Unsicher</span>
        </button>
        <button class="rating-btn rating-btn-knew" data-rating="3">
          <span class="rating-btn-label">Gewusst</span>
        </button>
      </div>
    `;
  }

  function renderKeyboardHints() {
    return `
      <div class="keyboard-hints">
        <div class="keyboard-hint">
          <span class="keyboard-key">Space</span>
          Umdrehen
        </div>
        <div class="keyboard-hint">
          <span class="keyboard-key">1</span>
          <span class="keyboard-key">2</span>
          <span class="keyboard-key">3</span>
          Bewerten
        </div>
      </div>
    `;
  }

  function renderSessionComplete(results) {
    return `
      <div class="session-complete card-dealt">
        <h2 class="session-complete-title">Session abgeschlossen! 🎉</h2>
        <p class="session-complete-text">
          ${results.total} Karten durchgearbeitet
        </p>
        <div class="session-stats">
          <div class="session-stat">
            <div class="session-stat-value success">${results.knew}</div>
            <div class="session-stat-label">Gewusst</div>
          </div>
          <div class="session-stat">
            <div class="session-stat-value warning">${results.partial}</div>
            <div class="session-stat-label">Unsicher</div>
          </div>
          <div class="session-stat">
            <div class="session-stat-value danger">${results.forgot}</div>
            <div class="session-stat-label">Nicht gewusst</div>
          </div>
        </div>
        <div class="session-actions">
          <a href="#/" class="btn btn-ghost">Dashboard</a>
          <a href="#/review" class="btn btn-primary">Nochmal lernen</a>
        </div>
      </div>
    `;
  }

  function formatAnswer(text) {
    let html = escapeHtml(text);

    // Convert section headers (lines ending with colon that start a new block)
    html = html.replace(/^([A-ZÄÖÜa-zäöü][^:•\n]{2,}):$/gm, '<div class="answer-section">$1</div>');
    html = html.replace(/\n([A-ZÄÖÜa-zäöü][^:•\n]{2,}):$/gm, '</p>\n<div class="answer-section">$1</div>\n<p>');

    // Convert formulas and code (text between backticks or mathematical expressions)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/(\d+\s*[×xX+\-÷=]\s*\d+[\s=\d×xX+\-÷]*)/g, '<code>$1</code>');

    // Highlight important numbers with units
    html = html.replace(/(\d+(?:[,.]\d+)?)\s*(MB\/s|GB\/s|MHz|GHz|GB|MB|KB|TB|Bit|Byte|ms|%|€|V|A|W)/g, '<span class="highlight">$1 $2</span>');

    // Highlight keywords in parentheses (often technical terms)
    html = html.replace(/\(([A-Z]{2,}[^)]*)\)/g, '(<span class="highlight">$1</span>)');

    // Convert bullet points to proper list items
    // First, wrap consecutive bullet lines in a <ul>
    html = html.replace(/((?:^|\n)• [^\n]+(?:\n• [^\n]+)*)/g, (match) => {
      const items = match.split('\n')
        .filter(line => line.startsWith('•'))
        .map(line => `<li>${line.substring(2)}</li>`)
        .join('\n');
      return `</p>\n<ul>${items}</ul>\n<p>`;
    });

    // Handle "+" advantages and "-" disadvantages  
    html = html.replace(/\+ ([^\n|]+)/g, '<span class="pro">+ $1</span>');
    html = html.replace(/- ([^\n|]+)(?=\n|$|<)/g, '<span class="con">− $1</span>');

    // Handle numbered lists (1., 2., etc.)
    html = html.replace(/(\d+)\.\s+([^\n]+)/g, '<strong>$1.</strong> $2');

    // Double newlines = new paragraph
    html = html.replace(/\n\n/g, '</p>\n<p>');

    // Single newlines = line break
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraph
    html = '<p>' + html + '</p>';

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>\s*<br>\s*<\/p>/g, '');

    return html;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    renderCard,
    renderRatingButtons,
    renderKeyboardHints,
    renderSessionComplete,
    tryLoadImage,
    escapeHtml,
    formatAnswer,
  };
})();

export default CardRenderer;
