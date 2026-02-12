// ============================================================
// wiki.js — Wiki view
// ============================================================

import CardRenderer from '../components/cardRenderer.js';
import DataLoader from '../services/DataLoader.js';

const WikiView = (() => {
  let _keydownHandler = null;
  let _searchDebounceTimer = null;
  let _activeDropdownIndex = -1;

  // Icons as raw SVG strings for direct usage
  const ICONS = {
    info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    cpu: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`,
    code: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    settings: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    fileText: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
    barChart: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>`,
    calendar: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
    terminal: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>`,
    lifeBuoy: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" x2="9.17" y1="4.93" y2="9.17"/><line x1="14.83" x2="19.07" y1="14.83" y2="19.07"/><line x1="14.83" x2="19.07" y1="9.17" y2="4.93"/><line x1="4.93" x2="9.17" y1="19.07" y2="14.83"/></svg>`,
    checkCircle: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    shieldCheck: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,
    image: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    chevronRight: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    wiki: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/><path d="M12 4v2"/><path d="M16 4v2"/></svg>`,
    search: `<svg class="wiki-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  };

  const TOPIC_ICON_MAP = {
    1: 'info',
    2: 'cpu',
    3: 'code',
    4: 'settings',
    5: 'fileText',
    6: 'barChart',
    7: 'calendar',
    8: 'terminal',
    9: 'lifeBuoy',
    10: 'checkCircle',
    11: 'shieldCheck',
    12: 'image',
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
      text: `${card.question} ${card.answer}`.toLowerCase(),
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

  function renderArticle(card) {
    return `
      <article class="wiki-article collapsed" id="card-${card.id}" data-card-id="${card.id}">
        <header class="wiki-article-header">
          <div class="wiki-article-title-row">
            <h3 class="wiki-article-title">${CardRenderer.escapeHtml(card.question)}</h3>
            <span class="wiki-article-chevron">${ICONS.chevronRight}</span>
          </div>
        </header>
        <div class="wiki-article-body flashcard-answer">${CardRenderer.formatAnswer(card.answer)}</div>
      </article>
    `;
  }

  // --- Helpers ---
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

  function toggleArticle(articleEl) {
    const isCollapsed = articleEl.classList.contains('collapsed');
    if (isCollapsed) {
      articleEl.classList.remove('collapsed');
    } else {
      articleEl.classList.add('collapsed');
    }
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
        const iconKey = TOPIC_ICON_MAP[num] || 'wiki';
        const iconHtml = ICONS[iconKey] || ICONS.wiki;

        const subtopicTags = topic.subtopics
          .slice(0, 3)
          .map((st) => {
            const short = st.replace(/^\d+\.\d+\s*/, '');
            return `<span class="wiki-topic-tag">${CardRenderer.escapeHtml(short)}</span>`;
          })
          .join('');
        const more =
          topic.subtopics.length > 3
            ? `<span class="wiki-topic-tag">+${topic.subtopics.length - 3}</span>`
            : '';

        return `
        <a href="#/wiki/${slugify(topic.name)}" class="wiki-topic-card">
          <div class="wiki-topic-card-icon">
            ${iconHtml}
          </div>
          <div class="wiki-topic-card-content">
            <div class="wiki-topic-card-header">
              <span class="wiki-topic-badge">${num}</span>
              <h3 class="wiki-topic-name">${CardRenderer.escapeHtml(displayName)}</h3>
            </div>
            <div class="wiki-topic-tags">${subtopicTags}${more}</div>
            <div class="wiki-topic-count">${topic.cardCount} Artikel</div>
          </div>
          <div class="wiki-topic-card-arrow">
            ${ICONS.chevronRight}
          </div>
        </a>
      `;
      })
      .join('');

    container.innerHTML = `
      <div class="view-enter">
        <div class="wiki-header">
          <h1>Wiki</h1>
          <div class="wiki-subtitle">${totalCards} Artikel in ${totalTopics} Themengebieten</div>
        </div>
        <div class="wiki-search-wrapper">
          ${ICONS.search}
          <input type="text" class="wiki-search-input" placeholder="Wiki durchsuchen..." />
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
            <a href="#/wiki" class="btn btn-primary">Zum Wiki</a>
          </div>
        </div>
      `;
      return;
    }

    const subtopics = DataLoader.getSubtopics(topicName);
    const allCards = DataLoader.getAllCards();
    const displayName = getTopicDisplayName(topicName);
    const num = getTopicNumber(topicName);
    const iconKey = TOPIC_ICON_MAP[num] || 'wiki';
    const iconHtml = ICONS[iconKey] || ICONS.wiki;

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
          <a href="#/wiki">Wiki</a>
          <span class="wiki-breadcrumb-sep">/</span>
          <span>${CardRenderer.escapeHtml(displayName)}</span>
        </div>
        
        <div class="wiki-topic-header">
          <div class="wiki-topic-header-icon">
            ${iconHtml}
          </div>
          <div class="wiki-topic-header-content">
            <span class="wiki-topic-badge">Thema ${num}</span>
            <h1>${CardRenderer.escapeHtml(displayName)}</h1>
          </div>
        </div>

        <div class="wiki-search-wrapper">
          ${ICONS.search}
          <input type="text" class="wiki-search-input" placeholder="Thema durchsuchen..." />
          <span class="wiki-search-kbd">/</span>
          <div class="wiki-search-dropdown"></div>
        </div>

        <div class="wiki-controls">
          <button type="button" class="wiki-control-btn" id="wiki-toggle-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg>
            Alle aufklappen
          </button>
        </div>
        
        <div class="wiki-content-layout">
          <aside class="wiki-sidebar">
            <div class="wiki-toc">
              <div class="wiki-toc-title">Inhaltsverzeichnis</div>
              <ul class="wiki-toc-list">${tocItems}</ul>
            </div>
          </aside>
          <main class="wiki-main">
            ${sections}
          </main>
        </div>
        
        <div class="wiki-back-top"><a href="#/wiki">Alle Themen anzeigen</a></div>
      </div>
    `;

    // Toggle All functionality
    const toggleAllBtn = container.querySelector('#wiki-toggle-all');
    let allExpanded = false;
    toggleAllBtn?.addEventListener('click', () => {
      allExpanded = !allExpanded;
      const articles = container.querySelectorAll('.wiki-article');
      articles.forEach((art) => {
        art.classList.toggle('collapsed', !allExpanded);
      });
      toggleAllBtn.innerHTML = allExpanded
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"></polyline><polyline points="17 18 12 13 7 18"></polyline></svg> Alle einklappen`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg> Alle aufklappen`;
    });

    // Individual Article Toggle
    container.querySelectorAll('.wiki-article-header').forEach((header) => {
      header.addEventListener('click', () => {
        const article = header.closest('.wiki-article');
        toggleArticle(article);
      });
    });

    // TOC smooth scroll
    container.querySelectorAll('.wiki-toc-link').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.tocIndex;
        const target = document.getElementById(`wiki-section-${idx}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });

          // Visual highlight after scrolling
          const observer = new IntersectionObserver(
            (entries) => {
              if (entries[0].isIntersecting) {
                observer.disconnect();
                // Clear any existing highlights
                container
                  .querySelectorAll('.wiki-subtopic-section.highlight-flash')
                  .forEach((el) => {
                    el.classList.remove('highlight-flash');
                  });

                // Trigger new highlight
                requestAnimationFrame(() => {
                  target.classList.add('highlight-flash');
                });
              }
            },
            { threshold: 0.2 }
          );
          observer.observe(target);
        }
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

  function _findTopicName(slug) {
    const decoded = unslugify(slug);
    const topics = DataLoader.getTopics();
    // Exact match first
    const exact = topics.find((t) => t.name === decoded);
    if (exact) return exact.name;
    // Slug match
    return topics.find((t) => slugify(t.name) === slug)?.name || null;
  }

  function _findSubtopicName(subtopics, slug) {
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
