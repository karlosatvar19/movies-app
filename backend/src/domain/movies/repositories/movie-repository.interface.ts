import { Movie } from '../entities/movie.entity';

export interface IMovieRepository {
  findById(id: string): Promise<Movie>;
  findByImdbId(imdbId: string): Promise<Movie | null>;
  findAll(skip?: number, limit?: number): Promise<Movie[]>;
  search(query: string, skip?: number, limit?: number): Promise<Movie[]>;
  save(movieData: Partial<Movie>): Promise<Movie>;
  countMovies(): Promise<number>;
  countSearchResults(query: string): Promise<number>;
}

export const MOVIE_REPOSITORY = 'MOVIE_REPOSITORY';
