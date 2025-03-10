import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  Movie,
  PaginatedMoviesResponse,
  FetchJobStatus,
} from "../../domain/movies/entities/Movie";
import moviesRepository from "../../infrastructure/repositories/MoviesApiRepository";
import websocketService from "../../infrastructure/websocket/websocket.service";
import { FetchProgressEvent } from "../../infrastructure/websocket/websocket.types";
import { useMultiWebSocketEvents } from "../hooks/useWebSocket";

// State
interface MoviesState {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  searchQuery: string;
  fetchJobs: FetchJobStatus[];
  activeFetchJob: FetchProgressEvent | null;
}

// Actions
type MoviesAction =
  | {
      type: "FETCH_MOVIES_REQUEST";
      payload: { page: number; limit: number; query?: string };
    }
  | { type: "FETCH_MOVIES_SUCCESS"; payload: PaginatedMoviesResponse }
  | { type: "FETCH_MOVIES_FAILURE"; payload: string }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "FETCH_JOBS_SUCCESS"; payload: FetchJobStatus[] }
  | { type: "UPDATE_FETCH_PROGRESS"; payload: FetchProgressEvent }
  | { type: "FETCH_COMPLETED"; payload: { jobId: string } }
  | { type: "FETCH_ERROR"; payload: { jobId: string; error: string } }
  | { type: "CLEAR_FETCH_JOB" };

// Initial state
const initialState: MoviesState = {
  movies: [],
  loading: false,
  error: null,
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
  searchQuery: "",
  fetchJobs: [],
  activeFetchJob: null,
};

// Reducer
const moviesReducer = (
  state: MoviesState,
  action: MoviesAction
): MoviesState => {
  switch (action.type) {
    case "FETCH_MOVIES_REQUEST":
      return {
        ...state,
        loading: true,
        error: null,
        page: action.payload.page || 1,
        limit: action.payload.limit || 12,
        searchQuery: action.payload.query?.trim() || state.searchQuery,
      };
    case "FETCH_MOVIES_SUCCESS":
      return {
        ...state,
        loading: false,
        error: null,
        movies: Array.isArray(action.payload.items) ? action.payload.items : [],
        total:
          typeof action.payload.total === "number" ? action.payload.total : 0,
        totalPages:
          typeof action.payload.totalPages === "number"
            ? action.payload.totalPages
            : 0,
      };
    case "FETCH_MOVIES_FAILURE":
      return {
        ...state,
        loading: false,
        error: action.payload || "An unknown error occurred",
        movies: state.movies || [],
      };
    case "SET_SEARCH_QUERY":
      return {
        ...state,
        searchQuery: action.payload || "",
      };
    case "FETCH_JOBS_SUCCESS":
      return {
        ...state,
        fetchJobs: Array.isArray(action.payload) ? action.payload : [],
      };
    case "UPDATE_FETCH_PROGRESS":
      if (!action.payload) {
        return state;
      }
      return {
        ...state,
        activeFetchJob: action.payload,
        fetchJobs: Array.isArray(state.fetchJobs)
          ? state.fetchJobs.map((job) =>
              job.id === action.payload?.jobId
                ? {
                    ...job,
                    progress: action.payload.progress,
                    status: action.payload.status,
                  }
                : job
            )
          : [],
      };
    case "FETCH_COMPLETED":
      return {
        ...state,
        activeFetchJob:
          state.activeFetchJob?.jobId === action.payload?.jobId
            ? null
            : state.activeFetchJob,
        fetchJobs: Array.isArray(state.fetchJobs)
          ? state.fetchJobs.filter((job) => job.id !== action.payload?.jobId)
          : [],
      };
    case "FETCH_ERROR":
      return {
        ...state,
        error: action.payload?.error || "An error occurred during fetch",
      };
    case "CLEAR_FETCH_JOB":
      return {
        ...state,
        activeFetchJob: null,
      };
    default:
      return state;
  }
};

// Context
const MoviesContext = createContext<{
  state: MoviesState;
  dispatch: React.Dispatch<MoviesAction>;
  fetchMovies: (params: {
    page: number;
    limit: number;
    query?: string;
  }) => Promise<void>;
  searchMovies: (query: string) => Promise<void>;
  fetchNewMovies: (searchTerm: string, year?: string) => Promise<string>;
  cancelFetch: (jobId: string) => Promise<void>;
}>({
  state: initialState,
  dispatch: () => {},
  fetchMovies: async () => {},
  searchMovies: async () => {},
  fetchNewMovies: async () => "",
  cancelFetch: async () => {},
});

// Provider Component
export const MoviesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(moviesReducer, initialState);
  const lastApiCallTime = useRef<number>(0);
  const apiCallThrottle = 1000; // 1 second between API calls

  // Set up WebSocket event handlers
  const eventCallbacks = [
    {
      event: "fetch:progress" as const,
      callback: (data: FetchProgressEvent) => {
        dispatch({ type: "UPDATE_FETCH_PROGRESS", payload: data });
      },
    },
    {
      event: "fetch:completed" as const,
      callback: (data: {
        jobId: string;
        movies: number;
        searchTerm: string;
      }) => {
        // First update the progress to ensure we show 100% completion
        dispatch({
          type: "UPDATE_FETCH_PROGRESS",
          payload: {
            jobId: data.jobId,
            progress: state.activeFetchJob?.total || 0,
            total: state.activeFetchJob?.total || 0,
            searchTerm: data.searchTerm,
            status: "completed",
            timestamp: Date.now(),
          },
        });

        // Refresh the movie list to show new movies
        setTimeout(() => {
          // Check if we've fetched recently to avoid duplicate calls
          const now = Date.now();
          if (now - lastApiCallTime.current > apiCallThrottle) {
            lastApiCallTime.current = now;

            // Refresh movies list after completion - no query parameter
            fetchMovies({
              page: 1, // Always go to first page after fetch completion
              limit: state.limit,
            });
          }
        }, 1000);

        // After a delay, mark the job as completed to trigger cleanup
        setTimeout(() => {
          dispatch({ type: "FETCH_COMPLETED", payload: { jobId: data.jobId } });
        }, 5000); // Same timeout as the auto-dismiss in notifications
      },
    },
    {
      event: "fetch:error" as const,
      callback: (data: { jobId: string; error: string }) => {
        dispatch({ type: "FETCH_ERROR", payload: data });
      },
    },
  ];

  // Use the optimized WebSocket hook to listen for multiple events
  useMultiWebSocketEvents(eventCallbacks);

  // Connect to WebSocket on component mount
  useEffect(() => {
    // Ensure WebSocket connection
    websocketService.connect();

    // Load initial fetch jobs
    loadFetchJobs();
  }, []);

  // Fetch movies using the repository - memoized to avoid recreating on each render
  const fetchMovies = useCallback(
    async ({
      page = 1,
      limit = 12,
      query,
    }: {
      page: number;
      limit: number;
      query?: string;
    }) => {
      try {
        // Update last API call time
        lastApiCallTime.current = Date.now();

        dispatch({
          type: "FETCH_MOVIES_REQUEST",
          payload: { page, limit, query },
        });

        const response = await moviesRepository.getMovies({
          page,
          limit,
          query,
        });

        // Ensure response has proper structure and default values if properties are missing
        const safeResponse = {
          items: Array.isArray(response.items) ? response.items : [],
          total: typeof response.total === "number" ? response.total : 0,
          page: typeof response.page === "number" ? response.page : page,
          limit: typeof response.limit === "number" ? response.limit : limit,
          totalPages:
            typeof response.totalPages === "number" ? response.totalPages : 0,
        };

        dispatch({ type: "FETCH_MOVIES_SUCCESS", payload: safeResponse });
      } catch (error) {
        dispatch({
          type: "FETCH_MOVIES_FAILURE",
          payload:
            error instanceof Error ? error.message : "Failed to fetch movies",
        });
      }
    },
    []
  );

  // Search movies with query - memoized and throttled
  const searchMovies = useCallback(
    async (query: string) => {
      // Check if we've called recently to avoid duplicate calls
      const now = Date.now();
      if (now - lastApiCallTime.current < apiCallThrottle) {
        return;
      }

      // If query is empty or just whitespace, use the regular fetch without a query parameter
      const trimmedQuery = query?.trim() || "";
      dispatch({ type: "SET_SEARCH_QUERY", payload: trimmedQuery });

      // Update last API call time
      lastApiCallTime.current = now;

      await fetchMovies({
        page: 1,
        limit: state.limit,
        query: trimmedQuery || undefined, // Only pass query if it has content
      });
    },
    [fetchMovies, state.limit]
  );

  // Start a new fetch operation - memoized
  const fetchNewMovies = useCallback(
    async (searchTerm: string, year?: string): Promise<string> => {
      try {
        const response = await moviesRepository.fetchMovies({
          searchTerm,
          year,
        });
        await loadFetchJobs(); // Refresh job list
        return response.requestId;
      } catch (error) {
        dispatch({
          type: "FETCH_MOVIES_FAILURE",
          payload:
            error instanceof Error
              ? error.message
              : "Failed to start fetch operation",
        });
        throw error;
      }
    },
    []
  );

  // Load all fetch jobs - memoized
  const loadFetchJobs = useCallback(async () => {
    try {
      const jobs = await moviesRepository.getFetchJobs();
      dispatch({ type: "FETCH_JOBS_SUCCESS", payload: jobs });
    } catch (error) {
      console.error("Failed to load fetch jobs:", error);
    }
  }, []);

  // Cancel a fetch job - memoized
  const cancelFetch = useCallback(
    async (jobId: string) => {
      try {
        await moviesRepository.cancelFetchJob(jobId);
        await loadFetchJobs(); // Refresh job list
      } catch (error) {
        console.error("Failed to cancel fetch job:", error);
      }
    },
    [loadFetchJobs]
  );

  return (
    <MoviesContext.Provider
      value={{
        state,
        dispatch,
        fetchMovies,
        searchMovies,
        fetchNewMovies,
        cancelFetch,
      }}
    >
      {children}
    </MoviesContext.Provider>
  );
};

// Custom hook for using the movies context
export const useMoviesContext = () => {
  const context = useContext(MoviesContext);
  if (!context) {
    throw new Error("useMoviesContext must be used within a MoviesProvider");
  }
  return context;
};
