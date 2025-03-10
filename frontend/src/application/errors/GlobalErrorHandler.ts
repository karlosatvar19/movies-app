import { AxiosError } from "axios";

export type ErrorSeverity = "error" | "warning" | "info";

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  severity: ErrorSeverity;
  timestamp: number;
}

/**
 * Global error handler for processing API and application errors
 * in a consistent manner across the application.
 */
class GlobalErrorHandler {
  private listeners: Array<(error: ApiError) => void> = [];

  /**
   * Process an error from any source and convert it to a standard ApiError
   */
  public handleError(error: unknown): ApiError {
    let apiError: ApiError;

    // Process Axios errors
    if (this.isAxiosError(error)) {
      apiError = this.processAxiosError(error);
    }
    // Process standard Error objects
    else if (error instanceof Error) {
      apiError = {
        code: "APP_ERROR",
        message: error.message || "An application error occurred",
        severity: "error",
        timestamp: Date.now(),
      };
    }
    // Process unknown errors
    else {
      apiError = {
        code: "UNKNOWN_ERROR",
        message: "An unknown error occurred",
        severity: "error",
        timestamp: Date.now(),
      };
    }

    // Notify all listeners
    this.notifyListeners(apiError);

    return apiError;
  }

  /**
   * Add a listener function that will be called when errors occur
   */
  public addListener(callback: (error: ApiError) => void): () => void {
    this.listeners.push(callback);

    // Return a function to remove this listener
    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== callback
      );
    };
  }

  /**
   * Determine if an error is an Axios error
   */
  private isAxiosError(error: any): error is AxiosError {
    return error.isAxiosError === true;
  }

  /**
   * Process Axios errors and extract relevant information
   */
  private processAxiosError(error: AxiosError): ApiError {
    // Get HTTP status code
    const status = error.response?.status || 500;

    // Default error message
    let message = "An error occurred communicating with the server";
    let code = "API_ERROR";
    let severity: ErrorSeverity = "error";

    // Extract error details from response if available
    if (error.response?.data) {
      const data = error.response.data as any;

      // If the server returned a structured error
      if (data.message) {
        message = data.message;
      }

      if (data.error) {
        code = data.error;
      }
    }

    // Assign severity based on status code
    if (status >= 400 && status < 500) {
      severity = "warning";

      // Special handling for common client errors
      if (status === 401) {
        code = "UNAUTHORIZED";
        message = "You are not authorized to perform this action";
      } else if (status === 403) {
        code = "FORBIDDEN";
        message = "You do not have permission to access this resource";
      } else if (status === 404) {
        code = "NOT_FOUND";
        message = "The requested resource was not found";
      } else if (status === 429) {
        code = "RATE_LIMITED";
        message = "Too many requests, please try again later";
      }
    } else if (status >= 500) {
      severity = "error";
      code = "SERVER_ERROR";
      message = "A server error occurred, please try again later";
    }

    return {
      code,
      message,
      details: {
        status,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
      },
      severity,
      timestamp: Date.now(),
    };
  }

  /**
   * Notify all listeners about an error
   */
  private notifyListeners(error: ApiError): void {
    this.listeners.forEach((listener) => {
      try {
        listener(error);
      } catch (e) {
        console.error("Error in error listener:", e);
      }
    });
  }
}

// Create a singleton instance
export const globalErrorHandler = new GlobalErrorHandler();
export default globalErrorHandler;
