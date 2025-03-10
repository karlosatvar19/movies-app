import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { HttpExceptionFilter } from '../../src/infrastructure/http/filters/http-exception.filter';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { TestAppModule } from '../../test-utils/test-app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let mongoMemoryServer: MongoMemoryServer;

  beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoMemoryServer = await MongoMemoryServer.create();
    const mongoUri = mongoMemoryServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(mongoUri), TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same global pipes and filters as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());
    app.enableCors();
    app.setGlobalPrefix('api');

    await app.init();

    // Get MongoDB connection for cleanup
    mongoConnection = app.get(getConnectionToken());
  }, 60000);

  afterAll(async () => {
    // Cancel any active jobs first
    if (app) {
      try {
        // Import the service class itself
        const { JobManagerService } = await import(
          '../../src/domain/jobs/services/job-manager.service'
        );
        const jobManager = app.get(JobManagerService);
        if (jobManager) {
          const activeJobs = jobManager.getActiveJobs();
          console.log(
            `Cancelling ${activeJobs.length} active jobs during cleanup`,
          );

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

          // Wait for job cancellations to complete - give it time to clean up
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.warn('Error cleaning up job manager:', error.message);
      }
    }

    // Clean up database after cancelling jobs
    if (mongoConnection) {
      try {
        await mongoConnection.db?.dropDatabase();
      } catch (error) {
        console.error('Error dropping database:', error);
      }
      await mongoConnection.close();
    }

    // Close app after database cleanup
    if (app) {
      await app.close();
    }

    // Stop memory server last
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  });

  describe('/movies', () => {
    it('GET /movies should return movies list', () => {
      return request(app.getHttpServer())
        .get('/api/movies')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('movies');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(res.body).toHaveProperty('totalPages');
          expect(res.body).toHaveProperty('totalItems');
        });
    });

    it('GET /movies?search=space should return filtered results', () => {
      return request(app.getHttpServer())
        .get('/api/movies?search=space')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('movies');
          // We can't test exact content since this is integration
          // but we can verify the structure
          expect(Array.isArray(res.body.movies)).toBe(true);
        });
    });

    it('GET /movies/invalid-id should return 404', () => {
      return request(app.getHttpServer())
        .get('/api/movies/000000000000000000000000')
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 404);
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('path');
        });
    });

    it('POST /movies/fetch should start a job and return request ID', () => {
      return request(app.getHttpServer())
        .post('/api/movies/fetch')
        .send({ searchTerm: 'space', year: '2020' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('requestId');
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Started fetching space movies');
          expect(typeof res.body.requestId).toBe('string');
        });
    });
  });
});
