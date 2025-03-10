// src/infrastructure/messaging/websockets/gateways/fetch-movies.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'movies',
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost']
        : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  path: '/socket.io',
})
export class FetchMoviesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(FetchMoviesGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly configService: ConfigService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendFetchStarted(requestId: string, searchTerm: string) {
    this.logger.log(`Emitting fetchStarted event for request ${requestId}`);
    this.server.emit('fetch:progress', {
      jobId: requestId,
      searchTerm,
      progress: 0,
      total: 100,
      status: 'pending',
      timestamp: Date.now(),
    });
  }

  sendFetchProgress(
    requestId: string,
    processed: number,
    total: number,
    searchTerm: string,
  ) {
    this.logger.log(
      `Emitting fetchProgress event for request ${requestId}: ${processed}/${total}`,
    );
    this.server.emit('fetch:progress', {
      jobId: requestId,
      progress: processed,
      total,
      status: 'processing',
      searchTerm,
      timestamp: Date.now(),
    });
  }

  sendFetchCompleted(
    requestId: string,
    newMoviesCount: number,
    searchTerm: string,
  ) {
    this.logger.log(
      `Emitting fetchCompleted event for request ${requestId}: ${newMoviesCount} movies`,
    );
    this.server.emit('fetch:completed', {
      jobId: requestId,
      movies: newMoviesCount,
      searchTerm,
    });
  }

  sendFetchError(requestId: string, error: string) {
    this.logger.log(
      `Emitting fetchError event for request ${requestId}: ${error}`,
    );
    this.server.emit('fetch:error', { jobId: requestId, error });
  }
}
