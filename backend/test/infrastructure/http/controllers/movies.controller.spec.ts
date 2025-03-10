import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MoviesController } from '../../../../src/infrastructure/http/controllers/movies.controller';
import { MoviesService } from '../../../../src/domain/movies/services/movies.service';
import { FetchMoviesHandler } from '../../../../src/application/commands/movies/fetch-movies.handler';
import { CacheManagerService } from '../../../../src/infrastructure/cache/services/cache-manager.service';
import { Movie } from '../../../../src/domain/movies/entities/movie.entity';
import { JobManagerService } from '../../../../src/domain/jobs/services/job-manager.service';

describe('MoviesController', () => {
  let controller: MoviesController;
  let moviesService: MoviesService;
  let fetchMoviesHandler: FetchMoviesHandler;
  let cacheManagerService: CacheManagerService;
  let jobManagerService: JobManagerService;

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
    const mockMoviesService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      search: jest.fn(),
      countMovies: jest.fn(),
      countSearchResults: jest.fn(),
    };

    const mockFetchMoviesHandler = {
      startFetchMoviesJob: jest.fn(),
    };

    const mockCacheManagerService = {
      get: jest.fn(),
      set: jest.fn(),
      invalidateCache: jest.fn(),
    };

    const mockJobManagerService = {
      getActiveJobs: jest.fn().mockReturnValue(['job1', 'job2']),
      cancelJob: jest.fn().mockImplementation((jobId) => jobId === 'job1'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
        {
          provide: FetchMoviesHandler,
          useValue: mockFetchMoviesHandler,
        },
        {
          provide: CacheManagerService,
          useValue: mockCacheManagerService,
        },
        {
          provide: JobManagerService,
          useValue: mockJobManagerService,
        },
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    moviesService = module.get<MoviesService>(MoviesService);
    fetchMoviesHandler = module.get<FetchMoviesHandler>(FetchMoviesHandler);
    cacheManagerService = module.get<CacheManagerService>(CacheManagerService);
    jobManagerService = module.get<JobManagerService>(JobManagerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return cached results if available', async () => {
      const cachedResult = { movies: [mockMovie], total: 1 };
      jest.spyOn(cacheManagerService, 'get').mockResolvedValue(cachedResult);

      const result = await controller.findAll();

      expect(cacheManagerService.get).toHaveBeenCalledWith(
        'movies_findAll_0_12',
      );
      expect(result).toEqual(cachedResult);
      expect(moviesService.findAll).not.toHaveBeenCalled();
    });

    it('should fetch movies from service when not cached', async () => {
      const movies = [mockMovie];
      const totalItems = 1;

      jest.spyOn(cacheManagerService, 'get').mockResolvedValue(null);
      jest.spyOn(moviesService, 'findAll').mockResolvedValue(movies);
      jest.spyOn(moviesService, 'countMovies').mockResolvedValue(totalItems);

      const result = await controller.findAll();

      expect(cacheManagerService.get).toHaveBeenCalledWith(
        'movies_findAll_0_12',
      );
      expect(moviesService.findAll).toHaveBeenCalledWith(0, 12);
      expect(moviesService.countMovies).toHaveBeenCalled();
      expect(result).toEqual({
        movies,
        page: 1,
        limit: 12,
        totalPages: 1,
        totalItems: 1,
        total: 1,
      });
      expect(cacheManagerService.set).toHaveBeenCalledWith(
        'movies_findAll_0_12',
        expect.any(Object),
        3600,
      );
    });

    it('should search movies when search parameter is provided', async () => {
      const searchQuery = 'space';
      const movies = [mockMovie];
      const totalItems = 1;

      jest.spyOn(cacheManagerService, 'get').mockResolvedValue(null);
      jest.spyOn(moviesService, 'search').mockResolvedValue(movies);
      jest
        .spyOn(moviesService, 'countSearchResults')
        .mockResolvedValue(totalItems);

      const result = await controller.findAll(1, 12, searchQuery);

      expect(cacheManagerService.get).toHaveBeenCalledWith(
        'movies_search_space_0_12',
      );
      expect(moviesService.search).toHaveBeenCalledWith(searchQuery, 0, 12);
      expect(moviesService.countSearchResults).toHaveBeenCalledWith(
        searchQuery,
      );
      expect(result).toEqual({
        movies,
        page: 1,
        limit: 12,
        totalPages: 1,
        totalItems: 1,
        total: 1,
      });
      expect(cacheManagerService.set).toHaveBeenCalledWith(
        'movies_search_space_0_12',
        expect.any(Object),
        1800,
      );
    });
  });

  describe('findOne', () => {
    it('should return a movie when found', async () => {
      jest.spyOn(moviesService, 'findOne').mockResolvedValue(mockMovie);

      const result = await controller.findOne('test-id');

      expect(result).toEqual(mockMovie);
      expect(moviesService.findOne).toHaveBeenCalledWith('test-id');
    });

    it('should throw NotFoundException when movie not found', async () => {
      jest
        .spyOn(moviesService, 'findOne')
        .mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('fetchMovies', () => {
    it('should start a fetch job and return request ID', async () => {
      const requestId = 'test-request-id';
      jest
        .spyOn(fetchMoviesHandler, 'startFetchMoviesJob')
        .mockReturnValue(requestId);

      const result = await controller.fetchMovies();

      expect(fetchMoviesHandler.startFetchMoviesJob).toHaveBeenCalledWith(
        'space',
        '2020',
      );
      expect(result).toEqual({
        requestId,
        message: 'Started fetching space movies for year 2020',
        success: true,
      });
    });

    it('should pass custom search parameters to the fetch job', async () => {
      const requestId = 'test-request-id';
      const searchTerm = 'custom';
      const year = '2021';

      jest
        .spyOn(fetchMoviesHandler, 'startFetchMoviesJob')
        .mockReturnValue(requestId);

      const result = await controller.fetchMovies(searchTerm, year);

      expect(fetchMoviesHandler.startFetchMoviesJob).toHaveBeenCalledWith(
        searchTerm,
        year,
      );
      expect(result).toEqual({
        requestId,
        message: 'Started fetching custom movies for year 2021',
        success: true,
      });
    });
  });

  describe('search', () => {
    it('should return cached results if available', async () => {
      const cachedResult = { movies: [mockMovie], total: 1 };
      jest.spyOn(cacheManagerService, 'get').mockResolvedValue(cachedResult);

      const result = await controller.search('space', '', 1, 10);

      expect(cacheManagerService.get).toHaveBeenCalledWith(
        'movies_search_space_0_10',
      );
      expect(result).toEqual(cachedResult);
      expect(moviesService.search).not.toHaveBeenCalled();
    });

    it('should fetch movies from service when not cached', async () => {
      const movies = [mockMovie];
      const totalItems = 1;

      jest.spyOn(cacheManagerService, 'get').mockResolvedValue(null);
      jest.spyOn(moviesService, 'search').mockResolvedValue(movies);
      jest
        .spyOn(moviesService, 'countSearchResults')
        .mockResolvedValue(totalItems);

      const result = await controller.search('space', '', 1, 10);

      expect(cacheManagerService.get).toHaveBeenCalledWith(
        'movies_search_space_0_10',
      );
      expect(moviesService.search).toHaveBeenCalledWith('space', 0, 10);
      expect(moviesService.countSearchResults).toHaveBeenCalledWith('space');
      expect(result).toEqual({
        movies,
        page: 1,
        limit: 10,
        totalPages: 1,
        totalItems,
        total: totalItems,
      });
      expect(cacheManagerService.set).toHaveBeenCalledWith(
        'movies_search_space_0_10',
        expect.any(Object),
        1800,
      );
    });
  });

  describe('getActiveJobs', () => {
    it('should return active jobs list', () => {
      const activeJobs = ['job1', 'job2'];
      jest
        .spyOn(jobManagerService, 'getActiveJobs')
        .mockReturnValue(activeJobs);

      const result = controller.getActiveJobs();

      expect(jobManagerService.getActiveJobs).toHaveBeenCalled();
      expect(result).toEqual({ activeJobs });
    });
  });

  describe('cancelFetchJob', () => {
    it('should cancel job and return success true when job exists', () => {
      jest.spyOn(jobManagerService, 'cancelJob').mockReturnValue(true);

      const result = controller.cancelFetchJob('job1');

      expect(jobManagerService.cancelJob).toHaveBeenCalledWith('job1');
      expect(result).toEqual({
        success: true,
        message: `Job job1 cancelled successfully`,
      });
    });

    it('should return success false when job does not exist', () => {
      jest.spyOn(jobManagerService, 'cancelJob').mockReturnValue(false);

      const result = controller.cancelFetchJob('non-existent-job');

      expect(jobManagerService.cancelJob).toHaveBeenCalledWith(
        'non-existent-job',
      );
      expect(result).toEqual({
        success: false,
        message: `No active fetch job found with ID non-existent-job`,
      });
    });
  });
});
