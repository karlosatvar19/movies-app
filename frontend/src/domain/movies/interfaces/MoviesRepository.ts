import {
  Movie,
  PaginatedMoviesResponse,
  MovieSearchParams,
  FetchMoviesCommand,
  FetchJobStatus,
} from "../entities/Movie";

/**
 * Repository interface for movie operations following Clean Architecture principles.
 *
 * This interface defines the contract that any implementation must follow to handle
 * movie data access. Following the Dependency Inversion Principle, domain components
 * depend on this abstraction rather than concrete implementations.
 *
 * As part of the Domain layer, this interface has no knowledge of external
 * data sources, whether they are APIs, databases, or other services.
 */
export interface MoviesRepository {
  /**
   * Retrieves a paginated list of movies based on the provided parameters.
   *
   * @param params - Object containing pagination and optional search parameters
   * @returns Promise resolving to paginated movie data
   */
  getMovies(params: MovieSearchParams): Promise<PaginatedMoviesResponse>;

  /**
   * Retrieves a specific movie by its unique identifier.
   *
   * @param id - Unique identifier of the movie
   * @returns Promise resolving to the movie data if found
   * @throws Error if the movie is not found
   */
  getMovieById(id: string): Promise<Movie>;

  /**
   * Initiates a background process to fetch new movies from an external source.
   * This is a long-running operation that returns a job identifier for tracking.
   *
   * @param command - Parameters defining what movies to fetch
   * @returns Promise resolving to an object containing the request/job identifier
   */
  fetchMovies(command: FetchMoviesCommand): Promise<{ requestId: string }>;

  /**
   * Retrieves the status of all movie fetch jobs.
   *
   * @returns Promise resolving to an array of job status objects
   */
  getFetchJobs(): Promise<FetchJobStatus[]>;

  /**
   * Cancels an ongoing fetch job identified by its request ID.
   *
   * @param requestId - The unique identifier of the fetch job to cancel
   * @returns Promise that resolves when the cancellation is complete
   * @throws Error if the job cannot be cancelled or does not exist
   */
  cancelFetchJob(requestId: string): Promise<void>;
}
