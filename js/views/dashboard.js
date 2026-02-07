// ============================================================
// dashboard.js — Home/Dashboard view
// ============================================================

import DataLoader from '../data/dataLoader.js';
import StorageManager from '../data/storageManager.js';
import ProgressBar from '../components/progressBar.js';

const DashboardView = (() => {
  function render(container) {
    const allCards = DataLoader.getAllCards();
    const topics = DataLoader.getTopics();
    const stats = StorageManager.getStatistics(allCards);
    const overallProgress = StorageManager.getProgress(allCards);

    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">${allCards.length} Karten · ${stats.reviewedCards} bearbeitet · ${stats.totalReviews} Wiederholungen</p>
        </div>

        <!-- Overall Progress -->
        <div class="card mb-6">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-semibold">Gesamtfortschritt</span>
            <span class="text-xs text-tertiary">${overallProgress}%</span>
          </div>
          ${ProgressBar.createMulti(
      {
        knew: stats.knewCards,
        partial: stats.partialCards,
        forgot: stats.forgotCards,
      },
      allCards.length,
      'progress-bar-lg',
    )}
          <div class="grid-2 grid-4-md gap-4 mt-4">
            <div class="flex items-center gap-2">
              <span class="legend-dot" style="background:var(--success)"></span>
              <span class="text-xs text-secondary">Gewusst ${stats.knewCards}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="legend-dot" style="background:var(--warning)"></span>
              <span class="text-xs text-secondary">Unsicher ${stats.partialCards}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="legend-dot" style="background:var(--danger)"></span>
              <span class="text-xs text-secondary">Nicht gewusst ${stats.forgotCards}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="legend-dot" style="background:var(--bg-tertiary)"></span>
              <span class="text-xs text-secondary">Offen ${stats.newCards}</span>
            </div>
          </div>
        </div>

        <!-- Review CTA -->
        <a href="#/review" class="review-cta mb-6">
          <div>
            <span class="font-semibold">Alle Karten lernen</span>
            <span class="text-xs text-secondary" style="display:block; margin-top:2px;">${allCards.length} Karten</span>
          </div>
          <span class="review-cta-arrow">&rarr;</span>
        </a>
      </div>
    `;
  }

  function renderTopicCard(topic, stats) {
    const progress = StorageManager.getProgress(topic.cards);
    const topicStat = stats.topicStats[topic.name] || {
      knew: 0,
      partial: 0,
      forgot: 0,
    };
    const topicParam = encodeURIComponent(topic.name);
    const topicNum = topic.name.match(/^(\d+)/)?.[1] || '?';

    return `
      <a href="#/learn/${topicParam}" class="topic-card">
        <div class="topic-card-num">${topicNum}</div>
        <div class="topic-card-name">${topic.name.replace(/^\d+\.\s*/, '')}</div>
        <div class="topic-card-count">${topic.cardCount} Karten</div>
        <div class="topic-card-progress">
          ${ProgressBar.createMulti(
      {
        knew: topicStat.knew,
        partial: topicStat.partial,
        forgot: topicStat.forgot,
      },
      topic.cardCount,
      'progress-bar-sm',
    )}
        </div>
        <div class="topic-card-footer">
          <span class="topic-card-percentage">${progress}%</span>
        </div>
      </a>
    `;
  }

  return { render };
})();

export default DashboardView;
