// ============================================================
// DataLoader.js — Fetches and caches data.json, provides query API
// ============================================================

class DataLoader {
  constructor() {
    this._cards = null;
    this._topics = null;
    this._subtopics = null;
  }

  /**
   * Load all topic JSON files and merge them in memory.
   */
  async loadData() {
    if (this._cards) return this._cards;

    try {
      // 1. Fetch the index of topic files
      const indexResponse = await fetch('./data/index.json');
      if (!indexResponse.ok)
        throw new Error(`HTTP ${indexResponse.status} while fetching index`);
      const topicFiles = await indexResponse.json();

      // 2. Fetch all topic files in parallel
      const fetchPromises = topicFiles.map((file) =>
        fetch(`./data/topics/${file}`).then((res) => {
          if (!res.ok) throw new Error(`Failed to load ${file}`);
          return res.json();
        })
      );

      const results = await Promise.all(fetchPromises);

      // 3. Merge all cards into one array
      this._cards = results.flat();

      // 4. Sort them (just in case) and build indexes
      this._cards.sort((a, b) => a.id - b.id);

      this._buildIndexes();
      return this._cards;
    } catch (error) {
      console.error('Failed to load data:', error);
      throw error;
    }
  }

  /**
   * Build topic/subtopic indexes for fast lookup.
   */
  _buildIndexes() {
    const topicMap = new Map();
    const subtopicMap = new Map();

    this._cards.forEach((card) => {
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

    this._topics = topicMap;
    this._subtopics = subtopicMap;
  }

  /**
   * Get all cards.
   */
  getAllCards() {
    return this._cards || [];
  }

  /**
   * Get list of unique topics with metadata.
   * Returns: [{ name, subtopics: [string], cardCount, cards: [card] }]
   */
  getTopics() {
    if (!this._topics) return [];
    return Array.from(this._topics.values());
  }

  /**
   * Get subtopics for a given topic name.
   * Returns: [{ name, topic, cardCount, cards: [card] }]
   */
  getSubtopics(topicName) {
    if (!this._topics) return [];
    const topic = this._topics.get(topicName);
    if (!topic) return [];
    return topic.subtopics.map((st) => this._subtopics.get(st)).filter(Boolean);
  }

  /**
   * Get all subtopics across all topics.
   */
  getAllSubtopics() {
    if (!this._subtopics) return [];
    return Array.from(this._subtopics.values());
  }

  /**
   * Get cards filtered by topic name.
   */
  getCardsByTopic(topicName) {
    if (!this._topics) return [];
    const topic = this._topics.get(topicName);
    return topic ? topic.cards : [];
  }

  /**
   * Get cards filtered by subtopic name.
   */
  getCardsBySubtopic(subtopicName) {
    if (!this._subtopics) return [];
    const subtopic = this._subtopics.get(subtopicName);
    return subtopic ? subtopic.cards : [];
  }

  /**
   * Get a single card by ID.
   */
  getCardById(id) {
    if (!this._cards) return null;
    return this._cards.find((c) => c.id === id) || null;
  }

  /**
   * Get topic metadata by name.
   */
  getTopic(topicName) {
    if (!this._topics) return null;
    return this._topics.get(topicName) || null;
  }
}

// Export singleton
export default new DataLoader();
