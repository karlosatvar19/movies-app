import { useEffect, useState, useCallback, useRef } from "react";
import websocketService, {
  WebSocketEvents,
  FetchProgressEvent,
} from "../../infrastructure/websocket/websocket.service";

type EventsMap = WebSocketEvents;
type EventNames = keyof EventsMap;
type EventCallback<E extends EventNames> = EventsMap[E];
type EventData<E extends EventNames> = Parameters<EventCallback<E>>[0];

/**
 * Custom hook for using the WebSocket service
 *
 * @param event WebSocket event to listen for
 * @param callback Callback function to execute when event is received
 * @param deps Dependency array for the callback
 * @returns Connection status and manual connect/disconnect functions
 */
export function useWebSocket<E extends EventNames>(
  event: E,
  callback: EventCallback<E>,
  deps: React.DependencyList = []
) {
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("disconnected");

  // Use a ref for the callback to avoid unnecessary re-subscriptions
  const callbackRef = useRef(callback);

  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);

  // Connect to the WebSocket service and subscribe to the event
  useEffect(() => {
    // Connect to the WebSocket service
    websocketService.connect();

    // Listen for connection status changes
    const onConnect = () => setConnectionStatus("connected");
    const onDisconnect = () => setConnectionStatus("disconnected");
    const onConnectError = () => setConnectionStatus("disconnected");

    websocketService.on("connect", onConnect);
    websocketService.on("disconnect", onDisconnect);
    websocketService.on("connect_error", onConnectError);

    // Subscribe to the event with a typesafe wrapper
    websocketService.on(event, callback as any);

    // Cleanup function to unsubscribe from events when unmounting
    return () => {
      websocketService.off("connect", onConnect);
      websocketService.off("disconnect", onDisconnect);
      websocketService.off("connect_error", onConnectError);
      websocketService.off(event, callback as any);
      // Note: We don't disconnect here as other components may be using the connection
    };
  }, [event]);

  // Create stable versions of connect and disconnect functions
  const stableConnect = useCallback(() => {
    websocketService.connect();
  }, []);

  const stableDisconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  return {
    connectionStatus,
    connect: stableConnect,
    disconnect: stableDisconnect,
  };
}

/**
 * Custom hook for subscribing to multiple WebSocket events at once
 *
 * @param eventCallbacks Array of event/callback pairs to subscribe to
 * @returns Connection status and manual connect/disconnect functions
 */
export function useMultiWebSocketEvents(
  eventCallbacks: Array<{ event: EventNames; callback: any }>
) {
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("disconnected");

  // Connect to the WebSocket service and subscribe to all events
  useEffect(() => {
    // Connect to the WebSocket service
    websocketService.connect();

    // Listen for connection status changes
    const onConnect = () => setConnectionStatus("connected");
    const onDisconnect = () => setConnectionStatus("disconnected");
    const onConnectError = () => setConnectionStatus("disconnected");

    websocketService.on("connect", onConnect);
    websocketService.on("disconnect", onDisconnect);
    websocketService.on("connect_error", onConnectError);

    // Subscribe to all events
    eventCallbacks.forEach(({ event, callback }) => {
      websocketService.on(event, callback);
    });

    // Cleanup function to unsubscribe from all events when unmounting
    return () => {
      websocketService.off("connect", onConnect);
      websocketService.off("disconnect", onDisconnect);
      websocketService.off("connect_error", onConnectError);

      eventCallbacks.forEach(({ event, callback }) => {
        websocketService.off(event, callback);
      });
      // Note: We don't disconnect here as other components may be using the connection
    };
  }, [eventCallbacks]);

  // Create stable versions of connect and disconnect functions
  const stableConnect = useCallback(() => {
    websocketService.connect();
  }, []);

  const stableDisconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  return {
    connectionStatus,
    connect: stableConnect,
    disconnect: stableDisconnect,
  };
}
