import { vi, describe, it, expect } from "vitest";
import {
  adaptFetchNotification,
  Notification,
  FetchNotificationType,
} from "../../domain/notifications/entities/Notification";

describe("Notification Entity", () => {
  it("should adapt a pending fetch notification correctly", () => {
    // Create a fetch notification with pending status
    const fetchNotification: FetchNotificationType = {
      jobId: "job-123",
      searchTerm: "Star Wars",
      progress: 25,
      total: 100,
      status: "pending",
      timestamp: 1623456789000,
    };

    // Adapt it to a Notification
    const notification = adaptFetchNotification(fetchNotification);

    // Check the properties
    expect(notification.id).toBe("job-123"); // ID should be the job ID
    expect(notification.type).toBe("info"); // Pending should be info type
    expect(notification.message).toContain('Fetching movies for "Star Wars"');
    expect(notification.data).toEqual(fetchNotification); // Data should contain the original fetch notification
  });

  it("should adapt a processing fetch notification correctly", () => {
    // Create a fetch notification with processing status
    const fetchNotification: FetchNotificationType = {
      jobId: "job-123",
      searchTerm: "Star Wars",
      progress: 50,
      total: 100,
      status: "processing",
      timestamp: 1623456789000,
    };

    // Adapt it to a Notification
    const notification = adaptFetchNotification(fetchNotification);

    // Check the properties
    expect(notification.id).toBe("job-123");
    expect(notification.type).toBe("info");
    expect(notification.message).toContain('Fetching movies for "Star Wars"');
    expect(notification.data).toEqual(fetchNotification);
  });

  it("should adapt a completed fetch notification correctly", () => {
    // Create a fetch notification with completed status
    const fetchNotification: FetchNotificationType = {
      jobId: "job-123",
      searchTerm: "Star Wars",
      progress: 100,
      total: 100,
      status: "completed",
      timestamp: 1623456789000,
    };

    // Adapt it to a Notification
    const notification = adaptFetchNotification(fetchNotification);

    // Check the properties
    expect(notification.id).toBe("job-123");
    expect(notification.type).toBe("success"); // Completed should be success type
    expect(notification.message).toContain(
      'Successfully fetched 100 movies for "Star Wars"'
    );
    expect(notification.data).toEqual(fetchNotification);
  });

  it("should adapt a failed fetch notification correctly", () => {
    // Create a fetch notification with failed status
    const fetchNotification: FetchNotificationType = {
      jobId: "job-123",
      searchTerm: "Star Wars",
      progress: 75,
      total: 100,
      status: "failed",
      timestamp: 1623456789000,
    };

    // Adapt it to a Notification
    const notification = adaptFetchNotification(fetchNotification);

    // Check the properties
    expect(notification.id).toBe("job-123");
    expect(notification.type).toBe("error"); // Failed should be error type
    expect(notification.message).toContain(
      'Failed to fetch movies for "Star Wars"'
    );
    expect(notification.data).toEqual(fetchNotification);
  });
});
