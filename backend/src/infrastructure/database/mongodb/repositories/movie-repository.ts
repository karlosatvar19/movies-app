// src/infrastructure/database/mongodb/repositories/movie-repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Movie } from '../../../../domain/movies/entities/movie.entity';
import { IMovieRepository } from '../../../../domain/movies/repositories/movie-repository.interface';

@Injectable()
export class MovieRepository implements IMovieRepository {
  constructor(
    @InjectModel(Movie.name) private readonly movieModel: Model<Movie>,
  ) {}

  async findById(id: string): Promise<Movie> {
    const movie = await this.movieModel.findById(id).exec();
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  async findByImdbId(imdbId: string): Promise<Movie | null> {
    const movie = await this.movieModel.findOne({ imdbID: imdbId }).exec();
    if (!movie) {
      return null;
    }
    return movie;
  }

  async findAll(skip: number = 0, limit: number = 12): Promise<Movie[]> {
    return this.movieModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async search(
    query: string,
    skip: number = 0,
    limit: number = 12,
  ): Promise<Movie[]> {
    if (!query || query.trim() === '') {
      return this.findAll(skip, limit);
    }

    // Normalize whitespace before creating regex
    const normalizedQuery = query.trim().replace(/\s+/g, ' ');
    const searchRegex = new RegExp(normalizedQuery, 'i');

    return this.movieModel
      .find({
        $or: [
          { title: searchRegex },
          { director: searchRegex },
          { plot: searchRegex },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async save(movieData: Partial<Movie>): Promise<Movie> {
    if (!movieData.imdbID) {
      throw new Error('ImdbID is required to save a movie');
    }

    const existingMovie = await this.findByImdbId(movieData.imdbID);
    if (existingMovie) {
      return existingMovie;
    }
    const movie = new this.movieModel(movieData);
    return movie.save();
  }

  async countMovies(): Promise<number> {
    return this.movieModel.countDocuments().exec();
  }

  async countSearchResults(query: string): Promise<number> {
    if (!query || query.trim() === '') {
      return this.countMovies();
    }

    // Use the same normalization as in search method
    const normalizedQuery = query.trim().replace(/\s+/g, ' ');
    const searchRegex = new RegExp(normalizedQuery, 'i');

    return this.movieModel
      .countDocuments({
        $or: [
          { title: searchRegex },
          { director: searchRegex },
          { plot: searchRegex },
        ],
      })
      .exec();
  }
}
