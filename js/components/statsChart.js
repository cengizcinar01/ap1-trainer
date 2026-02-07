// ============================================================
// statsChart.js — Simple chart/visualization component
// ============================================================

const StatsChart = (() => {
  /**
   * Render a simple horizontal bar chart.
   *
   * @param {Array} data — [{ label, value, maxValue, color }]
   * @returns {string}
   */
  function barChart(data) {
    if (!data || data.length === 0) return '';

    const maxVal = Math.max(...data.map((d) => d.maxValue || d.value), 1);

    return `
      <div class="bar-chart">
        ${data
        .map((item) => {
          const pct = (item.value / maxVal) * 100;
          return `
            <div class="bar-chart-row">
              <span class="bar-chart-label">${item.label}</span>
              <div class="bar-chart-bar-wrapper">
                <div class="bar-chart-bar" style="width: ${pct}%; background: ${item.color || 'var(--accent-primary)'}"></div>
              </div>
              <span class="bar-chart-value">${item.value}</span>
            </div>
          `;
        })
        .join('')}
      </div>
    `;
  }

  /**
   * Render a donut/ring chart using SVG.
   *
   * @param {Array} segments — [{ value, color, label }]
   * @param {number} total
   * @param {string} centerText
   * @returns {string}
   */
  function donutChart(segments, total, centerText) {
    const size = 160;
    const strokeWidth = 18;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    const paths = segments
      .map((seg) => {
        const pct = total > 0 ? seg.value / total : 0;
        const dashLength = circumference * pct;
        const dashOffset = circumference * (1 - pct) + offset * circumference;
        const path = `
        <circle
          cx="${size / 2}" cy="${size / 2}" r="${radius}"
          fill="none"
          stroke="${seg.color}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${dashLength} ${circumference - dashLength}"
          stroke-dashoffset="${-offset * circumference}"
          stroke-linecap="round"
          transform="rotate(-90 ${size / 2} ${size / 2})"
          style="transition: stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease;"
        />
      `;
        offset += pct;
        return path;
      })
      .join('');

    return `
      <div class="donut-chart">
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
          <circle
            cx="${size / 2}" cy="${size / 2}" r="${radius}"
            fill="none"
            stroke="var(--bg-tertiary)"
            stroke-width="${strokeWidth}"
          />
          ${paths}
        </svg>
        <div class="donut-chart-center">
          <div class="donut-chart-value">${centerText}</div>
        </div>
        <div class="donut-chart-legend">
          ${segments
        .map(
          (seg) => `
            <div class="donut-chart-legend-item">
              <span class="donut-chart-legend-dot" style="background: ${seg.color}"></span>
              <span class="donut-chart-legend-label">${seg.label}</span>
              <span class="donut-chart-legend-value">${seg.value}</span>
            </div>
          `,
        )
        .join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render a mini activity chart (last 7 days).
   *
   * @param {Object} dailyReviews — { "2026-02-01": 5, ... }
   * @returns {string}
   */
  function activityChart(dailyReviews) {
    const days = [];
    const dayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push({
        label: dayLabels[d.getDay()],
        value: dailyReviews[key] || 0,
        isToday: i === 0,
      });
    }

    const maxVal = Math.max(...days.map((d) => d.value), 1);

    return `
      <div class="activity-chart">
        <div class="activity-chart-bars">
          ${days
        .map((day) => {
          const height = Math.max(4, (day.value / maxVal) * 100);
          return `
              <div class="activity-chart-col">
                <div class="activity-chart-bar-wrapper">
                  <div class="activity-chart-bar ${day.isToday ? 'today' : ''}"
                       style="height: ${height}%"
                       title="${day.value} Karten">
                  </div>
                </div>
                <span class="activity-chart-label ${day.isToday ? 'today' : ''}">${day.label}</span>
                <span class="activity-chart-count">${day.value}</span>
              </div>
            `;
        })
        .join('')}
        </div>
      </div>
    `;
  }

  return {
    barChart,
    donutChart,
    activityChart,
  };
})();

export default StatsChart;
