import { MoviesRepository } from "../../domain/movies/interfaces/MoviesRepository";
import {
  Movie,
  PaginatedMoviesResponse,
  MovieSearchParams,
  FetchMoviesCommand,
  FetchJobStatus,
} from "../../domain/movies/entities/Movie";
import { moviesApi } from "../api/movies.api";

/**
 * Implementation of the MoviesRepository interface using HTTP API calls.
 * This class serves as an adapter between the domain layer and the external API.
 *
 * Following Clean Architecture principles, this class is part of the Infrastructure layer
 * and implements interfaces defined in the Domain layer, ensuring that the domain has
 * no knowledge of the implementation details.
 */
export class MoviesApiRepository implements MoviesRepository {
  /**
   * Retrieves a paginated list of movies from the backend API.
   *
   * @param params - The search parameters including page, limit, and optional search query
   * @returns A Promise resolving to a paginated response containing movies
   * @throws Error if the API call fails
   *
   * @example
   * ```typescript
   * const response = await moviesRepository.getMovies({ page: 1, limit: 20, query: 'mars' });
   * const movies = response.items;
   * ```
   */
  async getMovies(params: MovieSearchParams): Promise<PaginatedMoviesResponse> {
    return moviesApi.getMovies(params);
  }

  /**
   * Retrieves a single movie by its unique identifier.
   *
   * @param id - The unique identifier of the movie to retrieve
   * @returns A Promise resolving to the movie data
   * @throws Error if the movie cannot be found or the API call fails
   *
   * @example
   * ```typescript
   * const movie = await moviesRepository.getMovieById('123');
   * console.log(movie.title);
   * ```
   */
  async getMovieById(id: string): Promise<Movie> {
    return moviesApi.getMovieById(id);
  }

  /**
   * Initiates a background fetch operation on the server to retrieve movies
   * from the external OMDB API based on the provided search criteria.
   *
   * @param command - The command containing search parameters for the OMDB API
   * @returns A Promise resolving to an object containing the requestId of the background job
   * @throws Error if the fetch operation fails to start
   *
   * @example
   * ```typescript
   * const { requestId } = await moviesRepository.fetchMovies({
   *   searchTerm: 'space',
   *   year: '2022'
   * });
   * // Track job status using the requestId
   * ```
   */
  async fetchMovies(
    command: FetchMoviesCommand
  ): Promise<{ requestId: string }> {
    return moviesApi.fetchMovies(command);
  }

  /**
   * Retrieves a list of all current and past fetch job statuses.
   *
   * @returns A Promise resolving to an array of fetch job status objects
   * @throws Error if fetching the job list fails
   *
   * @example
   * ```typescript
   * const jobs = await moviesRepository.getFetchJobs();
   * const pendingJobs = jobs.filter(job => job.status === 'pending');
   * ```
   */
  async getFetchJobs(): Promise<FetchJobStatus[]> {
    return moviesApi.getFetchJobs();
  }

  /**
   * Cancels a running fetch job on the server.
   *
   * @param requestId - The unique identifier of the fetch job to cancel
   * @returns A Promise that resolves when the job is successfully cancelled
   * @throws Error if the job cancellation fails
   *
   * @example
   * ```typescript
   * await moviesRepository.cancelFetchJob('job-123');
   * // The job has been cancelled
   * ```
   */
  async cancelFetchJob(requestId: string): Promise<void> {
    await moviesApi.cancelFetchJob(requestId);
  }
}

/**
 * Singleton instance of the MoviesApiRepository.
 * This ensures we use a single instance throughout the application.
 *
 * @example
 * ```typescript
 * // In a component or service
 * import moviesRepository from '../../infrastructure/repositories/MoviesApiRepository';
 *
 * const movies = await moviesRepository.getMovies({ page: 1, limit: 10 });
 * ```
 */
export const moviesRepository = new MoviesApiRepository();
export default moviesRepository;
