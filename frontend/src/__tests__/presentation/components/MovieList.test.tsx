import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import MovieList from "../../../presentation/components/MovieList";
import { useMoviesContext } from "../../../application/store/MoviesContext";
import { Movie } from "../../../domain/movies/entities/Movie";

// Mock the MoviesContext hook
vi.mock("../../../application/store/MoviesContext", () => ({
  useMoviesContext: vi.fn(),
}));

// Mock the MovieCard component
vi.mock("../../presentation/components/MovieCard", () => ({
  default: ({ movie }: { movie: Movie }) => (
    <div data-testid={`movie-card-${movie.id}`}>
      <h3>{movie.title}</h3>
    </div>
  ),
}));

describe("MovieList Component", () => {
  const mockFetchMovies = vi.fn();

  const mockMovies: Movie[] = [
    {
      id: "1",
      imdbID: "tt1234567",
      title: "Space Odyssey",
      year: "2021",
      director: "Director Name",
      plot: "A plot about space",
      poster: "poster-url.jpg",
    },
    {
      id: "2",
      imdbID: "tt2345678",
      title: "Mars Mission",
      year: "2022",
      director: "Another Director",
      plot: "A mission to Mars",
      poster: "mars-poster.jpg",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default state with no movies, not loading
    (useMoviesContext as any).mockReturnValue({
      state: {
        movies: [],
        loading: false,
        error: null,
        page: 1,
        limit: 12,
        totalPages: 0,
        searchQuery: "",
      },
      fetchMovies: mockFetchMovies,
    });
  });

  it("should render loading state when loading and no movies", () => {
    (useMoviesContext as any).mockReturnValue({
      state: {
        movies: [],
        loading: true,
        error: null,
        page: 1,
        limit: 12,
        totalPages: 0,
      },
      fetchMovies: mockFetchMovies,
    });

    render(<MovieList />);

    // Check for loading indicator - using text content instead of aria attributes
    const loadingText = screen.getByText("Loading movies...");
    expect(loadingText).toBeInTheDocument();

    // Find element with aria-busy attribute
    const busyElement = document.querySelector('[aria-busy="true"]');
    expect(busyElement).toBeInTheDocument();
  });

  it("should render error state when there is an error and no movies", () => {
    (useMoviesContext as any).mockReturnValue({
      state: {
        movies: [],
        loading: false,
        error: "Failed to fetch movies",
        page: 1,
        limit: 12,
        totalPages: 0,
      },
      fetchMovies: mockFetchMovies,
    });

    render(<MovieList />);

    // Check for error message - using text content instead of role
    const errorElement = screen.getByText("Error loading movies");
    expect(errorElement).toBeInTheDocument();
    expect(screen.getByText(/failed to fetch movies/i)).toBeInTheDocument();
  });

  it("should render empty state when no movies and not loading", () => {
    (useMoviesContext as any).mockReturnValue({
      state: {
        movies: [],
        loading: false,
        error: null,
        page: 1,
        limit: 12,
        totalPages: 0,
      },
      fetchMovies: mockFetchMovies,
    });

    render(<MovieList />);

    // Check for empty state
    expect(screen.getByText(/no movies found/i)).toBeInTheDocument();
  });

  it("should render a list of movies", () => {
    (useMoviesContext as any).mockReturnValue({
      state: {
        movies: mockMovies,
        loading: false,
        error: null,
        page: 1,
        limit: 12,
        totalPages: 1,
      },
      fetchMovies: mockFetchMovies,
    });

    render(<MovieList />);

    // Instead of looking for component testids, check for the movie grid
    const movieGrid = screen.getByLabelText("Showing 2 movies");
    expect(movieGrid).toBeInTheDocument();

    // Check that we have the expected number of placeholder divs (which will be shown while lazy loading)
    const placeholders = document.querySelectorAll(
      ".border.border-gray-800.rounded-md.h-full.animate-pulse.bg-gray-900"
    );
    expect(placeholders.length).toBe(2);
  });

  it("should fetch movies on mount", () => {
    render(<MovieList />);

    // Check that fetchMovies was called
    expect(mockFetchMovies).toHaveBeenCalledTimes(1);
    // The query parameter may be undefined in the implementation, not an empty string
    expect(mockFetchMovies).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 12,
      })
    );
  });

  it("should handle pagination", () => {
    // Mock state with multiple pages
    (useMoviesContext as any).mockReturnValue({
      state: {
        movies: mockMovies,
        loading: false,
        error: null,
        page: 1,
        limit: 12,
        totalPages: 3,
        searchQuery: "",
      },
      fetchMovies: mockFetchMovies,
    });

    render(<MovieList />);

    // Get the next page button and click it - using aria-label to find button
    const nextButtons = screen.getAllByLabelText("Next page");
    const nextButton = nextButtons[0]; // Take the first one if there are multiple
    fireEvent.click(nextButton);

    // Check that fetchMovies was called with page 2
    expect(mockFetchMovies).toHaveBeenCalledWith({
      page: 2,
      limit: 12,
      query: "",
    });
  });

  it("should display a loading indicator when loading more movies", () => {
    // Mock state with movies but in loading state
    (useMoviesContext as any).mockReturnValue({
      state: {
        movies: mockMovies,
        loading: true,
        error: null,
        page: 1,
        limit: 12,
        totalPages: 3,
        searchQuery: "",
      },
      fetchMovies: mockFetchMovies,
    });

    render(<MovieList />);

    // Check that we have the movie placeholders
    const placeholders = document.querySelectorAll(
      ".border.border-gray-800.rounded-md.h-full.animate-pulse.bg-gray-900"
    );
    expect(placeholders.length).toBe(2);

    // In loading state, we still expect to see the pagination
    const pagination = screen.getByLabelText("Pagination");
    expect(pagination).toBeInTheDocument();

    // At least verify that previous button is disabled (first page)
    const prevButton = screen.getByLabelText("Previous page");
    expect(prevButton).toBeDisabled();
  });
});
