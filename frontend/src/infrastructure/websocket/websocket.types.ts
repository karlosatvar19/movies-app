/**
 * WebSocket event types supported by the application
 */
export type WebSocketEvents =
  | "fetch:progress"
  | "fetch:completed"
  | "fetch:error"
  | "connection:status"
  | "heartbeat";

/**
 * Event data for fetch progress updates
 */
export interface FetchProgressEvent {
  jobId: string;
  searchTerm: string;
  progress: number;
  total: number;
  status: "pending" | "processing" | "completed" | "failed";
  timestamp: number;
}

/**
 * Event data for fetch completion
 */
export interface FetchCompletedEvent {
  jobId: string;
  searchTerm: string;
  total: number;
  timestamp: number;
}

/**
 * Event data for fetch errors
 */
export interface FetchErrorEvent {
  jobId: string;
  error: string;
  searchTerm?: string;
  timestamp: number;
}

/**
 * Event data for connection status updates
 */
export interface ConnectionStatusEvent {
  status: "connected" | "disconnected" | "connecting";
  timestamp: number;
}

/**
 * Event data for heartbeat messages
 */
export interface HeartbeatEvent {
  clientId: string;
  timestamp: number;
}

/**
 * All possible WebSocket event data types
 */
export type WebSocketEventData =
  | FetchProgressEvent
  | FetchCompletedEvent
  | FetchErrorEvent
  | ConnectionStatusEvent
  | HeartbeatEvent;
