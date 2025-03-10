import { Inject, Injectable, Logger } from '@nestjs/common';
import { Movie } from '../entities/movie.entity';
import {
  IMovieRepository,
  MOVIE_REPOSITORY,
} from '../repositories/movie-repository.interface';

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);

  constructor(
    @Inject(MOVIE_REPOSITORY)
    private readonly movieRepository: IMovieRepository,
  ) {}

  async findAll(skip: number = 0, limit: number = 12): Promise<Movie[]> {
    return this.movieRepository.findAll(skip, limit);
  }

  async findOne(id: string): Promise<Movie> {
    return this.movieRepository.findById(id);
  }

  async findByImdbId(imdbId: string): Promise<Movie | null> {
    return this.movieRepository.findByImdbId(imdbId);
  }

  async search(
    query: string,
    skip: number = 0,
    limit: number = 12,
  ): Promise<Movie[]> {
    return this.movieRepository.search(query, skip, limit);
  }

  async countMovies(): Promise<number> {
    return this.movieRepository.countMovies();
  }

  async countSearchResults(query: string): Promise<number> {
    return this.movieRepository.countSearchResults(query);
  }

  async saveMovie(movieData: Partial<Movie>): Promise<Movie> {
    const movie = await this.movieRepository.save(movieData);
    this.logger.log(`Movie saved: ${movie.title}`);
    return movie;
  }

  // Domain business logic
  matchesSearchTerm(title: string, searchTerm: string = 'space'): boolean {
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  }
}
