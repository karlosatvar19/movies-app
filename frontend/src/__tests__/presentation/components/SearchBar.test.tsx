import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SearchBar from "../../../presentation/components/SearchBar";
import { useMoviesContext } from "../../../application/store/MoviesContext";

// Mock the MoviesContext hook
vi.mock("../../../application/store/MoviesContext", () => ({
  useMoviesContext: vi.fn(),
}));

describe("SearchBar Component", () => {
  // Setup the mock implementation for useMoviesContext
  const mockSearchMovies = vi.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock implementation of useMoviesContext
    (useMoviesContext as any).mockReturnValue({
      searchMovies: mockSearchMovies,
    });
  });

  it("should render the search input and button", () => {
    render(<SearchBar />);

    // Check if the search input is rendered
    const searchInput = screen.getByTestId("search-input");
    expect(searchInput).toBeInTheDocument();

    // Check if the search button is rendered
    const searchButton = screen.getByTestId("search-button");
    expect(searchButton).toBeInTheDocument();
  });

  it("should update search query when typing in the input", () => {
    render(<SearchBar />);

    // Get the search input
    const searchInput = screen.getByTestId("search-input");

    // Simulate typing in the input
    fireEvent.change(searchInput, { target: { value: "Star Wars" } });

    // Check if the input value is updated
    expect(searchInput).toHaveValue("Star Wars");
  });

  it("should call searchMovies when the form is submitted", () => {
    render(<SearchBar />);

    // Get the search input and button
    const searchInput = screen.getByTestId("search-input");
    const searchForm = screen.getByRole("search");

    // Type a search query
    fireEvent.change(searchInput, { target: { value: "Interstellar" } });

    // Submit the form
    fireEvent.submit(searchForm);

    // Check if searchMovies was called with the correct query
    expect(mockSearchMovies).toHaveBeenCalledWith("Interstellar");
  });

  it("should call searchMovies when the search button is clicked", () => {
    render(<SearchBar />);

    // Get the search input and button
    const searchInput = screen.getByTestId("search-input");
    const searchButton = screen.getByTestId("search-button");

    // Type a search query
    fireEvent.change(searchInput, { target: { value: "Gravity" } });

    // Click the search button
    fireEvent.click(searchButton);

    // Check if searchMovies was called with the correct query
    expect(mockSearchMovies).toHaveBeenCalledWith("Gravity");
  });

  it('should show "Press Enter to search" hint when query is not empty', () => {
    render(<SearchBar />);

    // Get the search input
    const searchInput = screen.getByTestId("search-input");

    // Type a search query
    fireEvent.change(searchInput, { target: { value: "Mars" } });

    // Check for the hint text
    const hintText = screen.getByText("Press Enter to search");
    expect(hintText).toBeInTheDocument();
  });

  it("should show default hint when search query is empty", () => {
    render(<SearchBar />);

    // Check for the default hint text
    const defaultHint = screen.getByText("Type to search for movies");
    expect(defaultHint).toBeInTheDocument();
  });

  it("should have proper accessibility attributes", () => {
    render(<SearchBar />);

    // Check for proper aria labels
    const searchInput = screen.getByLabelText(
      "Search movies by title, director, or plot"
    );
    expect(searchInput).toBeInTheDocument();

    const searchButton = screen.getByLabelText("Search");
    expect(searchButton).toBeInTheDocument();

    // Check for aria-live region for hints
    const liveRegion = screen.getByText("Type to search for movies");
    // The aria-live is on the div element itself
    expect(liveRegion.closest('div[aria-live="polite"]')).toBeInTheDocument();
  });
});
