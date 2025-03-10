/**
 * @vitest-environment jsdom
 */

// Create a mock socket for testing
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
};

// Mocks for socket.io-client
vi.mock("socket.io-client", () => ({
  io: () => mockSocket,
}));

// Spy on console methods
const consoleSpy = {
  log: vi.spyOn(console, "log").mockImplementation(() => {}),
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
};

import { describe, it, expect, vi, beforeEach } from "vitest";
import { websocketService } from "../../../infrastructure/websocket/websocket.service";

describe("WebSocketService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have all required methods", () => {
    expect(typeof websocketService.connect).toBe("function");
    expect(typeof websocketService.disconnect).toBe("function");
    expect(typeof websocketService.on).toBe("function");
    expect(typeof websocketService.off).toBe("function");
  });

  it("should connect to WebSocket server", () => {
    websocketService.connect();

    // Check that socket.io is initialized with basic handlers
    expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function));
  });

  it("should disconnect from WebSocket server", () => {
    websocketService.connect();
    websocketService.disconnect();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it("should register event listeners with on()", () => {
    const callback = vi.fn();
    websocketService.on("fetch:progress", callback);

    const listeners = (websocketService as any).listeners;
    expect(listeners["fetch:progress"]).toBeDefined();
    expect(listeners["fetch:progress"]).toContain(callback);
  });

  it("should unregister event listeners with off()", () => {
    const callback = vi.fn();
    websocketService.on("fetch:progress", callback);
    websocketService.off("fetch:progress", callback);

    const listeners = (websocketService as any).listeners;
    expect(listeners["fetch:progress"]?.includes(callback)).toBe(false);
  });

  it("should handle multiple listeners for same event", () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    // Clear any existing listeners
    const listeners = (websocketService as any).listeners;
    listeners["fetch:progress"] = [];

    // Add our test listeners
    websocketService.on("fetch:progress", callback1);
    websocketService.on("fetch:progress", callback2);

    // Now check
    expect(listeners["fetch:progress"]).toHaveLength(2);
    expect(listeners["fetch:progress"]).toContain(callback1);
    expect(listeners["fetch:progress"]).toContain(callback2);
  });

  it("should distribute socket events to listeners", () => {
    // Setup the test
    const callback = vi.fn();
    websocketService.on("connect", callback);
    websocketService.connect();

    // Manually call the executeListeners method with the event
    const executeListeners = (websocketService as any).executeListeners.bind(
      websocketService
    );
    executeListeners("connect");

    // Verify the listener was called
    expect(callback).toHaveBeenCalled();
  });

  it("should distribute socket events with data to listeners", () => {
    // Setup the test
    const callback = vi.fn();
    websocketService.on("fetch:progress", callback);

    // Test data
    const testData = {
      jobId: "test123",
      progress: 50,
      total: 100,
      searchTerm: "test",
      status: "processing",
    };

    // Manually call the executeListeners method with the event and data
    const executeListeners = (websocketService as any).executeListeners.bind(
      websocketService
    );
    executeListeners("fetch:progress", testData);

    // Verify the listener was called with the data
    expect(callback).toHaveBeenCalledWith(testData);
  });
});
