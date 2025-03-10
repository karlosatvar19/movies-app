import React, { Suspense, lazy, useEffect } from "react";
import { MoviesProvider } from "./application/store/MoviesContext";
import { Header, ErrorBoundary } from "./presentation/components";

// Lazy load components with prefetching hints
const MovieList = lazy(() => import("./presentation/components/MovieList"));
const SearchBar = lazy(() => import("./presentation/components/SearchBar"));
const NotificationCenter = lazy(
  () => import("./presentation/components/NotificationCenter")
);
const FetchMoviesButton = lazy(
  () => import("./presentation/components/FetchMoviesButton")
);

// Loading fallback components with different sizes
const LoadingFallback = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

const MinimalLoadingFallback = () => (
  <div className="flex justify-center items-center py-4">
    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

// Prefetch component for critical paths
const prefetchComponent = (componentImport: () => Promise<any>) => {
  componentImport().catch(() => {
    // Silently catch errors during prefetch
  });
};

const App: React.FC = () => {
  // Prefetch components that are likely to be used
  useEffect(() => {
    // Defer prefetching to after initial render is complete
    const timer = setTimeout(() => {
      prefetchComponent(() => import("./presentation/components/MovieCard"));
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <MoviesProvider>
        <div className="min-h-screen bg-gray-900 text-white">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="flex flex-col gap-6">
              {/* Title and fetch button with minimal loading state */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">Movies Explorer</h1>
                <Suspense fallback={<MinimalLoadingFallback />}>
                  <FetchMoviesButton />
                </Suspense>
              </div>

              {/* Search bar with its own loading state */}
              <Suspense fallback={<MinimalLoadingFallback />}>
                <SearchBar />
              </Suspense>

              {/* Movie list with its own loading state */}
              <Suspense fallback={<LoadingFallback />}>
                <MovieList />
              </Suspense>
            </div>
          </main>

          <Suspense fallback={null}>
            <NotificationCenter />
          </Suspense>
        </div>
      </MoviesProvider>
    </ErrorBoundary>
  );
};

export default App;
