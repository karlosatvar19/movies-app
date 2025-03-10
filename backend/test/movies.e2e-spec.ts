import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Movie, MovieSchema } from '../src/domain/movies/entities/movie.entity';
import { HttpExceptionFilter } from '../src/infrastructure/http/filters/http-exception.filter';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { TestAppModule } from '../test-utils/test-app.module';
import { JobManagerService } from '../src/domain/jobs/services/job-manager.service';

describe('MoviesController (e2e)', () => {
  let app: INestApplication;
  let mongoMemoryServer: MongoMemoryServer;
  let movieModel: Model<Movie>;

  // Sample movie data for testing
  const mockMovie = {
    title: 'Space Movie Test',
    year: '2020',
    director: 'Test Director',
    plot: 'Test plot description',
    poster: 'https://test-poster.jpg',
    imdbID: 'tt12345test',
    type: 'movie',
  };

  beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoMemoryServer = await MongoMemoryServer.create();
    const mongoUri = mongoMemoryServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(mongoUri), TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api');

    await app.init();

    // Get the Movie model
    movieModel = app.get<Model<Movie>>(getModelToken(Movie.name));

    // Seed the database with a test movie
    await seedDatabase();
  }, 60000);

  const seedDatabase = async () => {
    await movieModel.deleteMany({});
    await movieModel.create(mockMovie);
  };

  afterAll(async () => {
    // Clean up socket clients
    if (app) {
      // Cancel any active jobs
      try {
        // Fix: Get JobManagerService by its class token instead of string
        const jobManager = app.get(JobManagerService);
        if (jobManager) {
          const activeJobs = jobManager.getActiveJobs();
          for (const jobId of activeJobs) {
            try {
              await request(app.getHttpServer())
                .post(`/api/movies/fetch/cancel/${jobId}`)
                .expect(201);
              console.log(`Cancelled job ${jobId} during cleanup`);
            } catch (err) {
              console.warn(`Failed to cancel job ${jobId}:`, err.message);
            }
          }
        }
      } catch (error) {
        console.warn('Error cleaning up jobs:', error.message);
      }

      // Add a small delay to allow cancellation to propagate
      await new Promise((resolve) => setTimeout(resolve, 200));

      await app.close();
    }

    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  });

  describe('/api/movies (GET)', () => {
    it('should return movies with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.movies)).toBe(true);
      expect(response.body.movies.length).toBeGreaterThan(0);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should use default pagination when not provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(response.body).toHaveProperty('total');
    });
  });

  describe('/api/movies/search (GET)', () => {
    it('should search movies by query', async () => {
      const query = 'Space';
      const response = await request(app.getHttpServer())
        .get('/api/movies/search')
        .query({ query, page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.movies)).toBe(true);
      // The search should find our seeded movie that contains 'Space' in the title
      expect(response.body.movies.length).toBeGreaterThan(0);
      expect(response.body.movies[0].title).toContain('Space');
    });

    it('should return empty array when no matches are found', async () => {
      const query = 'NonExistentMovieTitle';
      const response = await request(app.getHttpServer())
        .get('/api/movies/search')
        .query({ query, page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.movies)).toBe(true);
      expect(response.body.movies.length).toBe(0);
      expect(response.body.total).toBe(0);
    });

    it('should handle whitespace in search queries', async () => {
      const query = '  Space   Movie  ';
      const response = await request(app.getHttpServer())
        .get('/api/movies/search')
        .query({ query, page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.movies)).toBe(true);
      // The search should find our seeded movie that contains 'Space' in the title
      expect(response.body.movies.length).toBeGreaterThan(0);
      expect(response.body.movies[0].title).toContain('Space');
    });
  });

  describe('/api/movies/:id (GET)', () => {
    it('should return a movie by id', async () => {
      // First, get all movies to obtain a valid ID
      const moviesResponse = await request(app.getHttpServer())
        .get('/api/movies')
        .expect(200);

      const movieId = moviesResponse.body.movies[0]._id;

      // Test the get by ID endpoint
      const response = await request(app.getHttpServer())
        .get(`/api/movies/${movieId}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id', movieId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('year');
      expect(response.body).toHaveProperty('director');
    });

    it('should return 404 for non-existent movie id', async () => {
      const nonExistentId = '60b6e5c0f36d2e001c8e6123'; // Valid MongoDB ObjectId format
      await request(app.getHttpServer())
        .get(`/api/movies/${nonExistentId}`)
        .expect(404);
    });

    it('should return 404 for invalid movie id format', async () => {
      const invalidId = 'invalid-id';
      await request(app.getHttpServer())
        .get(`/api/movies/${invalidId}`)
        .expect(404);
    });
  });

  describe('/api/movies/fetch (POST)', () => {
    it('should start a fetch job', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/movies/fetch')
        .send({ searchTerm: 'space', year: '2020' })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('requestId');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Started fetching space movies');

      // Clean up the job
      if (response.body.requestId) {
        await request(app.getHttpServer())
          .post(`/api/movies/fetch/cancel/${response.body.requestId}`)
          .expect(201);
      }
    });

    it('should use default values when not provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/movies/fetch')
        .send({})
        .expect(201);

      expect(response.body).toHaveProperty('success', true);

      // Clean up the job
      if (response.body.requestId) {
        await request(app.getHttpServer())
          .post(`/api/movies/fetch/cancel/${response.body.requestId}`)
          .expect(201);
      }
    });

    it('should handle whitespace in search terms', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/movies/fetch')
        .send({ searchTerm: '  space   odyssey  ', year: '2020' })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('requestId');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(
        'Started fetching space odyssey movies',
      );

      // Clean up the job
      if (response.body.requestId) {
        await request(app.getHttpServer())
          .post(`/api/movies/fetch/cancel/${response.body.requestId}`)
          .expect(201);
      }
    });

    it('should properly handle repeated identical fetch requests', async () => {
      // Make first request
      const response1 = await request(app.getHttpServer())
        .post('/api/movies/fetch')
        .send({ searchTerm: 'unique term', year: '2021' })
        .expect(201);

      expect(response1.body).toHaveProperty('success', true);
      const requestId1 = response1.body.requestId;

      // Make identical second request
      const response2 = await request(app.getHttpServer())
        .post('/api/movies/fetch')
        .send({ searchTerm: 'unique term', year: '2021' })
        .expect(201);

      expect(response2.body).toHaveProperty('success', true);
      const requestId2 = response2.body.requestId;

      // They should have different request IDs
      expect(requestId1).not.toEqual(requestId2);

      // Wait for a moment to ensure jobs are registered
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Check active jobs
      const jobsResponse = await request(app.getHttpServer())
        .get('/api/movies/fetch/jobs')
        .expect(200);

      expect(jobsResponse.body).toHaveProperty('activeJobs');
      expect(Array.isArray(jobsResponse.body.activeJobs)).toBe(true);

      // Cancel both jobs to clean up
      await request(app.getHttpServer())
        .post(`/api/movies/fetch/cancel/${requestId1}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/movies/fetch/cancel/${requestId2}`)
        .expect(201);
    });
  });

  describe('/api/movies/fetch/jobs (GET)', () => {
    it('should return active jobs', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies/fetch/jobs')
        .expect(200);

      expect(response.body).toHaveProperty('activeJobs');
      expect(Array.isArray(response.body.activeJobs)).toBe(true);
    });
  });

  describe('/api/movies/fetch/cancel/:requestId (POST)', () => {
    it('should handle non-existent job id', async () => {
      const nonExistentId = 'non-existent-job-id';
      const response = await request(app.getHttpServer())
        .post(`/api/movies/fetch/cancel/${nonExistentId}`)
        .expect(201);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('No active fetch job found');
    });
  });
});
