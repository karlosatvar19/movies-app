import { Module } from '@nestjs/common';
import { FetchMoviesHandler } from './fetch-movies.handler';
import { MoviesModule } from '../../../domain/movies/movies.module';
import { OmdbModule } from '../../../infrastructure/external-services/omdb/omdb.module';
import { WebsocketsModule } from '../../../infrastructure/messaging/websockets/websockets.module';
import { CacheModule } from '../../../infrastructure/cache/cache.module';
import { JobsModule } from '../../../domain/jobs/jobs.module';

@Module({
  imports: [
    MoviesModule,
    OmdbModule,
    WebsocketsModule,
    CacheModule,
    JobsModule,
  ],
  providers: [FetchMoviesHandler],
  exports: [FetchMoviesHandler],
})
export class MoviesCommandsModule {}
