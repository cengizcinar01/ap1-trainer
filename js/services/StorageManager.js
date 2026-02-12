// ============================================================
// StorageManager.js — LocalStorage abstraction for progress
// ============================================================

import SRS from '../data/srs.js';

class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'ap1_flashcard_progress';
    this.STORAGE_VERSION = 1;
    this._data = null;
  }

  _defaultData() {
    return {
      version: this.STORAGE_VERSION,
      cards: {},
      lastSession: null,
      totalReviews: 0,
      dailyReviews: {},
    };
  }

  _load() {
    if (this._data) return this._data;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        this._data = JSON.parse(raw);
        if (!this._data.version || this._data.version < this.STORAGE_VERSION) {
          this._data = {
            ...this._defaultData(),
            ...this._data,
            version: this.STORAGE_VERSION,
          };
          if (!this._data.dailyReviews) this._data.dailyReviews = {};
        }
      } else {
        this._data = this._defaultData();
      }
    } catch (e) {
      console.error('Failed to load from LocalStorage:', e);
      this._data = this._defaultData();
    }
    return this._data;
  }

  _save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._data));
    } catch (e) {
      console.error('Failed to save to LocalStorage:', e);
    }
  }

  init() {
    this._load();
    this._save();
  }

  /**
   * Get SRS state for a specific card.
   */
  getCardProgress(cardId) {
    const data = this._load();
    return data.cards[cardId] || null;
  }

  /**
   * Update card progress after a review.
   */
  updateCardProgress(cardId, rating) {
    const data = this._load();
    const currentState = data.cards[cardId] || SRS.createInitialState();
    const newState = SRS.calculateNext(currentState, rating);
    data.cards[cardId] = newState;

    data.totalReviews++;
    data.lastSession = new Date().toISOString();

    const today = this._getDateString(new Date());
    data.dailyReviews[today] = (data.dailyReviews[today] || 0) + 1;

    this._save();
    return newState;
  }

  /**
   * Get all cards with their states, sorted by priority.
   * Nicht gewusst first → Unsicher → Neu → Gewusst last
   */
  getSessionCards(cards) {
    const data = this._load();
    const result = cards.map((card) => ({
      card,
      state: data.cards[card.id] || null,
    }));
    return SRS.sortByPriority(result);
  }

  /**
   * Get aggregated statistics.
   */
  getStatistics(allCards) {
    const data = this._load();
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

    const today = this._getDateString(new Date());
    stats.todayReviews = data.dailyReviews[today] || 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = this._getDateString(d);
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
  getProgress(cards) {
    const data = this._load();
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
  resetProgress() {
    this._data = this._defaultData();
    this._save();
  }

  /**
   * Export data as JSON string.
   */
  exportData() {
    return JSON.stringify(this._load(), null, 2);
  }

  /**
   * Import data from JSON string.
   */
  importData(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (imported.cards && typeof imported.cards === 'object') {
        this._data = { ...this._defaultData(), ...imported };
        this._data.version = this.STORAGE_VERSION;
        this._save();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  _getDateString(date) {
    return date.toISOString().split('T')[0];
  }
}

// Export singleton
export default new StorageManager();
