// ============================================================
// dashboard.js — Home/Dashboard view with integrated statistics
// ============================================================

import DataLoader from '../data/dataLoader.js';
import StorageManager from '../data/storageManager.js';
import ProgressBar from '../components/progressBar.js';
import StatsChart from '../components/statsChart.js';

const DashboardView = (() => {
  function render(container) {
    const allCards = DataLoader.getAllCards();
    const topics = DataLoader.getTopics();
    const stats = StorageManager.getStatistics(allCards);
    const overallProgress = StorageManager.getProgress(allCards);

    container.innerHTML = `
      <div class="view-enter">
        <!-- Header -->
        <div class="page-header">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Übersicht über deinen Lernfortschritt</p>
        </div>

        <!-- Quick Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-value">${allCards.length}</div>
            <div class="stat-card-label">Karten</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-value">${stats.reviewedCards}</div>
            <div class="stat-card-label">Bearbeitet</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-value">${stats.totalReviews}</div>
            <div class="stat-card-label">Wiederholungen</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-value">${overallProgress}%</div>
            <div class="stat-card-label">Fortschritt</div>
          </div>
        </div>

        <!-- Distribution Chart -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3 class="card-title">Karten-Verteilung</h3>
          </div>
          <div class="donut-layout">
            <div class="donut-wrapper">
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
                `${stats.knewCards}`,
                'Gewusst',
              )}
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-dot" style="background: var(--success);"></div>
                <div class="legend-info">
                  <span class="legend-val">${stats.knewCards}</span>
                  <span class="legend-label">Gewusst</span>
                </div>
              </div>
              <div class="legend-item">
                <div class="legend-dot" style="background: var(--warning);"></div>
                <div class="legend-info">
                  <span class="legend-val">${stats.partialCards}</span>
                  <span class="legend-label">Unsicher</span>
                </div>
              </div>
              <div class="legend-item">
                <div class="legend-dot" style="background: var(--danger);"></div>
                <div class="legend-info">
                  <span class="legend-val">${stats.forgotCards}</span>
                  <span class="legend-label">Nicht gewusst</span>
                </div>
              </div>
              <div class="legend-item">
                <div class="legend-dot" style="background: var(--bg-tertiary);"></div>
                <div class="legend-info">
                  <span class="legend-val">${stats.newCards}</span>
                  <span class="legend-label">Offen</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Activity Chart -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3 class="card-title">Aktivität</h3>
            <span class="text-xs text-secondary font-medium">Letzte 7 Tage</span>
          </div>
          ${StatsChart.activityChart(stats.dailyReviews)}
        </div>

        <!-- Topics Progress -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3 class="card-title">Fortschritt nach Thema</h3>
          </div>
          <div class="topic-progress-list">
            ${topics.map((topic) => renderTopicProgress(topic, stats)).join('')}
          </div>
        </div>

        <!-- Reset Section -->
        <div class="reset-section">
          <div class="reset-content">
            <h3 class="reset-title">Fortschritt zurücksetzen</h3>
            <p class="reset-text">Setze alle Lernfortschritte zurück. Diese Aktion kann nicht rückgängig gemacht werden.</p>
          </div>
          <button class="btn btn-danger btn-sm" id="resetBtn">Zurücksetzen</button>
        </div>
      </div>
    `;

    // Bind reset button
    container.querySelector('#resetBtn').addEventListener('click', () => {
      if (confirm('Bist du sicher? Alle Lernfortschritte werden gelöscht.')) {
        StorageManager.resetProgress();
        render(container);
      }
    });
  }

  function renderTopicProgress(topic, stats) {
    const topicStat = stats.topicStats[topic.name] || {
      knew: 0,
      partial: 0,
      forgot: 0,
    };
    const progress = StorageManager.getProgress(topic.cards);
    const topicParam = encodeURIComponent(topic.name);
    const topicNum = topic.name.match(/^(\d+)/)?.[1] || '?';

    return `
      <a href="#/learn/${topicParam}" class="topic-progress-item">
        <div class="topic-progress-header">
          <div class="topic-progress-info">
            <span class="topic-progress-num">${topicNum}</span>
            <span class="topic-progress-name">${topic.name.replace(/^\d+\.\s*/, '')}</span>
          </div>
          <span class="topic-progress-pct">${progress}%</span>
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
      </a>
    `;
  }

  return {render};
})();

export default DashboardView;
