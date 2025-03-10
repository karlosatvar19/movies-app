import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import MovieCard from "../../../presentation/components/MovieCard";
import { Movie } from "../../../domain/movies/entities/Movie";
import { vi } from "vitest";

describe("MovieCard component", () => {
  const mockMovie: Movie = {
    id: "1",
    imdbID: "tt1234567",
    title: "Test Space Movie",
    year: "2022",
    director: "Test Director",
    plot: "This is a test plot about space exploration.",
    poster: "https://example.com/poster.jpg",
  };

  it("renders movie information correctly", () => {
    render(<MovieCard movie={mockMovie} />);

    expect(screen.getByTestId("movie-title")).toHaveTextContent(
      "Test Space Movie"
    );
    expect(screen.getByTestId("movie-director")).toHaveTextContent(
      "Director: Test Director"
    );
    expect(screen.getByTestId("movie-plot")).toHaveTextContent(
      "This is a test plot about space exploration."
    );
    expect(screen.getByTestId("movie-poster")).toHaveAttribute(
      "src",
      mockMovie.poster
    );
    expect(screen.getByText("2022")).toBeInTheDocument();
  });

  it("uses placeholder for missing poster", () => {
    const movieWithoutPoster = { ...mockMovie, poster: "N/A" };
    render(<MovieCard movie={movieWithoutPoster} />);

    const posterImg = screen.getByTestId("movie-poster");
    expect(posterImg).toHaveAttribute(
      "src",
      expect.stringContaining("data:image/svg+xml")
    );
    // Verify it's the SVG placeholder - note: it's "No Poster" with a space, not "No+Poster"
    expect(posterImg.getAttribute("src")).toContain("No Poster");
  });

  it("displays IMDb rating when available", () => {
    const movieWithRating = { ...mockMovie, imdbRating: "8.5" };
    render(<MovieCard movie={movieWithRating} />);

    // Use aria-label to find the rating element
    const ratingElement = screen.getByLabelText("IMDb rating: 8.5 out of 10");
    expect(ratingElement).toBeInTheDocument();
    expect(ratingElement.textContent).toContain("8.5");
  });

  it("does not display IMDb rating when unavailable", () => {
    render(<MovieCard movie={mockMovie} />);

    expect(screen.queryByText(/⭐/)).not.toBeInTheDocument();
  });

  it("handles image load errors", () => {
    render(<MovieCard movie={mockMovie} />);

    const posterImg = screen.getByTestId("movie-poster");

    // Simulate an image loading error
    fireEvent.error(posterImg);

    // The component should now use the placeholder image
    expect(posterImg).toHaveAttribute(
      "src",
      expect.stringContaining("data:image/svg+xml")
    );
  });

  it("shows and hides the plot tooltip when clicked", () => {
    // Create a movie with a long plot that will have a "read more" button
    const movieWithLongPlot = {
      ...mockMovie,
      plot: "This is a very long plot description that exceeds the 100 character limit and should trigger the read more functionality. It continues for quite a while to ensure we're well over the limit.",
    };

    render(<MovieCard movie={movieWithLongPlot} />);

    // Initially, the tooltip should not be visible
    expect(screen.queryByText(/read more/i)).toBeInTheDocument();
    expect(screen.queryByText(movieWithLongPlot.plot)).not.toBeInTheDocument();

    // Click the read more button
    const readMoreButton = screen.getByText(/read more/i);
    fireEvent.click(readMoreButton);

    // The full plot should now be visible
    expect(screen.getByText(movieWithLongPlot.plot)).toBeInTheDocument();

    // Click elsewhere to dismiss the tooltip
    fireEvent.mouseDown(document.body);

    // The tooltip should be hidden again
    expect(screen.queryByText(movieWithLongPlot.plot)).not.toBeInTheDocument();
  });

  it("has the correct IMDB link", () => {
    // Render component
    render(<MovieCard movie={mockMovie} />);

    // Find the IMDb link using the aria-label which is visible in the DOM output
    const imdbLink = screen.getByLabelText("View Test Space Movie on IMDB");

    // Check that the link has the correct href
    expect(imdbLink).toHaveAttribute(
      "href",
      `https://www.imdb.com/title/${mockMovie.imdbID}/`
    );

    // Check that it opens in a new tab
    expect(imdbLink).toHaveAttribute("target", "_blank");
    expect(imdbLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});
