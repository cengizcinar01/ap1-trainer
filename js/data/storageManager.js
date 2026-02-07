// ============================================================
// storageManager.js — LocalStorage abstraction for progress
// ============================================================

import SRS from './srs.js';

const StorageManager = (() => {
  const STORAGE_KEY = 'ap1_flashcard_progress';
  const STORAGE_VERSION = 1;

  let _data = null;

  function _defaultData() {
    return {
      version: STORAGE_VERSION,
      cards: {},
      lastSession: null,
      totalReviews: 0,
      dailyReviews: {},
    };
  }

  function _load() {
    if (_data) return _data;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        _data = JSON.parse(raw);
        if (!_data.version || _data.version < STORAGE_VERSION) {
          _data = { ..._defaultData(), ..._data, version: STORAGE_VERSION };
          if (!_data.dailyReviews) _data.dailyReviews = {};
        }
      } else {
        _data = _defaultData();
      }
    } catch (e) {
      console.error('Failed to load from LocalStorage:', e);
      _data = _defaultData();
    }
    return _data;
  }

  function _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
    } catch (e) {
      console.error('Failed to save to LocalStorage:', e);
    }
  }

  function init() {
    _load();
    _save();
  }

  /**
   * Get SRS state for a specific card.
   */
  function getCardProgress(cardId) {
    const data = _load();
    return data.cards[cardId] || null;
  }

  /**
   * Update card progress after a review.
   */
  function updateCardProgress(cardId, rating) {
    const data = _load();
    const currentState = data.cards[cardId] || SRS.createInitialState();
    const newState = SRS.calculateNext(currentState, rating);
    data.cards[cardId] = newState;

    data.totalReviews++;
    data.lastSession = new Date().toISOString();

    const today = _getDateString(new Date());
    data.dailyReviews[today] = (data.dailyReviews[today] || 0) + 1;

    _save();
    return newState;
  }

  /**
   * Get all cards with their states, sorted by priority.
   * Nicht gewusst first → Unsicher → Neu → Gewusst last
   */
  function getSessionCards(cards) {
    const data = _load();
    const result = cards.map((card) => ({
      card,
      state: data.cards[card.id] || null,
    }));
    return SRS.sortByPriority(result);
  }

  /**
   * Get aggregated statistics.
   */
  function getStatistics(allCards) {
    const data = _load();
    const stats = {
      totalCards: allCards.length,
      reviewedCards: 0,
      knewCards: 0,
      partialCards: 0,
      forgotCards: 0,
      newCards: 0,
      totalReviews: data.totalReviews,
      todayReviews: 0,
      weekReviews: 0,
      topicStats: {},
      dailyReviews: data.dailyReviews || {},
    };

    const today = _getDateString(new Date());
    stats.todayReviews = data.dailyReviews[today] || 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = _getDateString(d);
      stats.weekReviews += data.dailyReviews[key] || 0;
    }

    allCards.forEach((card) => {
      const state = data.cards[card.id] || null;
      const mastery = SRS.getMasteryLevel(state);

      if (mastery === 'new') stats.newCards++;
      else if (mastery === 'forgot') stats.forgotCards++;
      else if (mastery === 'partial') stats.partialCards++;
      else if (mastery === 'knew') stats.knewCards++;

      if (state && state.reviewCount > 0) stats.reviewedCards++;

      if (!stats.topicStats[card.topic]) {
        stats.topicStats[card.topic] = {
          total: 0,
          knew: 0,
          partial: 0,
          forgot: 0,
          new: 0,
        };
      }
      const ts = stats.topicStats[card.topic];
      ts.total++;
      ts[mastery]++;
    });

    return stats;
  }

  /**
   * Get progress percentage for a set of cards.
   * Gewusst = 100%, Unsicher = 40%, Nicht gewusst/Neu = 0%
   */
  function getProgress(cards) {
    const data = _load();
    if (!cards || cards.length === 0) return 0;

    let score = 0;
    cards.forEach((card) => {
      const state = data.cards[card.id] || null;
      const level = SRS.getMasteryLevel(state);
      if (level === 'knew') score += 1;
      else if (level === 'partial') score += 0.4;
    });

    return Math.round((score / cards.length) * 100);
  }

  /**
   * Reset all progress.
   */
  function resetProgress() {
    _data = _defaultData();
    _save();
  }

  /**
   * Export data as JSON string.
   */
  function exportData() {
    return JSON.stringify(_load(), null, 2);
  }

  /**
   * Import data from JSON string.
   */
  function importData(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (imported.cards && typeof imported.cards === 'object') {
        _data = { ..._defaultData(), ...imported };
        _data.version = STORAGE_VERSION;
        _save();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  function _getDateString(date) {
    return date.toISOString().split('T')[0];
  }

  return {
    init,
    getCardProgress,
    updateCardProgress,
    getSessionCards,
    getStatistics,
    getProgress,
    resetProgress,
    exportData,
    importData,
  };
})();

export default StorageManager;
