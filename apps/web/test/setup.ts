import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

vi.mock("../src/components/ScoreCharts.js", () => ({
  ScoreChart: ({ title }: { title: string }) =>
    React.createElement(
      "section",
      {
        "aria-label": title
      },
      React.createElement("h2", null, title)
    )
}));

function createStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    }
  };
}

Object.defineProperty(window, "localStorage", {
  writable: true,
  configurable: true,
  value: createStorageMock()
});

class ResizeObserverMock implements ResizeObserver {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: {
            x: 0,
            y: 0,
            width: 800,
            height: 400,
            top: 0,
            right: 800,
            bottom: 400,
            left: 0,
            toJSON: () => ""
          }
        } as ResizeObserverEntry
      ],
      this
    );
  }

  unobserve() {
    return undefined;
  }

  disconnect() {
    return undefined;
  }
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: ResizeObserverMock
});

Object.defineProperty(HTMLElement.prototype, "clientWidth", {
  configurable: true,
  value: 800
});

Object.defineProperty(HTMLElement.prototype, "clientHeight", {
  configurable: true,
  value: 400
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false
  })
});
