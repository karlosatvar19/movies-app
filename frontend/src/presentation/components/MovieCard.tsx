import React, { useState, useRef } from "react";
import { Movie } from "../../domain/movies/entities/Movie";

interface MovieCardProps {
  movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [imageError, setImageError] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const imdbUrl = `https://www.imdb.com/title/${movie.imdbID}/`;

  const placeholderImg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450' fill='none'%3E%3Crect width='300' height='450' fill='%23111827'/%3E%3Cpath d='M150 100 A40 40 0 1 0 150 180 A40 40 0 1 0 150 100 Z' stroke='%236d6d6d' stroke-width='2' fill='none'/%3E%3Cpath d='M150 180 L150 260' stroke='%236d6d6d' stroke-width='2'/%3E%3Cpath d='M110 220 L190 220' stroke='%236d6d6d' stroke-width='2'/%3E%3Cpath d='M120 300 L180 300' stroke='%236d6d6d' stroke-width='2'/%3E%3Ctext x='150' y='350' font-family='Arial' font-size='20' fill='%236d6d6d' text-anchor='middle'%3ENo Poster%3C/text%3E%3Ctext x='150' y='380' font-family='Arial' font-size='20' fill='%236d6d6d' text-anchor='middle'%3EAvailable%3C/text%3E%3C/svg%3E`;

  const handleImageError = () => {
    setImageError(true);
  };

  const toggleTooltip = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTooltip(!showTooltip);
  };

  const handleClickOutside = (e) => {
    if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
      setShowTooltip(false);
    }
  };

  React.useEffect(() => {
    if (showTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTooltip]);

  const hasLongPlot = movie.plot && movie.plot.length > 100;

  const truncatedPlot = hasLongPlot
    ? `${movie.plot.substring(0, 100)}...`
    : movie.plot;

  return (
    <article
      className="bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 focus-within:ring-2 focus-within:ring-indigo-500 h-full flex flex-col"
      aria-labelledby={`movie-title-${movie.id}`}
    >
      <div className="relative pt-[150%] bg-gray-900">
        <img
          src={
            movie.poster && movie.poster !== "N/A" && !imageError
              ? movie.poster
              : placeholderImg
          }
          alt={`Movie poster for ${movie.title}`}
          className="absolute top-0 left-0 w-full h-full object-cover"
          loading="lazy"
          onError={handleImageError}
          data-testid="movie-poster"
        />
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <h3
          id={`movie-title-${movie.id}`}
          className="text-lg font-bold mb-1 line-clamp-2"
          data-testid="movie-title"
        >
          {movie.title}
        </h3>
        <div className="flex flex-wrap gap-2 mb-2">
          <span
            className="text-sm bg-indigo-900 text-indigo-200 px-2 py-1 rounded"
            aria-label="Release year"
          >
            {movie.year}
          </span>
          {movie.imdbRating && (
            <span
              className="text-sm bg-yellow-900 text-yellow-200 px-2 py-1 rounded"
              aria-label={`IMDb rating: ${movie.imdbRating} out of 10`}
            >
              <span aria-hidden="true">⭐</span> {movie.imdbRating}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 mb-2" data-testid="movie-director">
          <span className="font-semibold">Director:</span>{" "}
          {movie.director || "Unknown"}
        </p>

        {movie.plot && (
          <div className="relative mb-3 flex-grow">
            <div className="text-sm text-gray-400 h-[4.5rem]">
              <p className="line-clamp-3" data-testid="movie-plot">
                {truncatedPlot}
              </p>

              {hasLongPlot && (
                <div className="relative inline-block">
                  <button
                    onClick={toggleTooltip}
                    className="text-xs mt-1 text-indigo-400 hover:text-indigo-300 underline focus:outline-none inline-block"
                    aria-expanded={showTooltip}
                    aria-controls={`plot-${movie.id}`}
                  >
                    Read more
                  </button>

                  {showTooltip && (
                    <div
                      ref={tooltipRef}
                      className="absolute z-50 p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-60 max-w-[280px] bottom-full left-0 mb-2"
                      id={`plot-${movie.id}`}
                    >
                      <p className="text-sm text-gray-300">{movie.plot}</p>
                      <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-white"
                        onClick={toggleTooltip}
                      >
                        ✕
                      </button>
                      <div className="absolute bottom-[-6px] left-3 w-3 h-3 bg-gray-900 border-r border-b border-gray-700 transform rotate-45"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto pt-2 border-t border-gray-700">
          <a
            href={imdbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded px-2 py-1"
            aria-label={`View ${movie.title} on IMDB`}
          >
            <span>View on IMDB</span>
            <svg
              className="w-3 h-3 ml-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
};

export default MovieCard;
