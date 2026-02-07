// ============================================================
// dataLoader.js — Fetches and caches data.json, provides query API
// ============================================================

const DataLoader = (() => {
  let _cards = null;
  let _topics = null;
  let _subtopics = null;

  /**
   * Load data.json and cache it in memory.
   * Must be called once before using other methods.
   */
  async function loadData() {
    if (_cards) return _cards;

    try {
      const response = await fetch('./data.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      _cards = await response.json();
      _buildIndexes();
      return _cards;
    } catch (error) {
      console.error('Failed to load data.json:', error);
      throw error;
    }
  }

  /**
   * Build topic/subtopic indexes for fast lookup.
   */
  function _buildIndexes() {
    const topicMap = new Map();
    const subtopicMap = new Map();

    _cards.forEach((card) => {
      // Build topic index
      if (!topicMap.has(card.topic)) {
        topicMap.set(card.topic, {
          name: card.topic,
          subtopics: new Set(),
          cardCount: 0,
          cards: [],
        });
      }
      const topic = topicMap.get(card.topic);
      topic.subtopics.add(card.subtopic);
      topic.cardCount++;
      topic.cards.push(card);

      // Build subtopic index
      if (!subtopicMap.has(card.subtopic)) {
        subtopicMap.set(card.subtopic, {
          name: card.subtopic,
          topic: card.topic,
          cardCount: 0,
          cards: [],
        });
      }
      const subtopic = subtopicMap.get(card.subtopic);
      subtopic.cardCount++;
      subtopic.cards.push(card);
    });

    // Convert Sets to Arrays
    topicMap.forEach((topic) => {
      topic.subtopics = Array.from(topic.subtopics);
    });

    _topics = topicMap;
    _subtopics = subtopicMap;
  }

  /**
   * Get all cards.
   */
  function getAllCards() {
    return _cards || [];
  }

  /**
   * Get list of unique topics with metadata.
   * Returns: [{ name, subtopics: [string], cardCount, cards: [card] }]
   */
  function getTopics() {
    if (!_topics) return [];
    return Array.from(_topics.values());
  }

  /**
   * Get subtopics for a given topic name.
   * Returns: [{ name, topic, cardCount, cards: [card] }]
   */
  function getSubtopics(topicName) {
    if (!_topics) return [];
    const topic = _topics.get(topicName);
    if (!topic) return [];
    return topic.subtopics.map((st) => _subtopics.get(st)).filter(Boolean);
  }

  /**
   * Get all subtopics across all topics.
   */
  function getAllSubtopics() {
    if (!_subtopics) return [];
    return Array.from(_subtopics.values());
  }

  /**
   * Get cards filtered by topic name.
   */
  function getCardsByTopic(topicName) {
    if (!_topics) return [];
    const topic = _topics.get(topicName);
    return topic ? topic.cards : [];
  }

  /**
   * Get cards filtered by subtopic name.
   */
  function getCardsBySubtopic(subtopicName) {
    if (!_subtopics) return [];
    const subtopic = _subtopics.get(subtopicName);
    return subtopic ? subtopic.cards : [];
  }

  /**
   * Get a single card by ID.
   */
  function getCardById(id) {
    if (!_cards) return null;
    return _cards.find((c) => c.id === id) || null;
  }

  /**
   * Get topic metadata by name.
   */
  function getTopic(topicName) {
    if (!_topics) return null;
    return _topics.get(topicName) || null;
  }

  return {
    loadData,
    getAllCards,
    getTopics,
    getSubtopics,
    getAllSubtopics,
    getCardsByTopic,
    getCardsBySubtopic,
    getCardById,
    getTopic,
  };
})();

export default DataLoader;
