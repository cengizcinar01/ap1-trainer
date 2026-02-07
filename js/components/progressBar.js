// ============================================================
// progressBar.js — Reusable progress bar component
// ============================================================

const ProgressBar = (() => {
  /**
   * Create a simple single-color progress bar.
   */
  function create(percentage, colorClass = 'accent', sizeClass = '') {
    const clamped = Math.max(0, Math.min(100, percentage));
    return `
      <div class="progress-bar ${sizeClass}">
        <div class="progress-bar-fill ${colorClass}" style="width: ${clamped}%"></div>
      </div>
    `;
  }

  /**
   * Create a multi-segment progress bar.
   * Segments: { knew, partial, forgot }
   */
  function createMulti(segments, total, sizeClass = '') {
    if (total === 0) return create(0, 'accent', sizeClass);

    const knewPct = ((segments.knew || 0) / total) * 100;
    const partialPct = ((segments.partial || 0) / total) * 100;
    const forgotPct = ((segments.forgot || 0) / total) * 100;

    return `
      <div class="progress-bar progress-bar-multi ${sizeClass}">
        ${knewPct > 0 ? `<div class="progress-segment knew" style="width: ${knewPct}%"></div>` : ''}
        ${partialPct > 0 ? `<div class="progress-segment partial" style="width: ${partialPct}%"></div>` : ''}
        ${forgotPct > 0 ? `<div class="progress-segment forgot" style="width: ${forgotPct}%"></div>` : ''}
      </div>
    `;
  }

  /**
   * Create a labeled progress bar with percentage text.
   */
  function createLabeled(percentage, label, colorClass = 'accent') {
    return `
      <div>
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium">${label}</span>
          <span class="text-sm text-secondary">${Math.round(percentage)}%</span>
        </div>
        ${create(percentage, colorClass)}
      </div>
    `;
  }

  return {
    create,
    createMulti,
    createLabeled,
  };
})();

export default ProgressBar;
