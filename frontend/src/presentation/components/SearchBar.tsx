import React, { useState, useEffect } from "react";
import { useMoviesContext } from "../../application/store/MoviesContext";

const SearchBar: React.FC = () => {
  const { searchMovies, state } = useMoviesContext();
  const [inputValue, setInputValue] = useState("");
  const searchInputId = "search-movies-input";

  // Sync with context search query
  useEffect(() => {
    if (state?.searchQuery !== inputValue) {
      setInputValue(state?.searchQuery || "");
    }
  }, [state?.searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchMovies(inputValue.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const clearSearch = () => {
    setInputValue("");
    searchMovies("");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full" role="search">
      <div className="relative">
        <label htmlFor={searchInputId} className="sr-only">
          Search movies
        </label>
        <input
          id={searchInputId}
          type="text"
          className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg pl-4 pr-16 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Search movies by title, director, or plot..."
          value={inputValue}
          onChange={handleInputChange}
          data-testid="search-input"
          aria-label="Search movies by title, director, or plot"
          autoComplete="off"
        />

        {inputValue && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-2 focus:outline-none"
            aria-label="Clear search"
            data-testid="clear-search-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          data-testid="search-button"
          aria-label="Search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>

      <div className="mt-1 text-xs text-gray-500" aria-live="polite">
        {inputValue.length > 0
          ? "Press Enter to search"
          : "Type to search for movies"}
      </div>
    </form>
  );
};

export default SearchBar;
