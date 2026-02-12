/* ============================================================
   sidebar.js — Modern Sidebar Logic
   ============================================================ */

import Router from '../core/Router.js';
import DataLoader from '../services/DataLoader.js';
import { themeManager } from '../services/ThemeManager.js';

const Sidebar = (() => {
  let sidebarEl = null;
  let overlayEl = null;

  const MENU_STRUCTURE = [
    {
      type: 'group',
      label: 'Hauptmenü',
      items: [
        { label: 'Dashboard', icon: 'layout-grid', route: '/' },
        { label: 'Flashcards', icon: 'layers', route: '/flashcards' },
        { label: 'Quiz', icon: 'help-circle', route: '/quiz' },
        { label: 'Wiki', icon: 'library', route: '/wiki' },
      ],
    },
    {
      type: 'group',
      label: 'Lernmodule',
      collapsible: true,
      items: [
        { label: 'Nutzwertanalyse', icon: 'box', route: '/modules/nwa' },
        { label: 'Gantt-Diagramm', icon: 'box', route: '/modules/gantt' },
        { label: 'Subnetting', icon: 'box', route: '/modules/subnetting' },
        { label: 'E-Mail Protokolle', icon: 'box', route: '/modules/mail' },
        {
          label: 'Zahlensysteme',
          icon: 'box',
          route: '/modules/numbersystems',
        },
        {
          label: 'Elektrotechnik',
          icon: 'box',
          route: '/modules/electrical',
        },
        {
          label: '4-Ohren-Modell',
          icon: 'box',
          route: '/modules/communication',
        },
        { label: 'OSI-Modell', icon: 'box', route: '/modules/osi' },
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

    if (window.lucide) {
      window.lucide.createIcons();
    }
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
          ${group.collapsible ? `<span class="sidebar-group-chevron"><i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i></span>` : ''}
        </div>`
        : '';

      const itemsHtml = group.items
        .map(
          (item) => `
        <a href="#${item.route}" class="nav-item" data-route="${item.route}">
          <span class="nav-item-icon"><i data-lucide="${item.icon}" style="width: 18px; height: 18px;"></i></span>
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
        <i data-lucide="menu" style="width: 20px; height: 20px;"></i>
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
