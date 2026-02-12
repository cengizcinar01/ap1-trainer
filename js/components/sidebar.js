/* ============================================================
   sidebar.js — Modern Sidebar Logic (IconManager Update)
   ============================================================ */

import Router from '../core/Router.js';
import DataLoader from '../services/DataLoader.js';
import IconManager from '../services/IconManager.js';
import { themeManager } from '../services/ThemeManager.js';

const Sidebar = (() => {
  let sidebarEl = null;
  let overlayEl = null;

  const MENU_STRUCTURE = [
    {
      type: 'group',
      label: 'Hauptmenü',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/' },
        { label: 'Flashcards', icon: 'flashcards', route: '/flashcards' },
        { label: 'Quiz', icon: 'quiz', route: '/quiz' },
        { label: 'Wiki', icon: 'wiki', route: '/wiki' },
      ],
    },
    {
      type: 'group',
      label: 'Lernmodule',
      collapsible: true,
      items: [
        { label: 'Nutzwertanalyse', icon: 'module', route: '/modules/nwa' },
        { label: 'Gantt-Diagramm', icon: 'module', route: '/modules/gantt' },
        { label: 'Subnetting', icon: 'module', route: '/modules/subnetting' },
        { label: 'E-Mail Protokolle', icon: 'module', route: '/modules/mail' },
        {
          label: 'Zahlensysteme',
          icon: 'module',
          route: '/modules/numbersystems',
        },
        {
          label: 'Elektrotechnik',
          icon: 'module',
          route: '/modules/electrical',
        },
        {
          label: '4-Ohren-Modell',
          icon: 'module',
          route: '/modules/communication',
        },
        { label: 'OSI-Modell', icon: 'module', route: '/modules/osi' },
      ],
    },
  ];

  function render() {
    DataLoader.getAllCards();

    createMobileHeader();
    createOverlay();

    if (!sidebarEl) {
      sidebarEl = document.createElement('aside');
      sidebarEl.className = 'sidebar';
      document.querySelector('.app').prepend(sidebarEl);
    }

    renderContent();
    setupEventListeners();
    updateActive();
  }

  function renderContent() {
    sidebarEl.innerHTML = `
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon">AP1</div>
          <div class="sidebar-logo-text">
            <span class="sidebar-logo-title">Trainer</span>
            <span class="sidebar-logo-subtitle">Prüfungsvorbereitung</span>
          </div>
        </div>
        <button class="theme-minimal-btn" id="themeToggleBtn" title="Design wechseln">
          <span class="icon"></span>
        </button>
      </div>

      <nav class="sidebar-nav-scroll">
        ${renderGroups()}
      </nav>
    `;
  }

  function renderGroups() {
    return MENU_STRUCTURE.map((group) => {
      const headerHtml = group.label
        ? `
        <div class="sidebar-group-header ${group.collapsible ? 'collapsible' : ''}">
          <span>${group.label}</span>
          ${group.collapsible ? `<span class="sidebar-group-chevron">${IconManager.get('chevronRight', 16)}</span>` : ''}
        </div>`
        : '';

      const itemsHtml = group.items
        .map(
          (item) => `
        <a href="#${item.route}" class="nav-item" data-route="${item.route}">
          <span class="nav-item-icon">${IconManager.get(item.icon, 18)}</span>
          <span class="nav-item-text">${item.label}</span>
        </a>
      `
        )
        .join('');

      return `
        <div class="sidebar-group">
          ${headerHtml}
          <div class="sidebar-group-content">
            ${itemsHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  function createMobileHeader() {
    if (document.querySelector('.mobile-header')) return;
    const header = document.createElement('div');
    header.className = 'mobile-header';
    header.innerHTML = `
      <span class="mobile-logo">AP1 Trainer</span>
      <button class="mobile-menu-btn" id="mobileMenuBtn">
        ${IconManager.get('menu', 20)}
      </button>
    `;
    document.body.prepend(header);
    header
      .querySelector('#mobileMenuBtn')
      .addEventListener('click', toggleMobile);
  }

  function createOverlay() {
    if (overlayEl) return;
    overlayEl = document.createElement('div');
    overlayEl.className = 'sidebar-overlay';
    overlayEl.addEventListener('click', closeMobile);
    document.body.prepend(overlayEl);
  }

  function setupEventListeners() {
    const themeBtn = sidebarEl.querySelector('#themeToggleBtn');
    if (themeBtn) {
      themeManager.registerButton(themeBtn);
    }

    sidebarEl
      .querySelectorAll('.sidebar-group-header.collapsible')
      .forEach((header) => {
        header.addEventListener('click', () => {
          const group = header.parentElement;
          group.classList.toggle('collapsed');
        });
      });

    sidebarEl.querySelectorAll('.nav-item').forEach((link) => {
      link.addEventListener('click', closeMobile);
    });
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
      const isActive =
        route === '/'
          ? currentRoute === '/'
          : currentRoute.startsWith(route) && route !== '/';

      if (isActive) {
        link.classList.add('active');
        const group = link.closest('.sidebar-group');
        if (group) group.classList.remove('collapsed');
      } else {
        link.classList.remove('active');
      }
    });
  }

  return { render, updateActive, closeMobile };
})();

export default Sidebar;
