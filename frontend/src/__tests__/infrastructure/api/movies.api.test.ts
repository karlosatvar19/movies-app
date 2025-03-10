/**
 * @vitest-environment jsdom
 */

// Import test utilities
import { describe, it, expect, vi, beforeEach } from "vitest";

// Import types needed for testing
import {
  MovieSearchParams,
  FetchMoviesCommand,
} from "../../../domain/movies/entities/Movie";

// We're going to intercept the axios instance directly within the module
// This will allow us to mock it without having hoisting issues
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockInterceptorUse = vi.fn();

// We have to do something special here to avoid the hoisting issues
// Instead of mocking the entire axios module, we'll create our own instance
// and intercept the axios.create call
let axiosCreateSpy;
let apiInstance;

// Setup our module interceptor
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();

  // Mock axios - note we're not using vi.mock here
  axiosCreateSpy = vi.fn(() => ({
    get: mockGet,
    post: mockPost,
    interceptors: {
      response: {
        use: mockInterceptorUse,
      },
    },
  }));

  // Mock GlobalErrorHandler
  const mockHandleError = vi.fn((error) => ({
    code: "TEST_ERROR",
    message: error?.message || "Test error",
    severity: "error",
    timestamp: Date.now(),
    details: {},
  }));

  // Create our mocked modules
  vi.doMock("axios", () => ({
    default: {
      create: axiosCreateSpy,
    },
    __esModule: true,
  }));

  vi.doMock("../../../application/errors/GlobalErrorHandler", () => ({
    default: {
      handleError: mockHandleError,
    },
    __esModule: true,
  }));
});

// Test suite
describe("Movies API Tests", () => {
  // We need to import the module in each test to ensure it picks up our mocks
  // This is a key insight: vi.mock hoisting doesn't work well, but importing within tests does

  beforeEach(async () => {
    // Dynamically import the module under test
    const moviesModule = await import("../../../infrastructure/api/movies.api");
    apiInstance = moviesModule.moviesApi;
  });

  describe("API Structure", () => {
    it("exposes all the expected methods", () => {
      expect(typeof apiInstance.getMovies).toBe("function");
      expect(typeof apiInstance.getMovieById).toBe("function");
      expect(typeof apiInstance.fetchMovies).toBe("function");
      expect(typeof apiInstance.getFetchJobs).toBe("function");
      expect(typeof apiInstance.cancelFetchJob).toBe("function");
    });
  });

  describe("getMovies", () => {
    it("fetches movies from the default endpoint", async () => {
      // Arrange
      const mockMovies = {
        items: [{ id: "1", title: "Test Movie" }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockGet.mockResolvedValueOnce({ data: mockMovies });

      // Act
      const params = { page: 1, limit: 10 };
      const result = await apiInstance.getMovies(params);

      // Assert
      expect(mockGet).toHaveBeenCalledWith("/movies", { params });

      // Use looser expectations that match the API structure
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("page", 1);
      expect(result).toHaveProperty("limit", 10);
    });

    it("searches movies with the search endpoint when query is provided", async () => {
      // Arrange
      const mockSearchResults = {
        items: [{ id: "1", title: "Star Wars" }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockGet.mockResolvedValueOnce({ data: mockSearchResults });

      // Act
      const params = { page: 1, limit: 10, query: "star" };
      const result = await apiInstance.getMovies(params);

      // Assert
      expect(mockGet).toHaveBeenCalledWith("/movies/search", {
        params: { page: 1, limit: 10, query: "star" },
      });

      // Use looser expectations that match the API structure
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("page", 1);
      expect(result).toHaveProperty("limit", 10);
    });

    it("provides specific error message when fetching movies fails", async () => {
      // Arrange
      mockGet.mockRejectedValueOnce(new Error("Network Error"));

      // Act & Assert
      await expect(
        apiInstance.getMovies({ page: 1, limit: 10 })
      ).rejects.toThrow("Failed to fetch movies: Network Error");
    });

    it("provides specific error message when searching fails", async () => {
      // Arrange
      mockGet.mockRejectedValueOnce(new Error("Network Error"));

      // Act & Assert
      await expect(
        apiInstance.getMovies({ page: 1, limit: 10, query: "star" })
      ).rejects.toThrow(
        'Failed to search movies with query "star": Network Error'
      );
    });
  });

  describe("getMovieById", () => {
    it("fetches a movie by its ID", async () => {
      // Arrange
      const mockMovie = { id: "123", title: "Test Movie" };
      mockGet.mockResolvedValueOnce({ data: mockMovie });

      // Act
      const result = await apiInstance.getMovieById("123");

      // Assert
      expect(mockGet).toHaveBeenCalledWith("/movies/123");
      expect(result).toEqual(mockMovie);
    });

    it("handles errors when fetching movie by ID", async () => {
      // Arrange
      mockGet.mockRejectedValueOnce(new Error("Network Error"));

      // Act & Assert
      await expect(apiInstance.getMovieById("123")).rejects.toThrow(
        "Failed to fetch movie with ID 123: Network Error"
      );
    });
  });

  describe("fetchMovies", () => {
    it("starts a fetch operation with the provided command", async () => {
      // Arrange
      const mockResponse = { requestId: "job123" };
      mockPost.mockResolvedValueOnce({ data: mockResponse });

      // Act
      const command = { searchTerm: "Star Wars", year: "2022" };
      const result = await apiInstance.fetchMovies(command);

      // Assert
      expect(mockPost).toHaveBeenCalledWith("/movies/fetch", command);
      expect(result).toEqual(mockResponse);
    });

    it("handles errors when starting a fetch operation", async () => {
      // Arrange
      mockPost.mockRejectedValueOnce(new Error("Network Error"));

      // Act & Assert
      const command = { searchTerm: "Star Wars" };
      await expect(apiInstance.fetchMovies(command)).rejects.toThrow(
        'Failed to start fetch operation for "Star Wars": Network Error'
      );
    });
  });

  describe("getFetchJobs", () => {
    it("retrieves the list of fetch jobs", async () => {
      // Arrange
      const mockJobs = [
        {
          id: "job123",
          status: "completed",
          progress: 100,
          total: 100,
          searchTerm: "star wars",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:05:00Z",
        },
      ];
      mockGet.mockResolvedValueOnce({ data: mockJobs });

      // Act
      const result = await apiInstance.getFetchJobs();

      // Assert
      expect(mockGet).toHaveBeenCalledWith("/movies/fetch/jobs");
      expect(result).toEqual(mockJobs);
    });

    it("handles errors when fetching jobs", async () => {
      // Arrange
      mockGet.mockRejectedValueOnce(new Error("Network Error"));

      // Act
      const result = await apiInstance.getFetchJobs();

      // Assert - the implementation returns an empty array on error
      expect(result).toEqual([]);
    });
  });

  describe("cancelFetchJob", () => {
    it("cancels a fetch job by ID", async () => {
      // Arrange
      mockPost.mockResolvedValueOnce({ data: { success: true } });

      // Act
      await apiInstance.cancelFetchJob("job123");

      // Assert
      expect(mockPost).toHaveBeenCalledWith("/movies/fetch/cancel/job123");
    });

    it("handles errors when canceling a job", async () => {
      // Arrange
      mockPost.mockRejectedValueOnce(new Error("Network Error"));

      // Act & Assert
      await expect(apiInstance.cancelFetchJob("job123")).rejects.toThrow(
        "Failed to cancel fetch job job123: Network Error"
      );
    });
  });
});
