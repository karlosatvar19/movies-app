import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

// Mock the components that App renders
vi.mock("../presentation/components", () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-error-boundary">{children}</div>
  ),
}));

// Mock lazy-loaded components
vi.mock("../presentation/components/MovieList", () => ({
  default: () => <div data-testid="mock-movie-list">Movie List</div>,
}));

vi.mock("../presentation/components/SearchBar", () => ({
  default: () => <div data-testid="mock-search-bar">Search Bar</div>,
}));

vi.mock("../presentation/components/FetchMoviesButton", () => ({
  default: () => <div data-testid="mock-fetch-button">Fetch Movies Button</div>,
}));

vi.mock("../presentation/components/NotificationCenter", () => ({
  default: () => <div data-testid="mock-notification">Notification Center</div>,
}));

// Mock the context provider
vi.mock("../application/store/MoviesContext", () => ({
  MoviesProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-movies-provider">{children}</div>
  ),
}));

describe("App component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the app structure correctly", () => {
    const { container } = render(<App />);

    // Check for key components
    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-error-boundary")).toBeInTheDocument();
    expect(screen.getByTestId("mock-movies-provider")).toBeInTheDocument();

    // Find the div directly inside the MoviesProvider
    const appContainer = container.querySelector(
      '[data-testid="mock-movies-provider"] > div'
    );
    expect(appContainer).toHaveClass("min-h-screen");
    expect(appContainer).toHaveClass("bg-gray-900");
    expect(appContainer).toHaveClass("text-white");
  });
});
