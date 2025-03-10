import { io, Socket } from "socket.io-client";
import { FetchJobStatus } from "../../domain/movies/entities/Movie";

// WebSocket event types based on backend events
export type FetchProgressEvent = {
  jobId: string;
  progress: number;
  total: number;
  searchTerm: string;
  status: "pending" | "processing" | "completed" | "failed";
};

export type WebSocketEvents = {
  "fetch:progress": (data: FetchProgressEvent) => void;
  "fetch:completed": (data: { jobId: string; movies: number }) => void;
  "fetch:error": (data: { jobId: string; error: string }) => void;
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
};

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Partial<{
    [K in keyof WebSocketEvents]: WebSocketEvents[K][];
  }> = {};

  connect() {
    if (this.socket) return;

    // Connect to the WebSocket server
    this.socket = io("/movies", {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      path: "/socket.io",
      transports: ["websocket", "polling"],
      timeout: 20000,
    });

    // Set up default event listeners
    this.socket.on("connect", () => {
      console.log("WebSocket connected");
      this.executeListeners("connect");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      this.executeListeners("disconnect", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.executeListeners("connect_error", error);
    });

    // Set up domain event listeners
    this.socket.on("fetch:progress", (data: FetchProgressEvent) => {
      this.executeListeners("fetch:progress", data);
    });

    this.socket.on(
      "fetch:completed",
      (data: { jobId: string; movies: number }) => {
        this.executeListeners("fetch:completed", data);
      }
    );

    this.socket.on("fetch:error", (data: { jobId: string; error: string }) => {
      this.executeListeners("fetch:error", data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<E extends keyof WebSocketEvents>(event: E, callback: WebSocketEvents[E]) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);
  }

  off<E extends keyof WebSocketEvents>(event: E, callback: WebSocketEvents[E]) {
    if (!this.listeners[event]) return;

    const index = this.listeners[event]!.indexOf(callback);
    if (index !== -1) {
      this.listeners[event]!.splice(index, 1);
    }
  }

  private executeListeners<E extends keyof WebSocketEvents>(
    event: E,
    ...args: Parameters<WebSocketEvents[E]>
  ) {
    if (!this.listeners[event]) return;

    for (const listener of this.listeners[event]!) {
      // @ts-ignore: args type is correctly matched by Parameters
      listener(...args);
    }
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
