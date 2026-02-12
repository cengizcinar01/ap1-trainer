class Router {
  constructor() {
    this.routes = [];
    this.notFoundHandler = null;
    this.onHashChange = this.onHashChange.bind(this);
    this.currentView = null; // Store reference to current view instance
    this.currentContainer = null;
  }

  on(pattern, handler) {
    const paramNames = [];
    const regexStr = pattern
      .replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      })
      .replace(/\//g, '/');

    this.routes.push({
      pattern,
      regex: new RegExp(`^${regexStr}$`),
      paramNames,
      handler,
    });
    return this; // Chainable
  }

  onNotFound(handler) {
    this.notFoundHandler = handler;
    return this;
  }

  navigate(hash) {
    window.location.hash = hash;
  }

  getCurrentRoute() {
    return window.location.hash.slice(1) || '/';
  }

  onHashChange() {
    const fullHash = window.location.hash.slice(1) || '/';
    const hash = fullHash.split('?')[0];

    for (const route of this.routes) {
      const match = hash.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });

        // Execute handler
        route.handler(params);
        return;
      }
    }

    if (this.notFoundHandler) {
      this.notFoundHandler();
    }
  }

  start() {
    window.addEventListener('hashchange', this.onHashChange);
    this.onHashChange(); // Initial resolve
  }

  stop() {
    window.removeEventListener('hashchange', this.onHashChange);
  }
}

export default new Router();
