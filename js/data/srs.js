// ============================================================
// srs.js — Simple learning state tracker
// Three states: gewusst (3), unsicher (2), nicht gewusst (1)
// ============================================================

const SRS = (() => {
  // Rating constants
  const RATING = {
    FORGOT: 1, // Nicht gewusst
    PARTIAL: 2, // Unsicher
    KNEW: 3, // Gewusst
  };

  /**
   * Create initial SRS state for a new card.
   */
  function createInitialState() {
    return {
      lastRating: null,
      lastReview: null,
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      partialCount: 0,
    };
  }

  /**
   * Calculate the next state based on current state and user rating.
   */
  function calculateNext(currentState, rating) {
    const state = {...currentState};

    if (![RATING.FORGOT, RATING.PARTIAL, RATING.KNEW].includes(rating)) {
      throw new Error(`Invalid rating: ${rating}. Must be 1, 2, or 3.`);
    }

    state.reviewCount++;
    state.lastRating = rating;
    state.lastReview = new Date().toISOString();

    if (rating === RATING.FORGOT) {
      state.incorrectCount++;
    } else if (rating === RATING.PARTIAL) {
      state.partialCount++;
    } else {
      state.correctCount++;
    }

    return state;
  }

  /**
   * Sort cards by priority for learning sessions.
   * Order: Nicht gewusst (1) first → Unsicher (2) → Neu (null) → Gewusst (3) last
   */
  function sortByPriority(cards) {
    const priorityOrder = {
      1: 0, // Nicht gewusst — highest priority
      2: 1, // Unsicher
      null: 2, // Neu (never reviewed)
      3: 3, // Gewusst — lowest priority
    };

    return [...cards].sort((a, b) => {
      const aRating = a.state ? a.state.lastRating : null;
      const bRating = b.state ? b.state.lastRating : null;
      const aPrio = priorityOrder[aRating] ?? 2;
      const bPrio = priorityOrder[bRating] ?? 2;
      return aPrio - bPrio;
    });
  }

  /**
   * Get the mastery level of a card based on its state.
   * Returns: 'new', 'forgot', 'partial', 'knew'
   */
  function getMasteryLevel(cardState) {
    if (!cardState || cardState.reviewCount === 0) return 'new';
    if (cardState.lastRating === RATING.FORGOT) return 'forgot';
    if (cardState.lastRating === RATING.PARTIAL) return 'partial';
    return 'knew';
  }

  return {
    RATING,
    createInitialState,
    calculateNext,
    sortByPriority,
    getMasteryLevel,
  };
})();

export default SRS;
