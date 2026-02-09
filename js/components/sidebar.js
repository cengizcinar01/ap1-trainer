// ============================================================
// sidebar.js — Sidebar navigation component (minimalist)
// ============================================================

import DataLoader from '../data/dataLoader.js';
import StorageManager from '../data/storageManager.js';
import Router from '../router.js';
import ThemeManager from './themeManager.js';

const Sidebar = (() => {
  const ICONS = {
    // Dashboard: 4 Quadrate (Grid)
    dashboard: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
    // Themen: Ordner
    categories: `<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    // Alle Karten: Karten-Stapel mit Refresh
    review: `<svg viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M18 10h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><path d="M6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></svg>`,
    // Subnetting: Netzwerk-Baum (IP → Subnetze)
    subnetting: `<svg viewBox="0 0 24 24"><rect x="8" y="2" width="8" height="5" rx="1.5"/><rect x="2" y="17" width="6" height="5" rx="1.5"/><rect x="9" y="17" width="6" height="5" rx="1.5"/><rect x="16" y="17" width="6" height="5" rx="1.5"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="5" y1="17" x2="5" y2="14"/><line x1="12" y1="17" x2="12" y2="14"/><line x1="19" y1="17" x2="19" y2="14"/><line x1="5" y1="14" x2="19" y2="14"/><line x1="12" y1="11" x2="12" y2="14"/></svg>`,
    // OSI-Modell: 7 horizontale Schichten (gestaffelt)
    osimodel: `<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="2.5" rx="0.5"/><rect x="5" y="5.5" width="14" height="2.5" rx="0.5"/><rect x="6" y="9" width="12" height="2.5" rx="0.5"/><rect x="5" y="12.5" width="14" height="2.5" rx="0.5"/><rect x="4" y="16" width="16" height="2.5" rx="0.5"/><rect x="3" y="19.5" width="18" height="2.5" rx="0.5"/></svg>`,
    // Netzplantechnik: Workflow-Knoten mit Pfeilen
    networkplan: `<svg viewBox="0 0 24 24"><rect x="1" y="8" width="6" height="5" rx="1"/><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="9" y="13" width="6" height="5" rx="1"/><rect x="17" y="8" width="6" height="5" rx="1"/><line x1="7" y1="9" x2="9" y2="6.5"/><line x1="7" y1="12" x2="9" y2="14.5"/><line x1="15" y1="6.5" x2="17" y2="9"/><line x1="15" y1="14.5" x2="17" y2="12"/></svg>`,
    // NWA: Waage/Vergleich mit Checkmark
    nwa: `<svg viewBox="0 0 24 24"><rect x="3" y="13" width="5" height="8" rx="1"/><rect x="9.5" y="8" width="5" height="13" rx="1"/><rect x="16" y="3" width="5" height="18" rx="1"/><polyline points="5 11 10.5 6 18 3" fill="none" stroke-width="2" stroke-linecap="round"/><circle cx="18" cy="3" r="1.5"/></svg>`,
    // Zahlensysteme: Binär-Code Darstellung (Kreise und Striche)
    numbersystems: `<svg viewBox="0 0 24 24"><circle cx="5" cy="6" r="2"/><rect x="10" y="4" width="4" height="4" rx="0.5"/><circle cx="19" cy="6" r="2"/><rect x="3" y="10" width="4" height="4" rx="0.5"/><circle cx="12" cy="12" r="2"/><rect x="17" y="10" width="4" height="4" rx="0.5"/><circle cx="5" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><rect x="17" y="16" width="4" height="4" rx="0.5"/></svg>`,
    // EPK: Hexagon (Ereignis) + abgerundetes Rechteck (Funktion)
    epk: `<svg viewBox="0 0 24 24"><polygon points="12,1 18,4.5 18,11.5 12,15 6,11.5 6,4.5" fill="none" stroke-width="1.5"/><rect x="7" y="17" width="10" height="5" rx="2.5" fill="none" stroke-width="1.5"/><line x1="12" y1="15" x2="12" y2="17" stroke-width="1.5"/></svg>`,
    // UML: Klassendiagramm (3-Sektionen-Box) + Verbindung
    uml: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><rect x="2" y="2" width="12" height="14" rx="1.5"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="2" y1="11" x2="14" y2="11"/><rect x="14" y="8" width="8" height="14" rx="1.5"/><line x1="14" y1="13" x2="22" y2="13"/><line x1="14" y1="17" x2="22" y2="17"/><line x1="14" y1="12" x2="14" y2="8"/></svg>`,
    // Wiki: Offenes Buch
    wiki: `<svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    // Menü: Hamburger
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
        <a href="#/modules/networkplan" class="nav-item ${currentRoute.startsWith('/modules/networkplan') ? 'active' : ''}" data-route="/modules/networkplan">
          <span class="nav-item-icon">${ICONS.networkplan}</span>
          Netzplantechnik
        </a>
        <a href="#/modules/subnetting" class="nav-item ${currentRoute.startsWith('/modules/subnetting') ? 'active' : ''}" data-route="/modules/subnetting">
          <span class="nav-item-icon">${ICONS.subnetting}</span>
          Subnetting
        </a>
        <a href="#/modules/uml" class="nav-item ${currentRoute.startsWith('/modules/uml') ? 'active' : ''}" data-route="/modules/uml">
          <span class="nav-item-icon">${ICONS.uml}</span>
          UML-Werkstatt
        </a>
        <a href="#/modules/numbersystems" class="nav-item ${currentRoute.startsWith('/modules/numbersystems') ? 'active' : ''}" data-route="/modules/numbersystems">
          <span class="nav-item-icon">${ICONS.numbersystems}</span>
          Zahlensysteme
        </a>
        <a href="#/modules/epk" class="nav-item ${currentRoute.startsWith('/modules/epk') ? 'active' : ''}" data-route="/modules/epk">
          <span class="nav-item-icon">${ICONS.epk}</span>
          EPK-Builder
        </a>
        <a href="#/modules/osimodel" class="nav-item ${currentRoute.startsWith('/modules/osimodel') ? 'active' : ''}" data-route="/modules/osimodel">
          <span class="nav-item-icon">${ICONS.osimodel}</span>
          OSI-Modell
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
