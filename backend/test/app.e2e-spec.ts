import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { TestAppModule } from '../test-utils/test-app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let mongoMemoryServer: MongoMemoryServer;

  beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoMemoryServer = await MongoMemoryServer.create();
    const mongoUri = mongoMemoryServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(mongoUri), TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  }, 60000); // Increase timeout to 60 seconds

  afterAll(async () => {
    // Cancel any active jobs first
    if (app) {
      try {
        // Import the service class itself
        const { JobManagerService } = await import(
          '../src/domain/jobs/services/job-manager.service'
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

    if (app) {
      await app.close();
    }

    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });
});
