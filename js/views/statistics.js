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
        <div class="stats-header">
          <h1>Statistiken</h1>
          <p>Dein Lernfortschritt im Detail</p>
        </div>

        <div class="charts-row">
          <!-- Card Status Distribution -->
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Verteilung</h3>
            </div>
            
            <div class="donut-layout">
              <div class="donut-wrapper">
                ${StatsChart.donutChart(
      [
        { value: stats.knewCards, color: 'var(--success)', label: 'Gewusst' },
        { value: stats.partialCards, color: 'var(--warning)', label: 'Unsicher' },
        { value: stats.forgotCards, color: 'var(--danger)', label: 'Nicht gewusst' },
        { value: stats.newCards, color: 'var(--bg-tertiary)', label: 'Neu' },
      ],
      allCards.length,
      `${stats.knewCards}`,
      'Gewusst'
    )}
              </div>

              <!-- Manual Legend for Mobile Stacking -->
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

          <!-- Activity -->
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Aktivität</h3>
              <span class="text-xs text-secondary font-medium">Letzte 7 Tage</span>
            </div>
            ${StatsChart.activityChart(stats.dailyReviews)}
          </div>
        </div>

        <!-- Topic List -->
        <div class="mt-8 mb-6">
          <h3 class="chart-title mb-4">Fortschritt nach Thema</h3>
          <div class="topic-list">
            ${topics.map((topic) => renderTopicStat(topic, stats)).join('')}
          </div>
        </div>

        <!-- Reset Area -->
        <div class="reset-area">
          <div class="reset-text">
            <h3>Fortschritt zurücksetzen</h3>
            <p>Alle Daten werden unwiderruflich gelöscht.</p>
          </div>
          <button class="btn-reset" id="resetBtn">Zurücksetzen</button>
        </div>
      </div>
    `;

    container.querySelector('#resetBtn').addEventListener('click', () => {
      if (confirm('Bist du sicher? Alle Lernfortschritte werden gelöscht.')) {
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

    // Clean topic name (remove numbering 1. etc)
    const topicNameClean = topic.name.replace(/^\d+\.\s*/, '');
    const topicNum = topic.name.match(/^(\d+)/)?.[1] || '#';

    return `
      <div class="topic-item">
        <div class="topic-header">
          <div class="topic-title-group">
            <span class="topic-badge">${topicNum}</span>
            <span class="topic-name">${topicNameClean}</span>
          </div>
          <span class="topic-pct">${progress}%</span>
        </div>
        ${ProgressBar.createMulti(
      {
        knew: topicStat.knew,
        partial: topicStat.partial,
        forgot: topicStat.forgot,
      },
      topic.cardCount,
      'progress-bar-sm'
    )}
      </div>
    `;
  }

  return { render };
})();

export default StatisticsView;
