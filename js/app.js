// ============================================================
// app.js — Application initialization and route setup
// ============================================================

import OSIModelView from '../modules/osimodel.js';
import SubnettingView from '../modules/subnetting.js';
import Sidebar from './components/sidebar.js';
import DataLoader from './data/dataLoader.js';
import StorageManager from './data/storageManager.js';
import Router from './router.js';
import CategoriesView from './views/categories.js';
import DashboardView from './views/dashboard.js';
import FlashcardView from './views/flashcard.js';
import ReviewView from './views/review.js';
import WikiView from './views/wiki.js';

const App = (() => {
  let contentEl = null;
  let currentCleanup = null;

  async function init() {
    try {
      // Show loading
      document.getElementById('app').innerHTML = `
        <div class="loader" style="height:100vh">
          <div class="loader-spinner"></div>
        </div>
      `;

      // Load data
      await DataLoader.loadData();
      StorageManager.init();

      // Setup app shell
      document.getElementById('app').innerHTML = `
        <div class="app">
          <main class="main-content">
            <div class="page-content" id="pageContent">
            </div>
          </main>
        </div>
      `;

      contentEl = document.getElementById('pageContent');

      // Render sidebar
      Sidebar.render();

      // Setup routes
      setupRoutes();

      // Start router
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
    Router.on('/', () => {
      cleanupCurrentView();
      DashboardView.render(contentEl);
      Sidebar.updateActive();
    });

    Router.on('/categories', () => {
      cleanupCurrentView();
      CategoriesView.render(contentEl);
      Sidebar.updateActive();
    });

    Router.on('/learn/:topic', (params) => {
      cleanupCurrentView();
      currentCleanup = FlashcardView.cleanup;
      FlashcardView.render(contentEl, params);
      Sidebar.updateActive();
    });

    Router.on('/learn/:topic/:subtopic', (params) => {
      cleanupCurrentView();
      currentCleanup = FlashcardView.cleanup;
      FlashcardView.render(contentEl, params);
      Sidebar.updateActive();
    });

    Router.on('/review', () => {
      cleanupCurrentView();
      currentCleanup = ReviewView.cleanup;
      ReviewView.render(contentEl);
      Sidebar.updateActive();
    });

    Router.on('/modules/subnetting', () => {
      cleanupCurrentView();
      currentCleanup = SubnettingView.cleanup;
      SubnettingView.render(contentEl);
      Sidebar.updateActive();
    });

    Router.on('/modules/osimodel', () => {
      cleanupCurrentView();
      currentCleanup = OSIModelView.cleanup;
      OSIModelView.render(contentEl);
      Sidebar.updateActive();
    });

    Router.on('/wiki', () => {
      cleanupCurrentView();
      currentCleanup = WikiView.cleanup;
      WikiView.render(contentEl);
      Sidebar.updateActive();
    });

    Router.on('/wiki/:topic', (params) => {
      cleanupCurrentView();
      currentCleanup = WikiView.cleanup;
      WikiView.render(contentEl, params);
      Sidebar.updateActive();
    });

    Router.on('/wiki/:topic/:subtopic', (params) => {
      cleanupCurrentView();
      currentCleanup = WikiView.cleanup;
      WikiView.render(contentEl, params);
      Sidebar.updateActive();
    });

    Router.on('/statistics', () => {
      // Redirect to dashboard (statistics are now integrated there)
      window.location.hash = '#/';
    });

    Router.onNotFound(() => {
      cleanupCurrentView();
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

  function cleanupCurrentView() {
    if (currentCleanup) {
      currentCleanup();
      currentCleanup = null;
    }
    // Scroll to top
    window.scrollTo(0, 0);
  }

  return { init };
})();

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
