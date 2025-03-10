import React, { useEffect, useState } from "react";
import { Notification } from "../../domain/notifications/entities/Notification";
import { useMoviesContext } from "../../application/store/MoviesContext";

interface FetchNotificationProps {
  notification: Notification;
  onDismiss: () => void;
}

const FetchNotification: React.FC<FetchNotificationProps> = ({
  notification,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(true);
  const { state, cancelFetch } = useMoviesContext();
  const [dismissalTimeout, setDismissalTimeout] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (notification.timeout) {
      console.log(
        `Setting auto-dismiss timeout for ${notification.id} (${notification.type}) for ${notification.timeout}ms`
      );

      const timer = setTimeout(() => {
        console.log(`Auto-dismissing notification ${notification.id}`);
        handleDismiss();
      }, notification.timeout);

      setDismissalTimeout(timer);

      return () => {
        if (dismissalTimeout) {
          clearTimeout(dismissalTimeout);
        }
      };
    }
  }, [notification.id, notification.timeout, notification.type]);

  useEffect(() => {
    if (notification.data?.status === "completed") {
      console.log(
        `Setting auto-dismiss for completed notification: ${notification.id}`
      );
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);

      setDismissalTimeout(timer);

      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [notification.data?.status]);

  const handleDismiss = () => {
    setVisible(false);
    if (dismissalTimeout) {
      clearTimeout(dismissalTimeout);
      setDismissalTimeout(null);
    }

    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const getStatusColor = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  const getProgressBarColor = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  const handleCancel = () => {
    if (notification.data?.jobId) {
      cancelFetch(notification.data.jobId);
      handleDismiss();
    }
  };

  const progressPercentage = React.useMemo(() => {
    if (
      !notification.data ||
      typeof notification.data.progress !== "number" ||
      typeof notification.data.total !== "number" ||
      notification.data.total === 0
    ) {
      return 0;
    }

    return Math.min(
      Math.round((notification.data.progress / notification.data.total) * 100),
      100
    );
  }, [notification.data]);

  const getFetchMessage = () => {
    return notification.message;
  };

  if (!notification) {
    return null;
  }

  return (
    <div
      className={`max-w-md w-full bg-gray-800 border border-gray-700 shadow-lg rounded-lg pointer-events-auto overflow-hidden transition-all duration-300 ${
        visible
          ? "opacity-100 transform translate-y-0"
          : "opacity-0 transform translate-y-2"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
          </div>
          <div className="ml-3 w-0 flex-1">
            {notification.title && (
              <p className="text-sm font-medium text-white">
                {notification.title}
              </p>
            )}
            <p className="text-sm text-gray-300 mt-1">
              {notification.data ? getFetchMessage() : notification.message}
            </p>

            {notification.data?.status &&
              notification.data?.status !== "completed" &&
              notification.data?.status !== "failed" && (
                <div className="mt-2">
                  <div className="bg-gray-700 rounded-full h-2.5 mb-1">
                    <div
                      className={`${getProgressBarColor()} h-2.5 rounded-full transition-all duration-300`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>
                      {notification.data.progress || 0} of{" "}
                      {notification.data.total || 0}
                    </span>
                    <span>{progressPercentage}%</span>
                  </div>
                </div>
              )}

            {notification.data?.status === "completed" && (
              <div className="mt-2 text-sm text-green-400 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Ready to browse</span>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            {notification.data?.status &&
              notification.data?.status !== "completed" &&
              notification.data?.status !== "failed" && (
                <button
                  className="mr-2 bg-gray-700 rounded-md inline-flex text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleCancel}
                >
                  <span className="sr-only">Cancel</span>
                  <span className="px-2 py-1 text-xs">Cancel</span>
                </button>
              )}
            <button
              className="bg-gray-700 rounded-md inline-flex text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleDismiss}
            >
              <span className="sr-only">Close</span>
              <span className="px-2 py-1 text-xs">Dismiss</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FetchNotification;
