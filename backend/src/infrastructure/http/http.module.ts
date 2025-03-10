import { Module } from '@nestjs/common';
import { MoviesController } from './controllers/movies.controller';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { MoviesModule } from '../../domain/movies/movies.module';
import { MoviesCommandsModule } from '../../application/commands/movies/movies-commands.module';
import { CacheModule } from '../cache/cache.module';
import { JobsModule } from '../../domain/jobs/jobs.module';

@Module({
  imports: [
    MoviesModule, // Provides MoviesService
    MoviesCommandsModule, // Provides FetchMoviesHandler
    CacheModule, // Provides CacheManagerService
    JobsModule, // Provides JobManagerService
  ],
  controllers: [MoviesController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class HttpModule {}
