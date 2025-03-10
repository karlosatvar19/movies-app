import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Add custom matchers from jest-dom
expect.extend(matchers);

// Run cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock the env variables
vi.mock("import.meta.env", () => ({
  VITE_API_URL: "http://localhost:8080/api",
}));

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  callback: IntersectionObserverCallback;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);

  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
}

// Replace the native IntersectionObserver with our mock
Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock window.matchMedia which is not implemented in JSDOM
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock socket.io-client
vi.mock("socket.io-client", () => {
  const socket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    id: "mock-socket-id",
    connected: true,
    removeAllListeners: vi.fn(),
  };

  return {
    io: vi.fn(() => socket),
    default: vi.fn(() => socket),
  };
});

// Mock fetch API
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Silence console errors and warnings in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Replace console.error and console.warn with mocked versions for tests
console.error = vi.fn();
console.warn = vi.fn();

// Restore original console methods after tests
afterEach(() => {
  vi.clearAllMocks();
});
