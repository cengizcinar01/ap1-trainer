// ============================================================
// app.js — Application initialization and route setup
// ============================================================

import CommunicationView from '../modules/communication.js';
import ElectricalView from '../modules/electrical.js';
import GanttView from '../modules/gantt.js';
import MailProtocolsView from '../modules/mailprotocols.js';
import NumberSystemsView from '../modules/numbersystems.js';
import NWAView from '../modules/nwa.js';
import OSIView from '../modules/osi.js';
import SubnettingView from '../modules/subnetting.js';
import Sidebar from './components/sidebar.js';
import Router from './core/Router.js';
import DataLoader from './services/DataLoader.js';
import StorageManager from './services/StorageManager.js';

import DashboardView from './views/dashboard.js';
import FlashcardView from './views/flashcard.js';
import QuizView from './views/quiz.js';
import WikiView from './views/wiki.js';

const App = (() => {
  let contentEl = null;
  let currentViewInstance = null;
  let legacyCleanup = null;

  async function init() {
    try {
      document.getElementById('app').innerHTML = `
        <div class="loader" style="height:100vh">
          <div class="loader-spinner"></div>
        </div>
      `;

      await DataLoader.loadData();
      StorageManager.init();

      document.getElementById('app').innerHTML = `
        <div class="app">
          <main class="main-content">
            <div class="page-content" id="pageContent">
            </div>
          </main>
        </div>
      `;

      contentEl = document.getElementById('pageContent');

      Sidebar.render();
      setupRoutes();
      Router.start();
    } catch (error) {
      console.error('App initialization failed:', error);
      document.getElementById('app').innerHTML = `
        <div class="empty-state" style="height:100vh">
          <div class="empty-state-icon">⚠️</div>
          <h2 class="empty-state-title">Fehler beim Laden</h2>
          <p class="empty-state-text">Die Anwendung konnte nicht geladen werden. Bitte lade die Seite neu.</p>
          <button class="btn btn-primary" onclick="location.reload()">Seite neu laden</button>
        </div>
      `;
    }
  }

  function setupRoutes() {
    Router.on('/', () => switchView(DashboardView));

    Router.on('/flashcards', () => switchViewLegacy(FlashcardView));
    Router.on('/flashcards/all', () =>
      switchViewLegacy(FlashcardView, { all: true })
    );
    Router.on('/flashcards/:topic', (params) =>
      switchViewLegacy(FlashcardView, params)
    );
    Router.on('/flashcards/:topic/:subtopic', (params) =>
      switchViewLegacy(FlashcardView, params)
    );

    Router.on('/modules/subnetting', () => switchViewLegacy(SubnettingView));
    Router.on('/modules/mail', () => switchViewLegacy(MailProtocolsView));
    Router.on('/modules/nwa', () => switchViewLegacy(NWAView));
    Router.on('/modules/numbersystems', () =>
      switchViewLegacy(NumberSystemsView)
    );
    Router.on('/modules/electrical', () => switchViewLegacy(ElectricalView));
    Router.on('/modules/osi', () => switchViewLegacy(OSIView));

    Router.on('/modules/gantt', () => switchViewLegacy(GanttView));
    Router.on('/modules/communication', () =>
      switchViewLegacy(CommunicationView)
    );

    Router.on('/wiki', () => switchViewLegacy(WikiView));
    Router.on('/wiki/:topic', (params) => switchViewLegacy(WikiView, params));
    Router.on('/wiki/:topic/:subtopic', (params) =>
      switchViewLegacy(WikiView, params)
    );

    Router.on('/quiz', () => switchViewLegacy(QuizView));
    Router.on('/quiz/all', () => switchViewLegacy(QuizView, { all: true }));
    Router.on('/quiz/:topic', (params) => switchViewLegacy(QuizView, params));

    Router.on('/statistics', () => {
      window.location.hash = '#/';
    });

    Router.onNotFound(() => {
      cleanup();
      contentEl.innerHTML = `
        <div class="view-enter">
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <h2 class="empty-state-title">Seite nicht gefunden</h2>
            <p class="empty-state-text">Die gesuchte Seite existiert nicht.</p>
            <a href="#/" class="btn btn-primary">Zum Dashboard</a>
          </div>
        </div>
      `;
      Sidebar.updateActive();
    });
  }

  function switchView(ViewClass, params = {}) {
    cleanup();
    try {
      currentViewInstance = new ViewClass();
      currentViewInstance.mount(contentEl, params);
      Sidebar.updateActive();
    } catch (e) {
      console.error('Error switching view:', e);
    }
  }

  function switchViewLegacy(ViewObject, params = {}) {
    cleanup();
    if (ViewObject && typeof ViewObject.render === 'function') {
      if (typeof ViewObject.cleanup === 'function') {
        legacyCleanup = () => ViewObject.cleanup();
      }
      ViewObject.render(contentEl, params);
      Sidebar.updateActive();
    }
  }

  function cleanup() {
    if (currentViewInstance) {
      currentViewInstance.unmount();
      currentViewInstance = null;
    }
    if (legacyCleanup) {
      legacyCleanup();
      legacyCleanup = null;
    }
    window.scrollTo(0, 0);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
