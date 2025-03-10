import React, { useEffect, useState, useCallback } from "react";
import { useMoviesContext } from "../../application/store/MoviesContext";
import {
  Notification,
  adaptFetchNotification,
} from "../../domain/notifications/entities/Notification";
import FetchNotification from "./FetchNotification";

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { state } = useMoviesContext();

  // Show error notifications when errors occur in the context
  useEffect(() => {
    if (state.error) {
      const errorNotif: Notification = {
        id: `error-${Date.now()}`,
        type: "error",
        title: "Error",
        message: state.error,
        timestamp: Date.now(),
        timeout: 8000,
      };

      // Check if we already have this error to avoid duplicates
      if (!notifications.some((n) => n.message === state.error)) {
        setNotifications((prev) => [...prev, errorNotif]);
      }
    }
  }, [state.error, notifications]);

  // Update notifications when fetch job changes
  useEffect(() => {
    if (state.activeFetchJob) {
      const fetchNotif = adaptFetchNotification({
        ...state.activeFetchJob,
        timestamp: Date.now(),
      });

      setNotifications((prev) => {
        // Replace existing notification for this job or add new one
        const exists = prev.findIndex((n) => n.id === fetchNotif.id);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = fetchNotif;
          return updated;
        }
        return [...prev, fetchNotif];
      });
    }
  }, [state.activeFetchJob]);

  // Handle completed notifications to ensure they're shown briefly and then dismissed
  useEffect(() => {
    if (state.activeFetchJob?.status === "completed") {
      // Make sure completed notifications stay visible for a limited time
      const jobId = state.activeFetchJob.jobId;
      console.log(`Job ${jobId} marked as completed, will be auto-dismissed`);

      // Set a timeout to dismiss the notification after 5 seconds
      const timer = setTimeout(() => {
        dismissNotification(jobId);
      }, 5000);

      // Clean up the timer if the component unmounts or the notification changes
      return () => clearTimeout(timer);
    }
  }, [state.activeFetchJob]);

  // Efficiently remove any old notifications after a certain time
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 30000; // 30 seconds

      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => {
          // Keep notifications that are less than maxAge old
          return now - notification.timestamp < maxAge;
        })
      );
    }, 10000); // Check every 10 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    console.log(`Dismissing notification ${id}`);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      {notifications.map((notification) => (
        <FetchNotification
          key={notification.id}
          notification={notification}
          onDismiss={() => dismissNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationCenter;
