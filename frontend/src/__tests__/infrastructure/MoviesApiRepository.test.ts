import { describe, it, expect, vi, beforeEach } from "vitest";
import moviesRepository from "../../infrastructure/repositories/MoviesApiRepository";
import { moviesApi } from "../../infrastructure/api/movies.api";

// Mock the API client
vi.mock("../../infrastructure/api/movies.api", () => ({
  moviesApi: {
    getMovies: vi.fn(),
    getMovieById: vi.fn(),
    fetchMovies: vi.fn(),
    getFetchJobs: vi.fn(),
    cancelFetchJob: vi.fn(),
  },
}));

describe("MoviesApiRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMovies", () => {
    it("should fetch movies with default pagination", async () => {
      // Mock API response
      const mockResponse = {
        items: [{ id: "1", title: "Test Movie" }],
        total: 1,
        totalPages: 1,
      };

      (moviesApi.getMovies as any).mockResolvedValueOnce(mockResponse);

      const result = await moviesRepository.getMovies({ page: 1, limit: 12 });

      expect(moviesApi.getMovies).toHaveBeenCalledWith({
        page: 1,
        limit: 12,
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe("Test Movie");
    });

    it("should fetch movies with custom pagination", async () => {
      // Mock API response
      const mockResponse = {
        items: [{ id: "1", title: "Test Movie" }],
        total: 1,
        totalPages: 1,
      };

      (moviesApi.getMovies as any).mockResolvedValueOnce(mockResponse);

      const result = await moviesRepository.getMovies({
        page: 2,
        limit: 20,
        query: "space",
      });

      expect(moviesApi.getMovies).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        query: "space",
      });
      expect(result.items).toHaveLength(1);
    });
  });

  describe("fetchMovies", () => {
    it("should start a new fetch operation", async () => {
      // Mock API response
      const mockResponse = {
        requestId: "abc123",
        status: "pending",
      };

      (moviesApi.fetchMovies as any).mockResolvedValueOnce(mockResponse);

      const result = await moviesRepository.fetchMovies({
        searchTerm: "interstellar",
      });

      expect(moviesApi.fetchMovies).toHaveBeenCalledWith({
        searchTerm: "interstellar",
      });
      expect(result.requestId).toBe("abc123");
    });
  });

  describe("cancelFetchJob", () => {
    it("should cancel a fetch job", async () => {
      // Mock API response
      (moviesApi.cancelFetchJob as any).mockResolvedValueOnce({
        success: true,
      });

      await moviesRepository.cancelFetchJob("abc123");

      expect(moviesApi.cancelFetchJob).toHaveBeenCalledWith("abc123");
    });
  });
});
