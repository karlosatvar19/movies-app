export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  title?: string;
  data?: any;
  timeout?: number;
  timestamp: number;
}

export interface FetchNotificationType {
  jobId: string;
  searchTerm: string;
  progress: number;
  total: number;
  status: "pending" | "processing" | "completed" | "failed";
  timestamp: number;
}

// Adapter function to convert FetchNotificationType to Notification
export const adaptFetchNotification = (
  fetch: FetchNotificationType
): Notification => {
  let type: "success" | "error" | "info" | "warning" = "info";
  // Use consistent fallback mechanism for empty search terms
  const displayTerm = fetch.searchTerm.trim() ? fetch.searchTerm : "space";
  let message = `Fetching movies for "${displayTerm}"...`;
  let timeout: number | undefined = undefined;

  if (fetch.status === "completed") {
    type = "success";
    message = `Successfully fetched ${fetch.total} movies for "${displayTerm}"`;
    timeout = 5000; // Auto-dismiss after 5 seconds when completed
  } else if (fetch.status === "failed") {
    type = "error";
    message = `Failed to fetch movies for "${displayTerm}"`;
    timeout = 8000; // Auto-dismiss errors after 8 seconds
  }

  return {
    id: fetch.jobId,
    type,
    message,
    title: "Movie Fetch Operation",
    data: fetch,
    timestamp: fetch.timestamp,
    timeout,
  };
};
