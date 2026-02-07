// ============================================================
// statistics.js — Statistics view
// ============================================================

import DataLoader from '../data/dataLoader.js';
import StorageManager from '../data/storageManager.js';
import ProgressBar from '../components/progressBar.js';
import StatsChart from '../components/statsChart.js';

const StatisticsView = (() => {
  function render(container) {
    const allCards = DataLoader.getAllCards();
    const topics = DataLoader.getTopics();
    const stats = StorageManager.getStatistics(allCards);
    const overallProgress = StorageManager.getProgress(allCards);

    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <h1 class="page-title">Statistiken</h1>
          <p class="page-subtitle">Lernfortschritt im Überblick</p>
        </div>

        <!-- Quick Stats -->
        <div class="grid-4 mb-8">
          <div class="stat-card">
            <div class="stat-card-content">
              <span class="stat-card-value">${stats.totalReviews}</span>
              <span class="stat-card-label">Wiederholungen</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-content">
              <span class="stat-card-value">${overallProgress}%</span>
              <span class="stat-card-label">Fortschritt</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-content">
              <span class="stat-card-value">${stats.todayReviews}</span>
              <span class="stat-card-label">Heute gelernt</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-content">
              <span class="stat-card-value">${stats.knewCards}</span>
              <span class="stat-card-label">Gewusst</span>
            </div>
          </div>
        </div>

        <div class="grid-2 mb-8">
          <!-- Card Status Distribution -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Kartenstatus</h3>
            </div>
            <div class="card-body">
              ${StatsChart.donutChart(
                [
                  {
                    value: stats.knewCards,
                    color: 'var(--success)',
                    label: 'Gewusst',
                  },
                  {
                    value: stats.partialCards,
                    color: 'var(--warning)',
                    label: 'Unsicher',
                  },
                  {
                    value: stats.forgotCards,
                    color: 'var(--danger)',
                    label: 'Nicht gewusst',
                  },
                  {
                    value: stats.newCards,
                    color: 'var(--bg-tertiary)',
                    label: 'Neu',
                  },
                ],
                allCards.length,
                `${overallProgress}%`,
              )}
            </div>
          </div>

          <!-- Activity -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Letzte 7 Tage</h3>
              <span class="text-xs text-secondary">${stats.weekReviews} Wiederholungen</span>
            </div>
            <div class="card-body">
              ${StatsChart.activityChart(stats.dailyReviews)}
            </div>
          </div>
        </div>

        <!-- Per-Topic -->
        <div class="card mb-8">
          <div class="card-header">
            <h3 class="card-title">Fortschritt nach Thema</h3>
          </div>
          <div class="card-body">
            ${topics.map((topic) => renderTopicStat(topic, stats)).join('')}
          </div>
        </div>

        <!-- Reset -->
        <div class="card" style="border-color: var(--border-light);">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="card-title" style="font-size: var(--font-size-sm);">Fortschritt zurücksetzen</h3>
              <p class="text-xs text-tertiary mt-2">Alle Lernfortschritte werden unwiderruflich gelöscht.</p>
            </div>
            <button class="btn btn-ghost btn-sm" id="resetBtn" style="color: var(--danger); border-color: var(--danger);">Zurücksetzen</button>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#resetBtn').addEventListener('click', () => {
      if (
        confirm(
          'Bist du sicher? Alle Lernfortschritte werden unwiderruflich gelöscht.',
        )
      ) {
        StorageManager.resetProgress();
        render(container);
      }
    });
  }

  function renderTopicStat(topic, stats) {
    const topicStat = stats.topicStats[topic.name] || {
      total: 0,
      knew: 0,
      partial: 0,
      forgot: 0,
      new: 0,
    };
    const progress = StorageManager.getProgress(topic.cards);
    const topicNum = topic.name.match(/^(\d+)/)?.[1] || '?';

    return `
      <div style="padding: var(--space-3) 0; border-bottom: 1px solid var(--border-color);">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-3">
            <span class="topic-num-sm">${topicNum}</span>
            <span class="text-sm font-medium">${topic.name.replace(/^\d+\.\s*/, '')}</span>
          </div>
          <span class="text-xs font-semibold text-secondary">${progress}%</span>
        </div>
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
    `;
  }

  return {render};
})();

export default StatisticsView;
