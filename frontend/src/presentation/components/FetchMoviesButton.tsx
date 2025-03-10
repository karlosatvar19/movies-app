import React, { useState } from "react";
import { useMoviesContext } from "../../application/store/MoviesContext";

const FetchMoviesButton: React.FC = () => {
  const { fetchNewMovies } = useMoviesContext();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("space");
  const [year, setYear] = useState("2020");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that search term is not empty
    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm) {
      setError("Please enter a search term");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Use the trimmed search term
      await fetchNewMovies(trimmedSearchTerm, year || undefined);
      setShowModal(false);
      // Reset form fields to defaults
      setSearchTerm("space");
      setYear("2020");
    } catch (err) {
      setError("Failed to start fetch operation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
        data-testid="fetch-movies-button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        Fetch New Movies
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Fetch New Movies</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Search Term (required)
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                  placeholder="e.g., space, mars, astronaut"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="fetch-search-input"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Year (optional)
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                  placeholder="e.g., 2020"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  pattern="^[0-9]{4}$"
                  data-testid="fetch-year-input"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter a 4-digit year to filter results
                </p>
              </div>

              {error && (
                <div className="mb-4 text-red-500 text-sm">{error}</div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Fetching...
                    </>
                  ) : (
                    "Start Fetch"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FetchMoviesButton;
