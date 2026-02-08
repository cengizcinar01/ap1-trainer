// ============================================================
// wiki.js — Wiki / Nachschlagewerk view
// ============================================================

import CardRenderer from '../components/cardRenderer.js';
import DataLoader from '../data/dataLoader.js';

const WikiView = (() => {
  let _keydownHandler = null;
  let _searchDebounceTimer = null;
  let _activeDropdownIndex = -1;

  const SEARCH_ICON = `<svg class="wiki-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

  // --- Type label mapping ---
  const TYPE_LABELS = {
    definition: 'Definition',
    vergleich: 'Vergleich',
    praxis: 'Praxis',
    berechnung: 'Berechnung',
  };

  // --- Helpers ---

  function slugify(str) {
    return encodeURIComponent(str.replace(/\s+/g, '-'));
  }

  function unslugify(slug) {
    return decodeURIComponent(slug).replace(/-/g, ' ');
  }

  function getTopicNumber(topicName) {
    const match = topicName.match(/^(\d+)\./);
    return match ? match[1] : '';
  }

  function getTopicDisplayName(topicName) {
    return topicName.replace(/^\d+\.\s*/, '');
  }

  function buildSearchIndex(cards) {
    return cards.map((card) => ({
      card,
      text: `${card.question} ${card.answer} ${(card.tags || []).join(' ')}`.toLowerCase(),
    }));
  }

  function searchCards(index, query) {
    if (!query.trim()) return [];
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const results = [];
    for (const entry of index) {
      if (terms.every((term) => entry.text.includes(term))) {
        results.push(entry.card);
        if (results.length >= 30) break;
      }
    }
    return results;
  }

  function renderDifficultyDots(difficulty) {
    return Array.from(
      { length: 3 },
      (_, i) =>
        `<span class="wiki-article-difficulty-dot ${i < difficulty ? 'active' : ''}"></span>`
    ).join('');
  }

  function renderArticle(card) {
    const typeLabel = TYPE_LABELS[card.type] || card.type || '';
    const dataType = card.type || 'definition';
    const tags = (card.tags || [])
      .map(
        (t) =>
          `<span class="wiki-article-tag">${CardRenderer.escapeHtml(t)}</span>`
      )
      .join('');

    return `
      <article class="wiki-article" id="card-${card.id}" data-card-id="${card.id}">
        <h3 class="wiki-article-title">${CardRenderer.escapeHtml(card.question)}</h3>
        <div class="wiki-article-meta">
          ${typeLabel ? `<span class="wiki-article-type" data-type="${dataType}">${typeLabel}</span>` : ''}
          <div class="wiki-article-difficulty">${renderDifficultyDots(card.difficulty)}</div>
          ${tags ? `<div class="wiki-article-tags">${tags}</div>` : ''}
        </div>
        <div class="wiki-article-body flashcard-answer">${CardRenderer.formatAnswer(card.answer)}</div>
      </article>
    `;
  }

  // --- Search Dropdown Logic ---

  function setupSearch(container, allCards) {
    const input = container.querySelector('.wiki-search-input');
    const dropdown = container.querySelector('.wiki-search-dropdown');
    if (!input || !dropdown) return;

    const index = buildSearchIndex(allCards);

    function hideDropdown() {
      dropdown.classList.remove('visible');
      dropdown.innerHTML = '';
      _activeDropdownIndex = -1;
    }

    function showResults(query) {
      const results = searchCards(index, query);
      _activeDropdownIndex = -1;

      if (!query.trim()) {
        hideDropdown();
        return;
      }

      if (results.length === 0) {
        dropdown.innerHTML = `<div class="wiki-search-no-results">Keine Ergebnisse</div>`;
        dropdown.classList.add('visible');
        return;
      }

      dropdown.innerHTML = results
        .map(
          (card, i) => `
        <div class="wiki-search-result" data-index="${i}" data-topic="${card.topic}" data-card-id="${card.id}">
          <div class="wiki-search-result-question">${CardRenderer.escapeHtml(card.question)}</div>
          <div class="wiki-search-result-meta">${CardRenderer.escapeHtml(card.topic)} — ${CardRenderer.escapeHtml(card.subtopic)}</div>
        </div>
      `
        )
        .join('');
      dropdown.classList.add('visible');

      dropdown.querySelectorAll('.wiki-search-result').forEach((el) => {
        el.addEventListener('click', () => {
          const topic = el.dataset.topic;
          const cardId = el.dataset.cardId;
          hideDropdown();
          input.value = '';
          window.location.hash = `#/wiki/${slugify(topic)}?highlight=${cardId}`;
        });
      });
    }

    input.addEventListener('input', () => {
      clearTimeout(_searchDebounceTimer);
      _searchDebounceTimer = setTimeout(() => showResults(input.value), 200);
    });

    input.addEventListener('keydown', (e) => {
      const items = dropdown.querySelectorAll('.wiki-search-result');
      if (!items.length) {
        if (e.key === 'Escape') {
          input.blur();
          hideDropdown();
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        _activeDropdownIndex = Math.min(
          _activeDropdownIndex + 1,
          items.length - 1
        );
        updateActiveResult(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        _activeDropdownIndex = Math.max(_activeDropdownIndex - 1, 0);
        updateActiveResult(items);
      } else if (e.key === 'Enter' && _activeDropdownIndex >= 0) {
        e.preventDefault();
        items[_activeDropdownIndex].click();
      } else if (e.key === 'Escape') {
        hideDropdown();
        input.blur();
      }
    });

    input.addEventListener('focus', () => {
      if (input.value.trim()) showResults(input.value);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (
        !container.querySelector('.wiki-search-wrapper')?.contains(e.target)
      ) {
        hideDropdown();
      }
    });
  }

  function updateActiveResult(items) {
    items.forEach((el, i) => {
      el.classList.toggle('active', i === _activeDropdownIndex);
    });
    if (_activeDropdownIndex >= 0 && items[_activeDropdownIndex]) {
      items[_activeDropdownIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  // --- Render: Overview ---

  function renderOverview(container) {
    const topics = DataLoader.getTopics();
    const allCards = DataLoader.getAllCards();
    const totalCards = allCards.length;
    const totalTopics = topics.length;

    const topicCards = topics
      .map((topic) => {
        const num = getTopicNumber(topic.name);
        const displayName = getTopicDisplayName(topic.name);
        const subtopicTags = topic.subtopics
          .slice(0, 4)
          .map((st) => {
            const short = st.replace(/^\d+\.\d+\s*/, '');
            return `<span class="wiki-topic-tag">${CardRenderer.escapeHtml(short)}</span>`;
          })
          .join('');
        const more =
          topic.subtopics.length > 4
            ? `<span class="wiki-topic-tag">+${topic.subtopics.length - 4}</span>`
            : '';

        return `
        <a href="#/wiki/${slugify(topic.name)}" class="wiki-topic-card">
          <div class="wiki-topic-card-header">
            <span class="wiki-topic-badge">${num}</span>
            <span class="wiki-topic-name">${CardRenderer.escapeHtml(displayName)}</span>
          </div>
          <div class="wiki-topic-count">${topic.cardCount} Artikel</div>
          <div class="wiki-topic-tags">${subtopicTags}${more}</div>
        </a>
      `;
      })
      .join('');

    container.innerHTML = `
      <div class="view-enter">
        <div class="wiki-header">
          <h1>Nachschlagewerk</h1>
          <div class="wiki-subtitle">${totalCards} Artikel in ${totalTopics} Themengebieten</div>
        </div>
        <div class="wiki-search-wrapper">
          ${SEARCH_ICON}
          <input type="text" class="wiki-search-input" placeholder="Artikel suchen..." />
          <span class="wiki-search-kbd">/</span>
          <div class="wiki-search-dropdown"></div>
        </div>
        <div class="wiki-topic-grid">${topicCards}</div>
      </div>
    `;

    setupSearch(container, allCards);
  }

  // --- Render: Topic Page ---

  function renderTopicPage(container, topicSlug, subtopicSlug) {
    const topicName = findTopicName(topicSlug);
    if (!topicName) {
      container.innerHTML = `
        <div class="view-enter">
          <div class="empty-state">
            <div class="empty-state-icon">404</div>
            <h2 class="empty-state-title">Thema nicht gefunden</h2>
            <a href="#/wiki" class="btn btn-primary">Zum Nachschlagewerk</a>
          </div>
        </div>
      `;
      return;
    }

    const subtopics = DataLoader.getSubtopics(topicName);
    const allCards = DataLoader.getAllCards();
    const displayName = getTopicDisplayName(topicName);

    // Build TOC
    const tocItems = subtopics
      .map((st, i) => {
        return `
        <li class="wiki-toc-item">
          <button type="button" class="wiki-toc-link" data-toc-index="${i}">
            <span class="wiki-toc-num">${i + 1}</span>
            <span class="wiki-toc-label">${CardRenderer.escapeHtml(st.name)}</span>
            <span class="wiki-toc-count">${st.cardCount}</span>
          </button>
        </li>
      `;
      })
      .join('');

    // Build article sections
    const sections = subtopics
      .map((st, i) => {
        const articles = st.cards.map((card) => renderArticle(card)).join('');
        return `
        <section class="wiki-subtopic-section" id="wiki-section-${i}" data-subtopic-name="${CardRenderer.escapeHtml(st.name)}">
          <h2 class="wiki-subtopic-title">${CardRenderer.escapeHtml(st.name)}</h2>
          ${articles}
        </section>
      `;
      })
      .join('');

    container.innerHTML = `
      <div class="view-enter">
        <div class="wiki-breadcrumb">
          <a href="#/wiki">Nachschlagewerk</a>
          <span class="wiki-breadcrumb-sep">/</span>
          <span>${CardRenderer.escapeHtml(displayName)}</span>
        </div>
        <div class="wiki-topic-header">
          <span class="wiki-topic-badge">${getTopicNumber(topicName)}</span>
          <h1>${CardRenderer.escapeHtml(displayName)}</h1>
        </div>
        <div class="wiki-search-wrapper">
          ${SEARCH_ICON}
          <input type="text" class="wiki-search-input" placeholder="Artikel suchen..." />
          <span class="wiki-search-kbd">/</span>
          <div class="wiki-search-dropdown"></div>
        </div>
        <div class="wiki-toc">
          <div class="wiki-toc-title">Inhaltsverzeichnis</div>
          <ul class="wiki-toc-list">${tocItems}</ul>
        </div>
        ${sections}
        <div class="wiki-back-top"><a href="#/wiki">Alle Themen anzeigen</a></div>
      </div>
    `;

    // TOC smooth scroll
    container.querySelectorAll('.wiki-toc-link').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.tocIndex;
        const target = document.getElementById(`wiki-section-${idx}`);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    setupSearch(container, allCards);

    // Handle deep-link scroll to subtopic
    if (subtopicSlug) {
      requestAnimationFrame(() => {
        const subtopicName = findSubtopicName(subtopics, subtopicSlug);
        if (subtopicName) {
          const idx = subtopics.findIndex((st) => st.name === subtopicName);
          if (idx >= 0) {
            const target = document.getElementById(`wiki-section-${idx}`);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    }

    // Handle highlight from search — start animation only when visible
    const hash = window.location.hash;
    const highlightMatch = hash.match(/[?&]highlight=(\d+)/);
    if (highlightMatch) {
      const cardId = highlightMatch[1];
      setTimeout(() => {
        const articleEl = container.querySelector(`#card-${cardId}`);
        if (articleEl) {
          articleEl.scrollIntoView({ behavior: 'smooth' });
          const observer = new IntersectionObserver(
            (entries) => {
              if (entries[0].isIntersecting) {
                observer.disconnect();
                articleEl.classList.add('highlight-flash');
              }
            },
            { threshold: 0.3 }
          );
          observer.observe(articleEl);
        }
      }, 80);
    }
  }

  function findTopicName(slug) {
    const decoded = unslugify(slug);
    const topics = DataLoader.getTopics();
    // Exact match first
    const exact = topics.find((t) => t.name === decoded);
    if (exact) return exact.name;
    // Slug match
    return topics.find((t) => slugify(t.name) === slug)?.name || null;
  }

  function findSubtopicName(subtopics, slug) {
    const decoded = unslugify(slug);
    const exact = subtopics.find((st) => st.name === decoded);
    if (exact) return exact.name;
    return subtopics.find((st) => slugify(st.name) === slug)?.name || null;
  }

  // --- Public API ---

  function render(container, params = {}) {
    if (params.topic && params.subtopic) {
      renderTopicPage(container, params.topic, params.subtopic);
    } else if (params.topic) {
      renderTopicPage(container, params.topic, null);
    } else {
      renderOverview(container);
    }

    // Global keyboard shortcut: / to focus search
    _keydownHandler = (e) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(
          document.activeElement.tagName
        )
      ) {
        e.preventDefault();
        const input = container.querySelector('.wiki-search-input');
        if (input) input.focus();
      }
    };
    document.addEventListener('keydown', _keydownHandler);
  }

  function cleanup() {
    if (_keydownHandler) {
      document.removeEventListener('keydown', _keydownHandler);
      _keydownHandler = null;
    }
    clearTimeout(_searchDebounceTimer);
    _searchDebounceTimer = null;
    _activeDropdownIndex = -1;
  }

  return { render, cleanup };
})();

export default WikiView;
