import { Test, TestingModule } from '@nestjs/testing';
import { Socket, Server } from 'socket.io';
import { FetchMoviesGateway } from '../../../../../src/infrastructure/messaging/websockets/gateways/fetch-movies.gateway';
import { ConfigService } from '@nestjs/config';

describe('FetchMoviesGateway', () => {
  let gateway: FetchMoviesGateway;
  let mockServer: any;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'WEBSOCKET_PORT') return 3001;
        if (key === 'FRONTEND_URL') return 'http://localhost:3000';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FetchMoviesGateway,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    gateway = module.get<FetchMoviesGateway>(FetchMoviesGateway);
    gateway.server = mockServer as Server;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('connection handling', () => {
    it('should handle connection', () => {
      const mockClient = {
        id: 'test-client-id',
      } as Socket;

      gateway.handleConnection(mockClient);
      // This test just ensures no errors are thrown
      expect(gateway).toBeDefined();
    });

    it('should handle disconnection', () => {
      const mockClient = {
        id: 'test-client-id',
      } as Socket;

      gateway.handleDisconnect(mockClient);
      // This test just ensures no errors are thrown
      expect(gateway).toBeDefined();
    });
  });

  describe('event emitting', () => {
    it('should emit fetch:progress event with pending status when starting a fetch', () => {
      const requestId = 'test-request-id';
      const searchTerm = 'space';

      gateway.sendFetchStarted(requestId, searchTerm);

      expect(mockServer.emit).toHaveBeenCalledWith('fetch:progress', {
        jobId: requestId,
        searchTerm: 'space',
        status: 'pending',
        progress: 0,
        total: 100,
        timestamp: expect.any(Number),
      });
    });

    it('should emit fetch:progress event with processing status', () => {
      const requestId = 'test-request-id';
      const processed = 5;
      const total = 10;
      const searchTerm = 'test-search';

      gateway.sendFetchProgress(requestId, processed, total, searchTerm);

      expect(mockServer.emit).toHaveBeenCalledWith('fetch:progress', {
        jobId: requestId,
        progress: processed,
        total,
        searchTerm,
        status: 'processing',
        timestamp: expect.any(Number),
      });
    });

    it('should emit fetch:completed event', () => {
      const requestId = 'test-request-id';
      const newMoviesCount = 5;
      const searchTerm = 'test-search';

      gateway.sendFetchCompleted(requestId, newMoviesCount, searchTerm);

      expect(mockServer.emit).toHaveBeenCalledWith('fetch:completed', {
        jobId: requestId,
        movies: newMoviesCount,
        searchTerm,
      });
    });

    it('should emit fetch:error event', () => {
      const requestId = 'test-request-id';
      const error = 'Test error message';

      gateway.sendFetchError(requestId, error);

      expect(mockServer.emit).toHaveBeenCalledWith('fetch:error', {
        jobId: requestId,
        error,
      });
    });
  });
});
