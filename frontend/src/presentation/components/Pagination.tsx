import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) => {
  // Don't render pagination if there's only one page or less
  if (totalPages <= 1) {
    return null;
  }

  // Calculate which page numbers to show
  const getVisiblePageNumbers = () => {
    // For small number of pages, show all
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pageNumbers: (number | string)[] = [];

    // Always include first page
    pageNumbers.push(1);

    // Add ellipsis after first page if needed
    if (currentPage > 4) {
      pageNumbers.push("ellipsis-start");
    }

    // Calculate start and end of the middle section
    let start = Math.max(2, currentPage - 2);
    let end = Math.min(totalPages - 1, currentPage + 2);

    // Ensure we show at least 5 numbered pages in the middle if possible
    if (end - start + 1 < 5) {
      if (currentPage < totalPages / 2) {
        // Near the beginning
        end = Math.min(totalPages - 1, start + 4);
      } else {
        // Near the end
        start = Math.max(2, end - 4);
      }
    }

    // Add the middle pages
    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    // Add ellipsis before last page if needed
    if (currentPage < totalPages - 3) {
      pageNumbers.push("ellipsis-end");
    }

    // Always include last page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const visiblePageNumbers = getVisiblePageNumbers();

  return (
    <div className={`flex justify-center mt-8 ${className}`}>
      <nav aria-label="Pagination" className="inline-flex rounded-md shadow-sm">
        {/* Previous page button */}
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
            currentPage <= 1
              ? "border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed"
              : "border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
          aria-label="Previous page"
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Page numbers */}
        <div className="join">
          {visiblePageNumbers.map((pageNum, index) => {
            // Render ellipsis
            if (pageNum === "ellipsis-start" || pageNum === "ellipsis-end") {
              return (
                <button
                  key={`${pageNum}-${index}`}
                  className="join-item relative inline-flex items-center px-4 py-2 border border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed"
                  disabled
                >
                  ...
                </button>
              );
            }

            // Render page number
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum as number)}
                className={`join-item relative inline-flex items-center px-4 py-2 border ${
                  currentPage === pageNum
                    ? "border-indigo-600 bg-indigo-700 text-white"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
                aria-current={currentPage === pageNum ? "page" : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next page button */}
        <button
          onClick={() =>
            currentPage < totalPages && onPageChange(currentPage + 1)
          }
          disabled={currentPage >= totalPages}
          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
            currentPage >= totalPages
              ? "border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed"
              : "border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
          aria-label="Next page"
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
