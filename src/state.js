class State {
  constructor() {
    this.data = {
      urls: [],
      loading: false,
      results: null,
      error: null
    };
    this.listeners = new Set();
  }

  get() {
    return this.data;
  }

  set(updates) {
    this.data = { ...this.data, ...updates };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.data);
    }
  }
}

export const state = new State();
