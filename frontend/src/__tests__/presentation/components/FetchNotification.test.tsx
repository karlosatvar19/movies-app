import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import FetchNotification from "../../../presentation/components/FetchNotification";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Notification } from "../../../domain/notifications/entities/Notification";
import { useMoviesContext } from "../../../application/store/MoviesContext";
import userEvent from "@testing-library/user-event";

// Mock useMoviesContext
const mockCancelFetch = vi.fn();
vi.mock("../../../application/store/MoviesContext", () => ({
  useMoviesContext: vi.fn(() => ({
    moviesState: {},
    cancelFetch: mockCancelFetch,
  })),
}));

const mockUseMoviesContext = () => {
  const cancelFetch = vi.fn();
  const moviesState = {
    movies: [],
    loading: false,
    error: null,
    searchQuery: "",
    fetchJobs: [],
  };

  (useMoviesContext as any).mockReturnValue({
    moviesState,
    cancelFetch,
  });

  return { moviesState, cancelFetch };
};

describe("FetchNotification Component", () => {
  // Setup and cleanup for timing-related tests
  beforeEach(() => {
    vi.clearAllMocks();
    mockDismiss.mockClear();
    mockCancelFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Reset any mocked timers
    if (vi.isFakeTimers()) {
      vi.useRealTimers();
    }
  });

  const mockDismiss = vi.fn();

  // Helper function to create a notification
  const createNotification = (
    status: "processing" | "completed" | "failed",
    progress: number = 0
  ): Notification => ({
    id: "test-id",
    title: "Test Notification",
    message: "Test Message",
    type: "info" as const,
    timestamp: Date.now(),
    data: {
      jobId: "job-123",
      status,
      progress,
      total: 100,
      searchTerm: "Star Wars",
    },
  });

  it("should render the progress bar correctly", () => {
    const notification = createNotification("processing", 50);

    render(
      <FetchNotification notification={notification} onDismiss={mockDismiss} />
    );

    // Check that the progress bar is rendered
    const progressBar = document.querySelector(
      ".bg-blue-500.h-2\\.5.rounded-full"
    );
    expect(progressBar).toBeTruthy();

    // Check that the progress percentage is displayed
    const percentageText = screen.getByText("50%");
    expect(percentageText).toBeInTheDocument();
  });

  it("should show a different UI for completed status", () => {
    const notification = createNotification("completed", 100);

    render(
      <FetchNotification notification={notification} onDismiss={mockDismiss} />
    );

    // Verify it shows the "Ready to browse" message for completed status
    const readyMessage = screen.getByText("Ready to browse");
    expect(readyMessage).toBeInTheDocument();

    // Check for the checkmark icon
    const checkmarkIcon = document.querySelector("svg");
    expect(checkmarkIcon).toBeTruthy();
  });

  it("should show a different UI for failed status", () => {
    const notification = createNotification("failed", 50);

    render(
      <FetchNotification notification={notification} onDismiss={mockDismiss} />
    );

    // For failed status, we should see the message but no progress bar
    const message = screen.getByText("Test Message");
    expect(message).toBeInTheDocument();

    // Progress bar should not be present
    const progressBar = document.querySelector(
      ".bg-blue-500.h-2\\.5.rounded-full"
    );
    expect(progressBar).toBeFalsy();
  });

  it("should call onDismiss when the dismiss button is clicked", () => {
    // Setup
    const notification = createNotification("processing", 50);
    mockDismiss.mockClear();

    // Mock setTimeout to execute immediately
    vi.useFakeTimers();

    // Render
    render(
      <FetchNotification notification={notification} onDismiss={mockDismiss} />
    );

    // Find and click the dismiss button
    const dismissButton = screen.getByText("Dismiss");
    fireEvent.click(dismissButton);

    // Fast-forward timers
    vi.runAllTimers();

    // Verify onDismiss was called
    expect(mockDismiss).toHaveBeenCalled();

    // Cleanup
    vi.useRealTimers();
  });

  it("should render with a colored indicator based on status", () => {
    // Test with different notification types
    const infoNotification = createNotification("processing", 50);

    const { rerender } = render(
      <FetchNotification
        notification={infoNotification}
        onDismiss={mockDismiss}
      />
    );

    // Check for info notification color
    const infoIndicator = document.querySelector(".bg-blue-500");
    expect(infoIndicator).toBeTruthy();

    // Test with a warning notification
    const warningNotification = {
      ...createNotification("processing", 50),
      type: "warning" as const,
    };

    rerender(
      <FetchNotification
        notification={warningNotification}
        onDismiss={mockDismiss}
      />
    );

    // Check for warning notification color
    const warningIndicator = document.querySelector(".bg-yellow-500");
    expect(warningIndicator).toBeTruthy();

    // Test with an error notification
    const errorNotification = {
      ...createNotification("processing", 50),
      type: "error" as const,
    };

    rerender(
      <FetchNotification
        notification={errorNotification}
        onDismiss={mockDismiss}
      />
    );

    // Check for error notification color
    const errorIndicator = document.querySelector(".bg-red-500");
    expect(errorIndicator).toBeTruthy();
  });

  it("should use different status colors based on notification type", () => {
    const successNotification = {
      ...createNotification("completed", 100),
      type: "success" as const,
    };
    const { rerender } = render(
      <FetchNotification
        notification={successNotification}
        onDismiss={mockDismiss}
      />
    );

    // Check for green indicator
    const successIndicator = document.querySelector(".bg-green-500");
    expect(successIndicator).toBeTruthy();

    // Test with a warning notification
    const warningNotification = {
      ...createNotification("processing", 50),
      type: "warning" as const,
    };
    rerender(
      <FetchNotification
        notification={warningNotification}
        onDismiss={mockDismiss}
      />
    );

    // Check for yellow indicator
    const warningIndicator = document.querySelector(".bg-yellow-500");
    expect(warningIndicator).toBeTruthy();
  });

  it("should use different progress bar colors based on notification type", () => {
    const successNotification = {
      ...createNotification("processing", 50),
      type: "success" as const,
    };
    const { rerender } = render(
      <FetchNotification
        notification={successNotification}
        onDismiss={mockDismiss}
      />
    );

    // Check for green progress bar
    const successBar = document.querySelector(
      ".bg-green-500.h-2\\.5.rounded-full"
    );
    expect(successBar).toBeTruthy();

    // Test with a warning notification
    const warningNotification = {
      ...createNotification("processing", 50),
      type: "warning" as const,
    };
    rerender(
      <FetchNotification
        notification={warningNotification}
        onDismiss={mockDismiss}
      />
    );

    // Check for yellow progress bar
    const warningBar = document.querySelector(
      ".bg-yellow-500.h-2\\.5.rounded-full"
    );
    expect(warningBar).toBeTruthy();
  });

  it("should handle cancel button click", () => {
    // Setup
    mockCancelFetch.mockClear();
    mockDismiss.mockClear();
    const notification = createNotification("processing", 50);

    // Mock setTimeout to execute immediately
    vi.useFakeTimers();

    // Render
    render(
      <FetchNotification notification={notification} onDismiss={mockDismiss} />
    );

    // Find the cancel button - it's the one with the mr-2 class
    const cancelButton = document.querySelector("button.mr-2");
    expect(cancelButton).not.toBeNull();

    // Click the button
    if (cancelButton) {
      fireEvent.click(cancelButton);
    }

    // Fast-forward timers
    vi.runAllTimers();

    // Verify cancelFetch was called with the correct job ID
    expect(mockCancelFetch).toHaveBeenCalledWith("job-123");

    // Should also call onDismiss
    expect(mockDismiss).toHaveBeenCalled();

    // Cleanup
    vi.useRealTimers();
  });

  it("should auto-dismiss after timeout when notification has timeout set", () => {
    // Setup
    mockDismiss.mockClear();
    vi.useFakeTimers();

    // Create a notification with a timeout
    const notification = {
      ...createNotification("processing", 50),
      timeout: 1000,
    };

    // Render
    render(
      <FetchNotification notification={notification} onDismiss={mockDismiss} />
    );

    // Initially, onDismiss should not be called
    expect(mockDismiss).not.toHaveBeenCalled();

    // Fast-forward time by the timeout amount plus animation duration
    vi.advanceTimersByTime(1300);

    // onDismiss should be called after the timeout
    expect(mockDismiss).toHaveBeenCalled();

    // Cleanup
    vi.useRealTimers();
  });

  it("should auto-dismiss completed notifications", () => {
    // Setup
    mockDismiss.mockClear();
    vi.useFakeTimers();

    // Create a completed notification
    const notification = createNotification("completed", 100);

    // Render
    render(
      <FetchNotification notification={notification} onDismiss={mockDismiss} />
    );

    // Initially, onDismiss should not be called
    expect(mockDismiss).not.toHaveBeenCalled();

    // Fast-forward time by 5 seconds (the completion auto-dismiss timeout) plus animation duration
    vi.advanceTimersByTime(5300);

    // onDismiss should be called after the timeout
    expect(mockDismiss).toHaveBeenCalled();

    // Cleanup
    vi.useRealTimers();
  });

  it("should calculate progress percentage correctly", () => {
    // Test with different progress values
    const notification25 = {
      ...createNotification("processing", 25),
      data: {
        jobId: "job-123",
        status: "processing",
        progress: 25,
        total: 100,
        searchTerm: "Star Wars",
      },
    };

    const { rerender } = render(
      <FetchNotification
        notification={notification25}
        onDismiss={mockDismiss}
      />
    );

    // Check for 25% progress
    const progress25Text = screen.getByText("25%");
    expect(progress25Text).toBeInTheDocument();

    // Test with 75% progress
    const notification75 = {
      ...createNotification("processing", 75),
      data: {
        jobId: "job-123",
        status: "processing",
        progress: 75,
        total: 100,
        searchTerm: "Star Wars",
      },
    };

    rerender(
      <FetchNotification
        notification={notification75}
        onDismiss={mockDismiss}
      />
    );

    // Check for 75% progress
    const progress75Text = screen.getByText("75%");
    expect(progress75Text).toBeInTheDocument();
  });
});
