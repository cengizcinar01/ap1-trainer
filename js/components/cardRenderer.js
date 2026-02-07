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
        `<span class="flashcard-difficulty-dot ${i < card.difficulty ? 'active' : ''}"></span>`
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
            ${
              showMeta
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
              ${
                imagePath
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
            ${
              showMeta
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
      `.flashcard-image-placeholder[data-card-id="${cardId}"]`
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

  /**
   * Format answer text with proper HTML markup.
   * Uses a line-by-line parser for better control over structure.
   */
  function formatAnswer(text) {
    const lines = text.split('\n');
    const result = [];
    let inList = false;
    let listItems = [];
    let inTable = false;
    let tableRows = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines but preserve spacing
      if (trimmed === '') {
        if (inList) {
          result.push(`<ul class="answer-list">${listItems.join('')}</ul>`);
          listItems = [];
          inList = false;
        }
        if (inTable) {
          result.push(
            `<div class="answer-table mb-4">${tableRows.join('')}</div>`
          );
          tableRows = [];
          inTable = false;
        }
        continue;
      }

      // Check for table rows (lines containing |)
      // Skip if it looks like a Pro/Con comparison with + and -
      if (
        trimmed.includes('|') &&
        !(/\+\s+/.test(trimmed) && /-\s+/.test(trimmed))
      ) {
        if (!inTable) inTable = true;
        const cells = trimmed
          .split('|')
          .map((c) => c.trim())
          .filter((c) => c);
        const cellHtml = cells
          .map((cell, idx) =>
            idx === 0
              ? `<div class="font-bold">${cell}</div>`
              : `<div>${cell}</div>`
          )
          .join('');
        tableRows.push(`<div class="answer-row">${cellHtml}</div>`);
        continue;
      }

      // End table if we were in one
      if (inTable) {
        result.push(
          `<div class="answer-table mb-4">${tableRows.join('')}</div>`
        );
        tableRows = [];
        inTable = false;
      }

      // Check for section headers (lines ending with colon, not bullet points)
      if (/^[A-ZÄÖÜa-zäöü][^:]{2,50}:$/.test(trimmed)) {
        if (inList) {
          result.push(`<ul class="answer-list">${listItems.join('')}</ul>`);
          listItems = [];
          inList = false;
        }
        result.push(
          `<div class="answer-section">${trimmed.slice(0, -1)}</div>`
        );
        continue;
      }

      // Check for bullet points
      if (/^[•-]\s+/.test(trimmed)) {
        if (!inList) inList = true;
        let content = trimmed.replace(/^[•-]\s+/, '');
        // Apply inline formatting to content
        content = formatInline(content);
        if (content.startsWith('+')) {
          listItems.push(`<li class="pro">${content}</li>`);
        } else if (content.startsWith('−') || content.startsWith('- ')) {
          listItems.push(`<li class="con">${content}</li>`);
        } else {
          listItems.push(`<li>${content}</li>`);
        }
        continue;
      }

      // End list if we were in one
      if (inList) {
        result.push(`<ul class="answer-list">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }

      // Check for numbered lists (1. 2. 3. etc. at start of line)
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        const num = numberedMatch[1];
        let content = numberedMatch[2];
        // Apply inline formatting
        content = formatInline(content);
        result.push(
          `<div class="mb-2"><span class="font-bold text-accent mr-2">${num}.</span>${content}</div>`
        );
        continue;
      }

      // Regular paragraph line - apply inline formatting
      result.push(`<p>${formatInline(trimmed)}</p>`);
    }

    // Flush any remaining list or table
    if (inList) {
      result.push(`<ul class="answer-list">${listItems.join('')}</ul>`);
    }
    if (inTable) {
      result.push(`<div class="answer-table mb-4">${tableRows.join('')}</div>`);
    }

    return result.join('\n');
  }

  /**
   * Apply inline formatting to a line of text.
   * Handles code, abbreviations, units, equations, etc.
   */
  function formatInline(text) {
    // Code/inline formulas with backticks
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Technical abbreviations in parentheses (2-4 uppercase letters)
    text = text.replace(
      /\(([A-Z]{2,4})\)/g,
      '(<span class="tech-abbr">$1</span>)'
    );

    // Simple math expressions WITHOUT units - must come before units replacement
    // Match: 3200 × 2, 8 + 4, etc. but NOT 51.200 MB/s or 3.14 GHz
    text = text.replace(
      /(\d[\d\s.,]*\s*[×xX+\-÷]\s*[\d\s.,]+)(?!\s*(?:MB\/s|GB\/s|Mbit\/s|Gbit\/s|MHz|GHz|GB|MB|KB|KiB|MiB|GiB|TiB|TB|Bit|Byte|ms|%|€|V|A|W|Bit))/g,
      '<span class="formula">$1</span>'
    );

    // Numbers with units
    text = text.replace(
      /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+(?:[.,]\d+)?)\s*(MB\/s|GB\/s|Mbit\/s|Gbit\/s|MHz|GHz|GB|MB|KB|KiB|MiB|GiB|TiB|TB|Bit|Byte|ms|%|€|V|A|W)(?!\w)/g,
      '<span class="highlight">$1 $2</span>'
    );

    // Pro/Con indicators (+ and -) in text
    // After | symbol
    text = text.replace(
      /\|\s*\+\s+/g,
      '| <span class="pro-indicator">+</span> '
    );
    text = text.replace(
      /\|\s*-\s+/g,
      '| <span class="con-indicator">-</span> '
    );
    // After : symbol
    text = text.replace(
      /:\s*\+\s+/g,
      ': <span class="pro-indicator">+</span> '
    );
    text = text.replace(/:\s*-\s+/g, ': <span class="con-indicator">-</span> ');
    // After . (period) - for cases like "...Vorgesetzten. + Klare..."
    text = text.replace(
      /\.\s*\+\s+/g,
      '. <span class="pro-indicator">+</span> '
    );
    text = text.replace(
      /\.\s*-\s+/g,
      '. <span class="con-indicator">-</span> '
    );

    return text;
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
  };
})();

export default CardRenderer;
