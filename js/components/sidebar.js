// ============================================================
// sidebar.js — Sidebar navigation component (minimalist)
// ============================================================

import DataLoader from '../data/dataLoader.js';
import StorageManager from '../data/storageManager.js';
import Router from '../router.js';
import ThemeManager from './themeManager.js';

const Sidebar = (() => {
  // Simple unified bullet icon for all navigation items
  const DOT_ICON = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`;

  const ICONS = {
    dashboard: DOT_ICON,
    categories: DOT_ICON,
    review: DOT_ICON,
    subnetting: DOT_ICON,
    osimodel: DOT_ICON,
    networkplan: DOT_ICON,
    nwa: DOT_ICON,
    numbersystems: DOT_ICON,
    epk: DOT_ICON,
    gantt: DOT_ICON,
    wiki: DOT_ICON,
    communication: DOT_ICON,
    menu: `<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    pseudocode: DOT_ICON,
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
        <div class="sidebar-section-label">Nachschlagewerk</div>
        <a href="#/wiki" class="nav-item ${currentRoute.startsWith('/wiki') ? 'active' : ''}" data-route="/wiki">
          <span class="nav-item-icon">${ICONS.wiki}</span>
          Wiki
        </a>
        <div class="sidebar-section-label">Module</div>
        <a href="#/modules/nwa" class="nav-item ${currentRoute.startsWith('/modules/nwa') ? 'active' : ''}" data-route="/modules/nwa">
          <span class="nav-item-icon">${ICONS.nwa}</span>
          Nutzwertanalyse
        </a>
        <a href="#/modules/gantt" class="nav-item ${currentRoute.startsWith('/modules/gantt') ? 'active' : ''}" data-route="/modules/gantt">
          <span class="nav-item-icon">${ICONS.gantt}</span>
          Gantt-Diagramm
        </a>
        <a href="#/modules/networkplan" class="nav-item ${currentRoute.startsWith('/modules/networkplan') ? 'active' : ''}" data-route="/modules/networkplan">
          <span class="nav-item-icon">${ICONS.networkplan}</span>
          Netzplantechnik
        </a>
        <a href="#/modules/subnetting" class="nav-item ${currentRoute.startsWith('/modules/subnetting') ? 'active' : ''}" data-route="/modules/subnetting">
          <span class="nav-item-icon">${ICONS.subnetting}</span>
          Subnetting
        </a>
        <a href="#/modules/osimodel" class="nav-item ${currentRoute.startsWith('/modules/osimodel') ? 'active' : ''}" data-route="/modules/osimodel">
          <span class="nav-item-icon">${ICONS.osimodel}</span>
          OSI-Modell
        </a>
        <a href="#/modules/communication" class="nav-item ${currentRoute.startsWith('/modules/communication') ? 'active' : ''}" data-route="/modules/communication">
          <span class="nav-item-icon">${ICONS.communication}</span>
          4-Ohren-Modell
        </a>
        <a href="#/modules/numbersystems" class="nav-item ${currentRoute.startsWith('/modules/numbersystems') ? 'active' : ''}" data-route="/modules/numbersystems">
          <span class="nav-item-icon">${ICONS.numbersystems}</span>
          Zahlensysteme
        </a>
        <a href="#/modules/pseudocode" class="nav-item ${currentRoute.startsWith('/modules/pseudocode') ? 'active' : ''}" data-route="/modules/pseudocode">
          <span class="nav-item-icon">${ICONS.pseudocode}</span>
          Pseudocode-Trainer
        </a>
        <a href="#/modules/epk" class="nav-item ${currentRoute.startsWith('/modules/epk') ? 'active' : ''}" data-route="/modules/epk">
          <span class="nav-item-icon">${ICONS.epk}</span>
          EPK-Builder
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

  return { render, updateActive, closeMobile };
})();

export default Sidebar;