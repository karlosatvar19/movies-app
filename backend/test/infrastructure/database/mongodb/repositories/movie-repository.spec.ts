import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { MovieRepository } from '../../../../../src/infrastructure/database/mongodb/repositories/movie-repository';
import { Movie } from '../../../../../src/domain/movies/entities/movie.entity';

describe('MovieRepository', () => {
  let repository: MovieRepository;
  let mockMovieModel: any;

  const mockMovie = {
    _id: 'test-id',
    title: 'Space Movie',
    year: '2020',
    director: 'Director Name',
    plot: 'Test plot',
    poster: 'test-poster.jpg',
    imdbID: 'tt1234',
    type: 'movie',
  };

  beforeEach(async () => {
    // Create a mock constructor function
    const mockConstructor = jest.fn().mockImplementation((data) => {
      return {
        ...data,
        save: jest.fn().mockResolvedValue({ ...data, _id: 'test-id' }),
      };
    });

    // Create mock methods for the model
    mockMovieModel = {
      findById: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    // Combine the constructor and methods
    mockMovieModel = Object.assign(mockConstructor, mockMovieModel);

    // Mock the exec function for Mongoose query methods
    mockMovieModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockMovie),
    });
    mockMovieModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockMovie),
    });
    mockMovieModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockMovie]),
    });
    mockMovieModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieRepository,
        {
          provide: getModelToken(Movie.name),
          useValue: mockMovieModel,
        },
      ],
    }).compile();

    repository = module.get<MovieRepository>(MovieRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should return a movie when found', async () => {
      const result = await repository.findById('test-id');
      expect(result).toEqual(mockMovie);
      expect(mockMovieModel.findById).toHaveBeenCalledWith('test-id');
    });

    it('should throw NotFoundException when movie not found', async () => {
      mockMovieModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(repository.findById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByImdbId', () => {
    it('should return a movie when found', async () => {
      const result = await repository.findByImdbId('tt1234');
      expect(result).toEqual(mockMovie);
      expect(mockMovieModel.findOne).toHaveBeenCalledWith({ imdbID: 'tt1234' });
    });

    it('should return null when movie not found', async () => {
      mockMovieModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findByImdbId('invalid-id');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all movies with default pagination', async () => {
      const result = await repository.findAll();
      expect(result).toEqual([mockMovie]);
      expect(mockMovieModel.find).toHaveBeenCalled();
      expect(mockMovieModel.find().sort).toHaveBeenCalledWith({
        createdAt: -1,
      });
      expect(mockMovieModel.find().sort().skip).toHaveBeenCalledWith(0);
      expect(mockMovieModel.find().sort().skip().limit).toHaveBeenCalledWith(
        12,
      );
    });

    it('should respect pagination parameters', async () => {
      const skip = 5;
      const limit = 10;

      await repository.findAll(skip, limit);

      expect(mockMovieModel.find().sort().skip).toHaveBeenCalledWith(skip);
      expect(mockMovieModel.find().sort().skip().limit).toHaveBeenCalledWith(
        limit,
      );
    });
  });

  describe('search', () => {
    it('should search movies with query', async () => {
      const result = await repository.search('space');
      expect(result).toEqual([mockMovie]);

      const searchRegex = expect.any(RegExp);
      expect(mockMovieModel.find).toHaveBeenCalledWith({
        $or: [
          { title: searchRegex },
          { director: searchRegex },
          { plot: searchRegex },
        ],
      });
    });

    it('should respect pagination parameters', async () => {
      const skip = 5;
      const limit = 10;

      await repository.search('space', skip, limit);

      expect(mockMovieModel.find().sort().skip).toHaveBeenCalledWith(skip);
      expect(mockMovieModel.find().sort().skip().limit).toHaveBeenCalledWith(
        limit,
      );
    });
  });

  describe('save', () => {
    it('should return existing movie if it exists', async () => {
      const result = await repository.save({ imdbID: 'tt1234' });
      expect(result).toEqual(mockMovie);
      expect(mockMovieModel.findOne).toHaveBeenCalledWith({ imdbID: 'tt1234' });
    });

    it('should create and save a new movie if it does not exist', async () => {
      // Mock findByImdbId to return null (movie doesn't exist)
      mockMovieModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const movieData = {
        title: 'New Space Movie',
        imdbID: 'tt5678',
      };

      // Create a mock for the saved movie with an ID
      const savedMovie = { ...movieData, _id: 'new-id' };

      // Mock the save method for this specific test
      const mockSave = jest.fn().mockResolvedValue(savedMovie);

      // Override the constructor implementation for this test
      mockMovieModel.mockImplementationOnce(() => ({
        ...movieData,
        save: mockSave,
      }));

      // Call the save method
      const result = await repository.save(movieData);

      // Verify the model constructor was called with the movie data
      expect(mockMovieModel).toHaveBeenCalledWith(movieData);

      // Verify save was called
      expect(mockSave).toHaveBeenCalled();

      // Verify the result matches what we expect
      expect(result).toEqual(savedMovie);
    });
  });

  describe('countMovies', () => {
    it('should return the total count of movies', async () => {
      mockMovieModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(42),
      });

      const result = await repository.countMovies();
      expect(result).toBe(42);
    });
  });

  describe('countSearchResults', () => {
    it('should return the count when search query is provided', async () => {
      mockMovieModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(5),
      });

      const result = await repository.countSearchResults('space');
      expect(result).toBe(5);

      const searchRegex = expect.any(RegExp);
      expect(mockMovieModel.countDocuments).toHaveBeenCalledWith({
        $or: [
          { title: searchRegex },
          { director: searchRegex },
          { plot: searchRegex },
        ],
      });
    });

    it('should call countMovies when query is empty', async () => {
      const countMoviesSpy = jest
        .spyOn(repository, 'countMovies')
        .mockResolvedValue(42);

      const result = await repository.countSearchResults('');
      expect(result).toBe(42);
      expect(countMoviesSpy).toHaveBeenCalled();
    });
  });
});
