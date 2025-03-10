// src/infrastructure/http/controllers/movies.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { MoviesService } from '../../../domain/movies/services/movies.service';
import { FetchMoviesHandler } from '../../../application/commands/movies/fetch-movies.handler';
import { CacheManagerService } from '../../../infrastructure/cache/services/cache-manager.service';
import { JobManagerService } from '../../../domain/jobs/services/job-manager.service';

@ApiTags('Movies')
@Controller('movies')
export class MoviesController {
  private readonly logger = new Logger(MoviesController.name);

  constructor(
    private readonly moviesService: MoviesService,
    private readonly fetchMoviesHandler: FetchMoviesHandler,
    private readonly cacheManager: CacheManagerService,
    private readonly jobManager: JobManagerService,
  ) {}

  @ApiOperation({ summary: 'Get all movies with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 12,
    @Query('search') search?: string,
  ) {
    const skip = (page - 1) * limit;
    const cacheKey = search
      ? `movies_search_${search}_${skip}_${limit}`
      : `movies_findAll_${skip}_${limit}`;

    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const movies = search
      ? await this.moviesService.search(search, skip, limit)
      : await this.moviesService.findAll(skip, limit);

    const totalItems = search
      ? await this.moviesService.countSearchResults(search)
      : await this.moviesService.countMovies();

    const result = {
      movies,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      total: totalItems,
    };

    // Cache with an appropriate TTL based on the request type
    // Search results might change more frequently than full listings
    const ttl = search ? 1800 : 3600; // 30 minutes for search, 1 hour for listings
    await this.cacheManager.set(cacheKey, result, ttl);
    return result;
  }

  @ApiOperation({ summary: 'Search movies by title, director or plot' })
  @ApiQuery({
    name: 'query',
    required: false,
    type: String,
    description: 'Primary search query',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Alternative search query',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @Get('search')
  async search(
    @Query('query') query: string,
    @Query('q') q: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 12,
  ) {
    const searchTerm = query || q || '';
    const skip = (page - 1) * limit;
    const cacheKey = `movies_search_${searchTerm}_${skip}_${limit}`;

    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const movies = await this.moviesService.search(searchTerm, skip, limit);
    const totalItems = await this.moviesService.countSearchResults(searchTerm);

    const result = {
      movies,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      total: totalItems,
    };

    // Cache search results for 30 minutes
    await this.cacheManager.set(cacheKey, result, 1800);
    return result;
  }

  @ApiOperation({ summary: 'Get active fetch jobs' })
  @Get('fetch/jobs')
  getActiveJobs() {
    const activeJobs = this.jobManager.getActiveJobs();
    return { activeJobs };
  }

  @ApiOperation({ summary: 'Cancel a fetch job' })
  @ApiParam({ name: 'requestId', description: 'ID of the fetch job to cancel' })
  @Post('fetch/cancel/:requestId')
  cancelFetchJob(@Param('requestId') requestId: string) {
    const success = this.jobManager.cancelJob(requestId);
    return {
      success,
      message: success
        ? `Job ${requestId} cancelled successfully`
        : `No active fetch job found with ID ${requestId}`,
    };
  }

  @ApiOperation({ summary: 'Get a movie by ID' })
  @ApiParam({ name: 'id', description: 'Movie ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.moviesService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching movie ${id}: ${error.message}`);
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
  }

  @ApiOperation({ summary: 'Start a new movie fetch job' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        searchTerm: {
          type: 'string',
          default: 'space',
          description: 'Term to search for',
        },
        year: {
          type: 'string',
          default: '2020',
          description: 'Year of movies to fetch',
        },
      },
    },
  })
  @Post('fetch')
  async fetchMovies(
    @Body('searchTerm') searchTerm: string = 'space',
    @Body('year') year: string = '2020',
  ) {
    // Normalize whitespace in search term
    const normalizedSearchTerm = searchTerm.trim().replace(/\s+/g, ' ');

    const requestId = this.fetchMoviesHandler.startFetchMoviesJob(
      normalizedSearchTerm,
      year,
    );
    return {
      requestId,
      message: `Started fetching ${normalizedSearchTerm} movies for year ${year}`,
      success: true,
    };
  }
}
