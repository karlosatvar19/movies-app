import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from '../../../../src/domain/movies/services/movies.service';
import { MOVIE_REPOSITORY } from '../../../../src/domain/movies/repositories/movie-repository.interface';
import { NotFoundException } from '@nestjs/common';
import { Movie } from '../../../../src/domain/movies/entities/movie.entity';

describe('MoviesService', () => {
  let service: MoviesService;
  let mockMovieRepository: any;

  const mockMovie = {
    _id: 'test-id',
    title: 'Space Movie',
    year: '2020',
    director: 'Director Name',
    plot: 'Test plot',
    poster: 'test-poster.jpg',
    imdbID: 'tt1234',
    type: 'movie',
  } as Movie;

  beforeEach(async () => {
    // Mock repository implementation
    mockMovieRepository = {
      findById: jest.fn(),
      findByImdbId: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn(),
      save: jest.fn(),
      countMovies: jest.fn(),
      countSearchResults: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: MOVIE_REPOSITORY,
          useValue: mockMovieRepository,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of movies', async () => {
      const movies = [mockMovie];
      mockMovieRepository.findAll.mockResolvedValue(movies);

      const result = await service.findAll();
      expect(result).toEqual(movies);
      expect(mockMovieRepository.findAll).toHaveBeenCalledWith(0, 12);
    });

    it('should pass pagination parameters to the repository', async () => {
      const skip = 5;
      const limit = 10;
      mockMovieRepository.findAll.mockResolvedValue([]);

      await service.findAll(skip, limit);
      expect(mockMovieRepository.findAll).toHaveBeenCalledWith(skip, limit);
    });
  });

  describe('findOne', () => {
    it('should return a movie when found', async () => {
      mockMovieRepository.findById.mockResolvedValue(mockMovie);

      const result = await service.findOne('test-id');
      expect(result).toEqual(mockMovie);
      expect(mockMovieRepository.findById).toHaveBeenCalledWith('test-id');
    });

    it('should throw NotFoundException when movie not found', async () => {
      mockMovieRepository.findById.mockRejectedValue(new NotFoundException());

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByImdbId', () => {
    it('should return a movie when found', async () => {
      mockMovieRepository.findByImdbId.mockResolvedValue(mockMovie);

      const result = await service.findByImdbId('tt1234');
      expect(result).toEqual(mockMovie);
      expect(mockMovieRepository.findByImdbId).toHaveBeenCalledWith('tt1234');
    });

    it('should return null when movie not found', async () => {
      mockMovieRepository.findByImdbId.mockResolvedValue(null);

      const result = await service.findByImdbId('invalid-id');
      expect(result).toBeNull();
    });
  });

  describe('search', () => {
    it('should search movies with query', async () => {
      const movies = [mockMovie];
      mockMovieRepository.search.mockResolvedValue(movies);

      const result = await service.search('space');
      expect(result).toEqual(movies);
      expect(mockMovieRepository.search).toHaveBeenCalledWith('space', 0, 12);
    });

    it('should pass pagination parameters to the repository', async () => {
      const skip = 5;
      const limit = 10;
      mockMovieRepository.search.mockResolvedValue([]);

      await service.search('space', skip, limit);
      expect(mockMovieRepository.search).toHaveBeenCalledWith(
        'space',
        skip,
        limit,
      );
    });
  });

  describe('countMovies', () => {
    it('should return the total count of movies', async () => {
      mockMovieRepository.countMovies.mockResolvedValue(42);

      const result = await service.countMovies();
      expect(result).toBe(42);
    });
  });

  describe('countSearchResults', () => {
    it('should return the count of search results', async () => {
      mockMovieRepository.countSearchResults.mockResolvedValue(5);

      const result = await service.countSearchResults('space');
      expect(result).toBe(5);
      expect(mockMovieRepository.countSearchResults).toHaveBeenCalledWith(
        'space',
      );
    });
  });

  describe('saveMovie', () => {
    it('should save a movie and return it', async () => {
      mockMovieRepository.save.mockResolvedValue(mockMovie);

      const movieData = {
        title: 'Space Movie',
        imdbID: 'tt1234',
      };

      const result = await service.saveMovie(movieData);
      expect(result).toEqual(mockMovie);
      expect(mockMovieRepository.save).toHaveBeenCalledWith(movieData);
    });
  });
});
