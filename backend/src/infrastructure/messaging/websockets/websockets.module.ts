import { Module } from '@nestjs/common';
import { FetchMoviesGateway } from './gateways/fetch-movies.gateway';

@Module({
  providers: [FetchMoviesGateway],
  exports: [FetchMoviesGateway],
})
export class WebsocketsModule {}
