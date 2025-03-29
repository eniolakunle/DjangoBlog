// jest.setup.js
global.IntersectionObserver = class {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
  }
  observe() {
    // Optionally, simulate observing an element.
  }
  unobserve() {}
  disconnect() {}
};
