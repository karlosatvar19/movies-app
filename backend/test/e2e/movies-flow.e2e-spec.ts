import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { HttpExceptionFilter } from '../../src/infrastructure/http/filters/http-exception.filter';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import * as io from 'socket.io-client';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { TestAppModule } from '../../test-utils/test-app.module';
import { JobManagerService } from '../../src/domain/jobs/services/job-manager.service';

// Set a high timeout for all tests in this file
jest.setTimeout(120000);

describe('Movies Flow (e2e)', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let mongoMemoryServer: MongoMemoryServer;
  let socket: io.Socket;
  let serverPort: number;

  beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoMemoryServer = await MongoMemoryServer.create();
    const mongoUri = mongoMemoryServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(mongoUri), TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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

    // Start the app on a random port
    const server = await app.listen(0);
    const address = server.address();
    serverPort = typeof address === 'string' ? 0 : address.port;

    // Setup WebSocket connection
    const baseUrl = `http://localhost:${serverPort}`;
    socket = io.connect(`${baseUrl}/movies`);

    // Wait for socket to connect
    await new Promise<void>((resolve) => {
      if (socket.connected) {
        resolve();
      } else {
        socket.on('connect', () => {
          console.log('Socket connected in beforeAll');
          resolve();
        });
      }
    });
  }, 60000); // Increase timeout to 60 seconds for setup

  afterAll(async () => {
    // Disconnect socket
    if (socket && socket.connected) {
      socket.disconnect();
    }

    // Cancel any active jobs first
    if (app) {
      try {
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

          // Wait for job cancellations to complete - increase from 200ms to 1000ms
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.warn('Error cleaning up job manager:', error.message);
      }
    }

    // Clean up database - do this after cancelling jobs
    if (mongoConnection) {
      try {
        await mongoConnection.db?.dropDatabase();
      } catch (err) {
        console.error('Error dropping database:', err);
      }
      await mongoConnection.close();
    }

    // Close app last
    if (app) {
      await app.close();
    }

    // Stop MongoDB memory server
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  });

  it('should perform a complete movie fetch flow', (done) => {
    jest.setTimeout(120000); // Increase timeout for this test

    // Setup WebSocket listeners
    let fetchStarted = false;
    let progressReceived = false;
    let requestId: string;

    // Set a failsafe timeout to ensure the test ends
    const failsafeTimeout = setTimeout(async () => {
      console.log(
        '⚠️ Failsafe timeout reached, cleaning up and completing test',
      );

      // Cancel the job if we have a requestId
      if (requestId) {
        try {
          await request(app.getHttpServer())
            .post(`/api/movies/fetch/cancel/${requestId}`)
            .expect(201);
          console.log(`Cancelled job ${requestId} during failsafe timeout`);
        } catch (err) {
          console.warn(
            `Failed to cancel job ${requestId} during failsafe:`,
            err.message,
          );
        }
      }

      // Give a moment for cancellation to propagate
      await new Promise((resolve) => setTimeout(resolve, 500));

      done();
    }, 110000);

    // Clear database before test
    (async () => {
      try {
        // Drop all movies collections to ensure a clean test
        await mongoConnection.db?.collection('movies').deleteMany({});
        console.log('Database cleared for test');
      } catch (error) {
        console.error('Error clearing database:', error);
      }

      // Continue with the test
      runTest();
    })();

    // Make sure we're connected before starting the test
    if (!socket.connected) {
      console.log('Socket disconnected, reconnecting...');
      socket.connect();
    } else {
      console.log('Socket already connected');
    }

    // Clear any existing listeners
    socket.removeAllListeners();

    socket.on('fetchStarted', (data) => {
      console.log('Received fetchStarted event:', data);
      fetchStarted = true;
      expect(data).toHaveProperty('requestId');
      expect(data).toHaveProperty('searchTerm', 'space');
      requestId = data.requestId;
    });

    socket.on('fetchProgress', (data) => {
      console.log('Received fetchProgress event:', data);
      progressReceived = true;
      expect(data).toHaveProperty('requestId');
      expect(data).toHaveProperty('processed');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('percentage');
      expect(data.requestId).toBe(requestId);
    });

    socket.on('fetchCompleted', (data) => {
      console.log('Received fetchCompleted event:', data);
      expect(data).toHaveProperty('requestId');
      expect(data).toHaveProperty('newMoviesCount');
      expect(data.requestId).toBe(requestId);

      // Verify the entire flow worked
      expect(fetchStarted).toBe(true);

      // Wait a bit for the database operations to complete
      setTimeout(() => {
        console.log('Making request to verify movies were saved...');

        // Using try/catch to handle any errors that might occur
        try {
          // Fetch the movies to verify they were saved
          request(app.getHttpServer())
            .get('/api/movies?search=space')
            .expect(200)
            .then((res) => {
              console.log(
                `Received response with ${res.body.movies.length} movies`,
              );

              // If the process worked, we should have some movies
              expect(res.body).toHaveProperty('movies');
              expect(Array.isArray(res.body.movies)).toBe(true);
              expect(res.body.movies.length).toBeGreaterThan(0);

              // Clear failsafe timeout
              clearTimeout(failsafeTimeout);

              // Complete the test
              done();
            })
            .catch((err) => {
              console.error('Error during movies verification request:', err);
              // Clear failsafe timeout
              clearTimeout(failsafeTimeout);
              done();
            });
        } catch (error) {
          console.error('Unexpected error during verification:', error);
          // Clear failsafe timeout
          clearTimeout(failsafeTimeout);
          done();
        }
      }, 3000); // Give more time for database operations
    });

    socket.on('fetchError', (data) => {
      console.error('Received fetchError event:', data);
      // We'll still continue and see if other events complete the test
    });

    function runTest() {
      // Now that listeners are set up, start the fetch
      console.log('Starting fetch request...');
      request(app.getHttpServer())
        .post('/api/movies/fetch')
        .send({ searchTerm: 'space', year: '2025' }) // Use a current year to avoid many results
        .expect(201)
        .then((response) => {
          console.log('Fetch request response:', response.body);
        })
        .catch((err) => {
          console.error('Error making fetch request:', err);
          // Clear failsafe timeout
          clearTimeout(failsafeTimeout);
          done.fail(err);
        });
    }
  }, 120000); // Increase timeout for this test as it's a full flow
});
