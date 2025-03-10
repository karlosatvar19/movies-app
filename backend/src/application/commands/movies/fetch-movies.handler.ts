import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MoviesService } from '../../../domain/movies/services/movies.service';
import { OmdbService } from '../../../infrastructure/external-services/omdb/omdb.service';
import { FetchMoviesGateway } from '../../../infrastructure/messaging/websockets/gateways/fetch-movies.gateway';
import { CacheManagerService } from '../../../infrastructure/cache/services/cache-manager.service';
import { JobManagerService } from '../../../domain/jobs/services/job-manager.service';
import { FetchMoviesCommand } from './fetch-movies.command';
import { FetchMoviesResult } from '../../dto/fetch-movies-result';
import { Movie } from '../../../domain/movies/entities/movie.entity';

@Injectable()
export class FetchMoviesHandler {
  private readonly logger = new Logger(FetchMoviesHandler.name);

  constructor(
    private readonly moviesService: MoviesService,
    private readonly omdbService: OmdbService,
    private readonly fetchMoviesGateway: FetchMoviesGateway,
    private readonly cacheManager: CacheManagerService,
    private readonly jobManagerService: JobManagerService,
  ) {}

  /**
   * Safely executes an operation that might fail due to disconnection
   */
  private safeExecute<T>(
    operation: () => T | Promise<T>,
    fallback: T | null = null,
    context: string = 'operation',
  ): Promise<T | null> {
    try {
      return Promise.resolve(operation());
    } catch (error) {
      const isConnectionError = this.isConnectionError(error);

      if (!isConnectionError) {
        this.logger.error(`Error in ${context}: ${error.message}`);
      } else {
        this.logger.warn(`Connection issue in ${context}: ${error.message}`);
      }

      return Promise.resolve(fallback);
    }
  }

  /**
   * Determine if an error is related to database connection issues
   */
  private isConnectionError(error: any): boolean {
    if (!error?.message) return false;

    const connectionErrorPhrases = [
      'connection',
      'connect',
      'timeout',
      'socketexception',
      'network',
      'disconnected',
      'closed',
      'heartbeat',
    ];

    return connectionErrorPhrases.some((phrase) =>
      error.message.toLowerCase().includes(phrase),
    );
  }

  /**
   * Check if the database connection is working by performing a simple operation
   */
  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      await this.safeExecute(
        () => this.moviesService.findByImdbId('test-connection-id'),
        null,
        'database connection test',
      );
      return true;
    } catch (error) {
      if (this.isConnectionError(error)) {
        this.logger.warn('Database connection check failed: disconnected');
        return false;
      }
      this.logger.error(`Database check error: ${error.message}`);
      return true;
    }
  }

  /**
   * Transforms OMDB API movie data to match our schema field names
   * OMDB uses capitalized fields (Title, Year) while our schema uses lowercase (title, year)
   */
  private transformMovieData(omdbMovie: any): Partial<Movie> {
    return {
      title: omdbMovie.Title,
      year: omdbMovie.Year,
      director: omdbMovie.Director,
      plot: omdbMovie.Plot,
      poster: omdbMovie.Poster,
      imdbID: omdbMovie.imdbID,
      type: omdbMovie.Type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async execute(command: FetchMoviesCommand): Promise<FetchMoviesResult> {
    const { requestId, searchTerm, year } = command;

    this.jobManagerService.registerJob(requestId);

    try {
      await this.safeExecute(
        () => this.fetchMoviesGateway.sendFetchStarted(requestId, searchTerm),
        null,
        'sendFetchStarted',
      );

      const uniqueMovieIds = new Set<string>();
      let moviesProcessed = 0;
      let newMoviesCount = 0;

      const initialResults = await this.omdbService.searchMoviesByTitle(
        searchTerm,
        year,
        1,
      );

      const totalResults = initialResults.totalResults
        ? parseInt(initialResults.totalResults)
        : 0;
      const totalPages = Math.ceil(totalResults / 10);
      const maxPagesToProcess = Math.min(totalPages, 5);

      this.logger.log(
        `Starting fetch: ${requestId} for "${searchTerm}" movies from ${year}. ` +
          `Total: ${totalResults} (${totalPages} pages, processing max ${maxPagesToProcess})`,
      );

      if (initialResults.Search && Array.isArray(initialResults.Search)) {
        initialResults.Search.forEach((movie) => {
          if (movie.imdbID) uniqueMovieIds.add(movie.imdbID);
        });
      }

      let pageNum = 1;
      while (
        pageNum <= maxPagesToProcess &&
        this.jobManagerService.isJobActive(requestId)
      ) {
        try {
          if (pageNum > 1) {
            const pageResults = await this.omdbService.searchMoviesByTitle(
              searchTerm,
              year,
              pageNum,
            );

            if (pageResults.Search && Array.isArray(pageResults.Search)) {
              for (const movie of pageResults.Search) {
                if (movie.imdbID) uniqueMovieIds.add(movie.imdbID);
              }
            }
          }

          moviesProcessed = uniqueMovieIds.size;
          await this.safeExecute(
            () =>
              this.fetchMoviesGateway.sendFetchProgress(
                requestId,
                moviesProcessed,
                totalResults,
                searchTerm,
              ),
            null,
            `progress for page ${pageNum}`,
          );

          pageNum++;
        } catch (error) {
          this.logger.error(
            `Error processing page ${pageNum}: ${error.message}`,
          );
          pageNum++;
          continue;
        }
      }

      for (const imdbId of uniqueMovieIds) {
        try {
          const wasNewlyAdded = await this.safeExecute(
            async () => {
              const existingMovie =
                await this.moviesService.findByImdbId(imdbId);
              if (!existingMovie) {
                const movieDetail =
                  await this.omdbService.getMovieDetails(imdbId);
                if (movieDetail) {
                  // Transform the movie data to match our schema
                  const transformedMovieData = this.transformMovieData(movieDetail);

                  // Log the transformed data for debugging
                  this.logger.debug(`Saving movie: ${JSON.stringify(transformedMovieData)}`);

                  await this.moviesService.saveMovie(transformedMovieData);
                  return true;
                }
              }
              return false;
            },
            false,
            `saving movie ${imdbId}`,
          );

          if (wasNewlyAdded) newMoviesCount++;
        } catch (error) {
          this.logger.error(`Error saving movie ${imdbId}: ${error.message}`);

          // Add more detailed error logging
          if (error.name === 'ValidationError') {
            this.logger.error(`Validation error details: ${JSON.stringify(error.errors || {})}`);
          }

          continue;
        }
      }

      await this.safeExecute(
        () =>
          this.fetchMoviesGateway.sendFetchProgress(
            requestId,
            moviesProcessed,
            totalResults,
            searchTerm,
          ),
        null,
        'final progress event',
      );

      await this.safeExecute(
        () =>
          this.fetchMoviesGateway.sendFetchCompleted(
            requestId,
            newMoviesCount,
            searchTerm,
          ),
        null,
        'completion event',
      );

      this.jobManagerService.removeJob(requestId);

      return new FetchMoviesResult(
        true,
        `Fetched ${searchTerm} movies${year ? ` from ${year}` : ''}`,
        newMoviesCount,
      );
    } catch (error) {
      this.logger.error(`Error executing fetch job: ${error.message}`);
      this.jobManagerService.removeJob(requestId);
      throw error;
    }
  }

  startFetchMoviesJob(
    searchTerm: string = 'space',
    year: string = '2020',
  ): string {
    const requestId = uuidv4();
    const command = new FetchMoviesCommand(requestId, searchTerm, year);

    this.execute(command).catch((error) => {
      this.logger.error(
        `Unhandled error in fetch job ${requestId}: ${error.message}`,
      );
    });

    return requestId;
  }

  private async invalidateCache(): Promise<void> {
    try {
      // Clear all movie-related caches
      await this.cacheManager.removeByPattern('movies_');

      // If we're adding new movies, we should also clear search results
      await this.cacheManager.removeByPattern('search_');

      this.logger.log('Cache cleared successfully');
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`);
    }
  }
}
