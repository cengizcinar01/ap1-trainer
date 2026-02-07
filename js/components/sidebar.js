// ============================================================
// sidebar.js — Sidebar navigation component (minimalist)
// ============================================================

import DataLoader from '../data/dataLoader.js';
import StorageManager from '../data/storageManager.js';
import Router from '../router.js';
import ThemeManager from './themeManager.js';

const Sidebar = (() => {
  const ICONS = {
    dashboard: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    categories: `<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    review: `<svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
    menu: `<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  };

  let sidebarEl = null;
  let overlayEl = null;
  const themeManager = new ThemeManager();

  function render() {
    DataLoader.getAllCards(); // Ensure data is loaded

    // Mobile header
    const mobileHeader = document.querySelector('.mobile-header');
    if (!mobileHeader) {
      const header = document.createElement('div');
      header.className = 'mobile-header';
      header.innerHTML = `
        <button class="mobile-menu-btn" id="mobileMenuBtn">
          <span class="nav-item-icon">${ICONS.menu}</span>
        </button>

      `;
      document.body.prepend(header);
      header
        .querySelector('#mobileMenuBtn')
        .addEventListener('click', toggleMobile);

      const headerThemeBtn = header.querySelector('#headerThemeBtn');
      if (headerThemeBtn) {
        themeManager.registerButton(headerThemeBtn);
      }
    }

    // Overlay
    if (!overlayEl) {
      overlayEl = document.createElement('div');
      overlayEl.className = 'sidebar-overlay';
      overlayEl.addEventListener('click', closeMobile);
      document.body.prepend(overlayEl);
    }

    // Sidebar
    if (!sidebarEl) {
      sidebarEl = document.createElement('aside');
      sidebarEl.className = 'sidebar';
      document.querySelector('.app').prepend(sidebarEl);
    }

    const currentRoute = Router.getCurrentRoute();

    sidebarEl.innerHTML = `
      <div class="sidebar-header" style="display: flex; align-items: center; justify-content: space-between;">
        <div class="sidebar-logo">
          <div class="sidebar-logo-text">
            <span class="sidebar-logo-title">AP1 Trainer</span>
            <span class="sidebar-logo-subtitle">Prüfungsvorbereitung</span>
          </div>
        </div>
        <button class="mobile-menu-btn" id="desktopThemeBtn" style="width: 32px; height: 32px;">
           <span class="icon"></span>
        </button>
      </div>
      <nav class="sidebar-nav">
        <a href="#/" class="nav-item ${currentRoute === '/' ? 'active' : ''}" data-route="/">
          <span class="nav-item-icon">${ICONS.dashboard}</span>
          Dashboard
        </a>
        <a href="#/categories" class="nav-item ${currentRoute === '/categories' ? 'active' : ''}" data-route="/categories">
          <span class="nav-item-icon">${ICONS.categories}</span>
          Themen
        </a>
        <a href="#/review" class="nav-item ${currentRoute.startsWith('/review') ? 'active' : ''}" data-route="/review">
          <span class="nav-item-icon">${ICONS.review}</span>
          Alle Karten
        </a>
      </nav>
`;

    sidebarEl.querySelectorAll('.nav-item').forEach((link) => {
      if (link.tagName === 'A') {
        link.addEventListener('click', () => closeMobile());
      }
    });

    // Initialize Theme Manager
    const headerThemeBtn = sidebarEl.querySelector('#desktopThemeBtn');
    if (headerThemeBtn) {
      themeManager.init(); // Init theme state on load
      themeManager.registerButton(headerThemeBtn);
    }
  }

  function toggleMobile() {
    if (sidebarEl) {
      sidebarEl.classList.toggle('open');
      overlayEl.classList.toggle('visible');
    }
  }

  function closeMobile() {
    if (sidebarEl) {
      sidebarEl.classList.remove('open');
      overlayEl.classList.remove('visible');
    }
  }

  function updateActive() {
    if (!sidebarEl) return;
    const currentRoute = Router.getCurrentRoute();

    sidebarEl.querySelectorAll('.nav-item').forEach((link) => {
      const route = link.dataset.route;
      if (route === '/' && currentRoute === '/') {
        link.classList.add('active');
      } else if (route !== '/' && currentRoute.startsWith(route)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update review stats in sidebar footer
    const allCards = DataLoader.getAllCards();
    const stats = StorageManager.getStatistics(allCards);
    const streakCount = sidebarEl.querySelector('.sidebar-streak-count');
    const streakLabel = sidebarEl.querySelector('.sidebar-streak-label');
    if (streakCount)
      streakCount.textContent = `${stats.totalReviews} Wiederholungen`;
    if (streakLabel) streakLabel.textContent = `${stats.todayReviews} heute`;
  }

  return {render, updateActive, closeMobile};
})();

export default Sidebar;
