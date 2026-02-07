// ============================================================
// statsChart.js — Simple chart/visualization component
// ============================================================

const StatsChart = (() => {
  /**
   * Render a donut/ring chart using SVG.
   *
   * @param {Array} segments — [{ value, color, label }]
   * @param {number} total
   * @param {string} centerText
   * @param {string} centerLabel
   * @returns {string}
   */
  function donutChart(segments, total, centerText, centerLabel = 'Gesamt') {
    const size = 200;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    const paths = segments
      .map((seg) => {
        const pct = total > 0 ? seg.value / total : 0;
        const dashLength = circumference * pct;
        // Ensure small segments are visible
        const renderLength = dashLength > 0 && dashLength < 1 ? 1 : dashLength;

        const path = `
        <circle
          cx="${size / 2}" cy="${size / 2}" r="${radius}"
          fill="none"
          stroke="${seg.color}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${renderLength} ${circumference - renderLength}"
          stroke-dashoffset="${-offset * circumference}"
          stroke-linecap="butt"
        />
      `;
        offset += pct;
        return path;
      })
      .join('');

    return `
      <div class="donut-chart">
        <svg viewBox="0 0 ${size} ${size}">
          <circle
            cx="${size / 2}" cy="${size / 2}" r="${radius}"
            fill="none"
            stroke="var(--bg-tertiary)"
            stroke-width="${strokeWidth}"
            opacity="0.3"
          />
          ${paths}
        </svg>
        <div class="donut-center">
          <div class="donut-center-val">${centerText}</div>
          <div class="donut-chart-label" style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;">${centerLabel}</div>
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

    const maxVal = Math.max(...days.map((d) => d.value), 5); // Min maxVal 5 for scale

    return `
      <div class="activity-chart-container">
        ${days
          .map((day) => {
            const height = Math.max(5, (day.value / maxVal) * 100);
            return `
              <div class="activity-col">
                <div class="activity-bar-track">
                  <span class="activity-value" style="bottom: ${height}%">${day.value}</span>
                  <div class="activity-bar ${day.isToday ? 'today' : ''}"
                       style="height: ${height}%"
                       title="${day.value} Karten">
                  </div>
                </div>
                <span class="activity-label ${day.isToday ? 'today' : ''}">${day.label}</span>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  return {
    donutChart,
    activityChart,
  };
})();

export default StatsChart;
