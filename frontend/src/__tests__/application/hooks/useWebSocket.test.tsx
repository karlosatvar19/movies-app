import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useWebSocket,
  useMultiWebSocketEvents,
} from "../../../application/hooks/useWebSocket";
import websocketService from "../../../infrastructure/websocket/websocket.service";

// Mock the websocket service
vi.mock("../../../infrastructure/websocket/websocket.service", () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

describe("useWebSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should connect to WebSocket on mount", () => {
    // Render the hook
    renderHook(() => useWebSocket("fetch:progress", vi.fn()));

    // Assert
    expect(websocketService.connect).toHaveBeenCalled();
  });

  it("should register event handlers", () => {
    const callback = vi.fn();

    // Render the hook
    renderHook(() => useWebSocket("fetch:progress", callback));

    // Assert
    expect(websocketService.on).toHaveBeenCalledWith(
      "fetch:progress",
      expect.any(Function)
    );
  });

  it("should unregister event handlers on unmount", () => {
    // Render the hook
    const { unmount } = renderHook(() =>
      useWebSocket("fetch:progress", vi.fn())
    );

    // Unmount
    unmount();

    // Assert
    expect(websocketService.off).toHaveBeenCalledWith(
      "fetch:progress",
      expect.any(Function)
    );
  });

  it("should provide stable connect and disconnect functions", () => {
    const { result, rerender } = renderHook(() =>
      useWebSocket("fetch:progress", vi.fn())
    );

    // Save the functions
    const initialConnect = result.current.connect;
    const initialDisconnect = result.current.disconnect;

    // Rerender
    rerender();

    // Check functions are the same objects
    expect(result.current.connect).toBe(initialConnect);
    expect(result.current.disconnect).toBe(initialDisconnect);
  });
});

describe("useMultiWebSocketEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should connect to WebSocket on mount", () => {
    // Render the hook
    renderHook(() =>
      useMultiWebSocketEvents([
        { event: "fetch:progress", callback: vi.fn() },
        { event: "fetch:completed", callback: vi.fn() },
      ])
    );

    // Assert
    expect(websocketService.connect).toHaveBeenCalled();
  });

  it("should register multiple event handlers", () => {
    const callbacks = {
      progress: vi.fn(),
      completed: vi.fn(),
    };

    // Render the hook
    renderHook(() =>
      useMultiWebSocketEvents([
        { event: "fetch:progress", callback: callbacks.progress },
        { event: "fetch:completed", callback: callbacks.completed },
      ])
    );

    // Assert
    expect(websocketService.on).toHaveBeenCalledWith(
      "fetch:progress",
      callbacks.progress
    );
    expect(websocketService.on).toHaveBeenCalledWith(
      "fetch:completed",
      callbacks.completed
    );
  });

  it("should unregister all event handlers on unmount", () => {
    const callbacks = {
      progress: vi.fn(),
      completed: vi.fn(),
    };

    // Render the hook
    const { unmount } = renderHook(() =>
      useMultiWebSocketEvents([
        { event: "fetch:progress", callback: callbacks.progress },
        { event: "fetch:completed", callback: callbacks.completed },
      ])
    );

    // Unmount
    unmount();

    // Assert
    expect(websocketService.off).toHaveBeenCalledWith(
      "fetch:progress",
      callbacks.progress
    );
    expect(websocketService.off).toHaveBeenCalledWith(
      "fetch:completed",
      callbacks.completed
    );
  });
});
