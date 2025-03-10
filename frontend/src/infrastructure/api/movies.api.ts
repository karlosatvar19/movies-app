import axios, { AxiosError, AxiosInstance } from "axios";
import {
  Movie,
  PaginatedMoviesResponse,
  MovieSearchParams,
  FetchMoviesCommand,
  FetchJobStatus,
} from "../../domain/movies/entities/Movie";
import globalErrorHandler from "../../application/errors/GlobalErrorHandler";

// Factory function to create and configure the axios client
export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const apiError = globalErrorHandler.handleError(error);
      console.error(
        `API Error [${apiError.code}]:`,
        apiError.message,
        apiError.details
      );
      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

// Track API call times to prevent excessive calls
let lastApiCallTimes: Record<string, number> = {};
const API_THROTTLE_MS = 500; // Minimum time between identical API calls

// Helper function to create a cache key for an API call
const createCacheKey = (endpoint: string, params: any): string => {
  return `${endpoint}_${JSON.stringify(params)}`;
};

// Helper function to check if a call should be throttled
const shouldThrottle = (cacheKey: string): boolean => {
  const now = Date.now();
  const lastCallTime = lastApiCallTimes[cacheKey] || 0;
  const timeSinceLastCall = now - lastCallTime;

  if (timeSinceLastCall < API_THROTTLE_MS) {
    return true;
  }

  lastApiCallTimes[cacheKey] = now;
  return false;
};

// API Service methods
export const moviesApi = {
  // Get paginated movies
  getMovies: async ({
    page = 1,
    limit = 12,
    query,
  }: MovieSearchParams): Promise<PaginatedMoviesResponse> => {
    try {
      const params: Record<string, string | number> = { page, limit };
      const endpoint =
        query && query.trim() !== "" ? "/movies/search" : "/movies";

      // Create cache key for this specific API call
      const cacheKey = createCacheKey(endpoint, { ...params, query });

      // Check if we should throttle this call
      if (shouldThrottle(cacheKey)) {
        // Return an empty result instead of making the API call
        return {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      let response;
      if (query && query.trim() !== "") {
        response = await apiClient.get("/movies/search", {
          params: { ...params, query },
        });
      } else {
        response = await apiClient.get("/movies", { params });
      }

      // Validate and normalize response
      const responseData = response.data || {};

      // Create a safely normalized response with defaults for all fields
      const normalizedResponse: PaginatedMoviesResponse = {
        items: Array.isArray(responseData.movies)
          ? responseData.movies
          : Array.isArray(responseData)
          ? responseData
          : [],
        total:
          typeof responseData.total === "number"
            ? responseData.total
            : Array.isArray(responseData.movies)
            ? responseData.movies.length
            : Array.isArray(responseData)
            ? responseData.length
            : 0,
        page: typeof responseData.page === "number" ? responseData.page : page,
        limit:
          typeof responseData.limit === "number" ? responseData.limit : limit,
        totalPages:
          typeof responseData.totalPages === "number"
            ? responseData.totalPages
            : typeof responseData.total === "number"
            ? Math.ceil(responseData.total / limit)
            : 1,
      };

      return normalizedResponse;
    } catch (error) {
      console.error("Error in getMovies API call:", error);
      if (error instanceof Error) {
        if (query) {
          throw new Error(
            `Failed to search movies with query "${query}": ${error.message}`
          );
        } else {
          throw new Error(`Failed to fetch movies: ${error.message}`);
        }
      }
      throw error;
    }
  },

  // Get a single movie by ID
  getMovieById: async (id: string): Promise<Movie> => {
    try {
      const response = await apiClient.get(`/movies/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to fetch movie with ID ${id}: ${error.message}`
        );
      }
      throw error;
    }
  },

  // Start a background fetch operation for new movies
  fetchMovies: async (
    command: FetchMoviesCommand
  ): Promise<{ requestId: string }> => {
    try {
      const response = await apiClient.post("/movies/fetch", command);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to start fetch operation for "${command.searchTerm}": ${error.message}`
        );
      }
      throw error;
    }
  },

  // Get all fetch job statuses
  getFetchJobs: async (): Promise<FetchJobStatus[]> => {
    try {
      const response = await apiClient.get("/movies/fetch/jobs");

      // Handle different response structures
      if (Array.isArray(response.data)) {
        return response.data;
      }

      // Handle case where API returns {activeJobs: ["id1", "id2"]} instead of array of job objects
      if (
        response.data &&
        response.data.activeJobs &&
        Array.isArray(response.data.activeJobs)
      ) {
        // Convert job IDs to job status objects with minimal info
        return response.data.activeJobs.map((jobId: string) => ({
          id: jobId,
          status: "processing",
          progress: 0,
          total: 0,
          searchTerm: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      }

      // Default to empty array if response doesn't match expected formats
      return [];
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Failed to get fetch jobs: ${error.message}`);
      }
      return [];
    }
  },

  // Cancel a running fetch job
  cancelFetchJob: async (requestId: string): Promise<void> => {
    try {
      await apiClient.post(`/movies/fetch/cancel/${requestId}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to cancel fetch job ${requestId}: ${error.message}`
        );
      }
      throw error;
    }
  },
};

export default moviesApi;
