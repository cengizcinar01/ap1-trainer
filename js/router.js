// ============================================================
// router.js — Hash-based SPA Router
// ============================================================

const Router = (() => {
  const routes = [];
  let notFoundHandler = null;

  /**
   * Register a route.
   *
   * @param {string} pattern — route pattern, e.g. '/learn/:topic'
   * @param {Function} handler — function(params) to render the view
   */
  function on(pattern, handler) {
    const paramNames = [];
    const regexStr = pattern
      .replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      })
      .replace(/\//g, '\\/');

    routes.push({
      pattern,
      regex: new RegExp(`^${regexStr}$`),
      paramNames,
      handler,
    });
  }

  /**
   * Set the 404 handler.
   */
  function onNotFound(handler) {
    notFoundHandler = handler;
  }

  /**
   * Navigate to a hash route.
   */
  function navigate(hash) {
    window.location.hash = hash;
  }

  /**
   * Resolve current hash and call matching handler.
   */
  function resolve() {
    const fullHash = window.location.hash.slice(1) || '/';
    // Strip query parameters for route matching
    const hash = fullHash.split('?')[0];

    for (const route of routes) {
      const match = hash.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        route.handler(params);
        return;
      }
    }

    // No match
    if (notFoundHandler) {
      notFoundHandler();
    }
  }

  /**
   * Start listening for hash changes.
   */
  function start() {
    window.addEventListener('hashchange', resolve);
    // Resolve initial route
    resolve();
  }

  /**
   * Stop the router.
   */
  function stop() {
    window.removeEventListener('hashchange', resolve);
  }

  /**
   * Get current route hash.
   */
  function getCurrentRoute() {
    return window.location.hash.slice(1) || '/';
  }

  return {
    on,
    onNotFound,
    navigate,
    resolve,
    start,
    stop,
    getCurrentRoute,
  };
})();

export default Router;
