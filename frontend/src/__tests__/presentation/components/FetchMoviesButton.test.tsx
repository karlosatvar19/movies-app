import React, { createContext } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { FetchMoviesButton } from "../../../presentation/components";

// Create a mock function that we can reference directly
const mockFetchNewMovies = vi.fn().mockImplementation((search, year) => {
  return Promise.resolve({ success: true });
});

// Mock context state
const defaultMockContextValue = {
  movies: [],
  isLoading: false,
  isFetchInProgress: false,
  fetchProgress: null,
  error: null,
  fetchNewMovies: mockFetchNewMovies,
  setError: vi.fn(),
  clearError: vi.fn(),
};

// Create a mock context for testing
const MockMoviesContext = createContext(defaultMockContextValue);

// Create a wrapper component to provide the context with controlled values
function TestWrapper({ contextValue = {}, children }) {
  const mockValue = { ...defaultMockContextValue, ...contextValue };
  return (
    <MockMoviesContext.Provider value={mockValue}>
      {children}
    </MockMoviesContext.Provider>
  );
}

// Mock the MoviesContext hook to avoid the need to mock React's useState
vi.mock("../../../application/store/MoviesContext", async () => {
  return {
    useMoviesContext: () => {
      // Return the mock context value
      return React.useContext(MockMoviesContext);
    },
  };
});

describe("FetchMoviesButton Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchNewMovies.mockClear();
  });

  it("should render the fetch button", () => {
    render(
      <TestWrapper>
        <FetchMoviesButton />
      </TestWrapper>
    );

    // Find button using data-testid
    const button = screen.getByTestId("fetch-movies-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Fetch New Movies");
  });

  it("should open the fetch form when button is clicked", () => {
    render(
      <TestWrapper>
        <FetchMoviesButton />
      </TestWrapper>
    );

    // Find and click the button
    const button = screen.getByTestId("fetch-movies-button");
    fireEvent.click(button);

    // Check if form header appears - use a more specific selector to avoid ambiguity
    const formHeader = screen.getByRole("heading", {
      name: "Fetch New Movies",
    });
    expect(formHeader).toBeInTheDocument();

    // Check if form elements appear
    expect(screen.getByText("Search Term (required)")).toBeInTheDocument();

    // Use getAllByText for elements that might appear multiple times
    const yearLabels = screen.getAllByText(/year/i);
    expect(yearLabels.length).toBeGreaterThan(0);

    // Look for the buttons by their roles
    expect(screen.getByText("Cancel")).toBeInTheDocument();

    // Find the submit button
    const submitButton = screen.getByRole("button", { name: "Start Fetch" });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveTextContent("Start Fetch");
  });

  it("should submit the form and call fetchNewMovies", async () => {
    render(
      <TestWrapper>
        <FetchMoviesButton />
      </TestWrapper>
    );

    // Open the form
    const button = screen.getByTestId("fetch-movies-button");
    fireEvent.click(button);

    // Fill out the form - find inputs by data-testid
    const searchInput = screen.getByTestId("fetch-search-input");
    fireEvent.change(searchInput, { target: { value: "mars" } });

    const yearInput = screen.getByTestId("fetch-year-input");
    fireEvent.change(yearInput, { target: { value: "2022" } });

    // Submit the form
    await act(async () => {
      const submitButton = screen.getByRole("button", { name: "Start Fetch" });
      fireEvent.click(submitButton);
    });

    // Check that fetchNewMovies was called with the right params
    expect(mockFetchNewMovies).toHaveBeenCalledWith("mars", "2022");
  });

  it("should show validation errors for empty search term", async () => {
    render(
      <TestWrapper>
        <FetchMoviesButton />
      </TestWrapper>
    );

    // Open the form
    const button = screen.getByTestId("fetch-movies-button");
    fireEvent.click(button);

    // Clear the search input
    const searchInput = screen.getByTestId("fetch-search-input");
    fireEvent.change(searchInput, { target: { value: "" } });

    // Submit with empty search term
    await act(async () => {
      const submitButton = screen.getByRole("button", { name: "Start Fetch" });
      fireEvent.click(submitButton);
    });

    // Look for the error message div
    const errorMessage = screen.getByText("Please enter a search term");
    expect(errorMessage).toBeInTheDocument();
    expect(mockFetchNewMovies).not.toHaveBeenCalled();
  });

  it("should show loading state when isLoading is true", async () => {
    // Create a mock that doesn't resolve immediately to keep the loading state active
    const fetchPromise = new Promise<void>((resolve) => {
      // This promise will never resolve during the test, keeping the loading state active
      setTimeout(resolve, 10000);
    });

    // Mock the fetchNewMovies to trigger loading but not complete during the test
    const mockFetchWithLoading = vi.fn().mockImplementation(() => {
      return fetchPromise;
    });

    render(
      <TestWrapper
        contextValue={{
          fetchNewMovies: mockFetchWithLoading,
        }}
      >
        <FetchMoviesButton />
      </TestWrapper>
    );

    // First, click to open the modal
    const fetchButton = screen.getByTestId("fetch-movies-button");
    fireEvent.click(fetchButton);

    // Now we should see the form modal
    const searchInput = screen.getByTestId("fetch-search-input");
    expect(searchInput).toBeInTheDocument();

    // Fill in the search input to enable form submission
    fireEvent.change(searchInput, { target: { value: "test search" } });

    // Submit the form which should trigger loading state
    const form = document.querySelector("form");
    fireEvent.submit(form);

    // Now the button should be in loading state (disabled with "Fetching..." text)
    // Find the submit button specifically by both type and disabled attribute
    const submitButton = document.querySelector(
      'button[type="submit"][disabled]'
    );
    expect(submitButton).not.toBeNull();
    expect(submitButton).toBeDisabled();

    // Check if the text includes "Fetching"
    expect(submitButton.textContent).toContain("Fetching");

    // Check if the loading spinner exists
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should use default year value when year is not provided", async () => {
    render(
      <TestWrapper>
        <FetchMoviesButton />
      </TestWrapper>
    );

    // Open the form
    const button = screen.getByTestId("fetch-movies-button");
    fireEvent.click(button);

    // Fill only search term
    const searchInput = screen.getByTestId("fetch-search-input");
    fireEvent.change(searchInput, { target: { value: "interstellar" } });

    // Clear the year field
    const yearInput = screen.getByTestId("fetch-year-input");
    fireEvent.change(yearInput, { target: { value: "" } });

    // Submit the form with empty year
    await act(async () => {
      const submitButton = screen.getByRole("button", { name: "Start Fetch" });
      fireEvent.click(submitButton);
    });

    // Check that fetchNewMovies was called with the right params
    // Note that the year parameter should be undefined when the year field is empty
    expect(mockFetchNewMovies).toHaveBeenCalledWith("interstellar", undefined);
  });
});
