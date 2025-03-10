import React, { useEffect, useCallback, memo, useRef } from "react";
import { useMoviesContext } from "../../application/store/MoviesContext";
import { Movie } from "../../domain/movies/entities/Movie";
import Pagination from "./Pagination";

// Memoize MovieCard component for performance
const MovieCard = React.lazy(() => import("./MovieCard"));

// Memoize to prevent re-rendering when props don't change
const MemoizedMovieCard = React.memo((props: { movie: Movie }) => (
  <React.Suspense
    fallback={
      <div className="border border-gray-800 rounded-md h-full animate-pulse bg-gray-900"></div>
    }
  >
    <MovieCard {...props} />
  </React.Suspense>
));

/**
 * MovieList component that displays a grid of movie cards
 * with pagination controls and loading/error states.
 */
const MovieList: React.FC = () => {
  // Track if initial fetch has been done
  const initialFetchDone = useRef(false);

  // Get context with fallback for state
  const contextValue = useMoviesContext();

  // Safety check - if context is not available yet, render a loading state
  if (!contextValue) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <span>Initializing movie context...</span>
      </div>
    );
  }

  // Ensure we have a valid state object with defaults
  const state = contextValue.state || {
    movies: [],
    loading: false,
    error: null,
    page: 1,
    limit: 12,
    totalPages: 0,
    searchQuery: "",
  };

  // Use safe destructuring with explicit defaults for all values
  const {
    movies = [],
    loading = false,
    error = null,
    page = 1,
    limit = 12,
    totalPages = 0,
  } = state;

  // Ensure movies is always an array
  const safeMovies = Array.isArray(movies) ? movies : [];

  const fetchMovies = contextValue?.fetchMovies || (async () => {});

  // Use useCallback to memoize fetch functions
  const fetchMoviesPage = useCallback(
    (newPage: number) => {
      if (fetchMovies) {
        fetchMovies({
          page: newPage,
          limit,
          query: state.searchQuery,
        });
      }
    },
    [fetchMovies, limit, state?.searchQuery]
  );

  // Initialize data on first render
  useEffect(() => {
    // If movies array is empty and not already loading/errored
    if (
      safeMovies.length === 0 &&
      !loading &&
      !error &&
      !initialFetchDone.current
    ) {
      // Mark that we've done the initial fetch to prevent multiple attempts
      initialFetchDone.current = true;

      // Initial data fetch without query
      fetchMovies({
        page: 1,
        limit: limit || 12,
      });
    }
    // We want this effect to run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means it only runs once when mounted

  // Loading state
  if (loading && safeMovies.length === 0) {
    return (
      <div
        className="flex flex-col justify-center items-center min-h-[300px]"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <span>Loading movies...</span>
      </div>
    );
  }

  // Error state
  if (error && safeMovies.length === 0) {
    return (
      <div
        className="flex flex-col justify-center items-center min-h-[200px] text-red-500"
        aria-live="assertive"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="text-center">
          <h3 className="text-lg font-medium">Error loading movies</h3>
          <p className="mt-1">
            {typeof error === "string" ? error : "An unexpected error occurred"}
          </p>
        </div>
      </div>
    );
  }

  // Empty state (no results)
  if (safeMovies.length === 0) {
    return (
      <div
        className="flex flex-col justify-center items-center min-h-[300px] text-gray-400"
        aria-live="polite"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
          />
        </svg>
        <h3 className="text-xl font-medium text-gray-300 mb-2">
          No movies found
        </h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto text-center">
          {state.searchQuery
            ? `No movies matching "${state.searchQuery}" were found.`
            : "There are no movies available yet. Try fetching some space movies using the button above."}
        </p>
        {state.searchQuery && (
          <button
            onClick={() => {
              if (contextValue?.searchMovies) {
                contextValue.searchMovies("");
              }
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Clear Search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Movie grid */}
      <div>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-fr"
          aria-label={`Showing ${safeMovies.length} movies${
            state?.searchQuery ? ` for "${state.searchQuery}"` : ""
          }`}
        >
          {safeMovies.map((movie: Movie) => (
            <MemoizedMovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </div>

      {/* Pagination Component */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={fetchMoviesPage}
      />
    </div>
  );
};

export default MovieList;
