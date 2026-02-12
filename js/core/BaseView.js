export default class BaseView {
  constructor() {
    this.container = null;
    this.cleanupFns = [];
  }

  mount(container, params = {}) {
    this.container = container;
    this.params = params;
    this.cleanupFns = [];
    this.render();
    this.onMount();
  }

  render() {
    throw new Error('render() must be implemented by subclass');
  }

  onMount() {
    // Optional hook for subclasses
  }

  unmount() {
    this.cleanupFns.forEach((fn) => {
      fn();
    });
    this.cleanupFns = [];
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    this.onUnmount();
  }

  onUnmount() {
    // Optional hook for subclasses
  }

  addCleanup(fn) {
    this.cleanupFns.push(fn);
  }

  // Helper to safely select within container
  $(selector) {
    if (!this.container) return null;
    return this.container.querySelector(selector);
  }

  $$(selector) {
    if (!this.container) return [];
    return this.container.querySelectorAll(selector);
  }
}
