import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

import { HttpModule } from '../src/infrastructure/http/http.module';
import { WebsocketsModule } from '../src/infrastructure/messaging/websockets/websockets.module';
import { ApplicationModule } from '../src/application/application.module';
import { ConfigService } from '@nestjs/config';
import { TestAppController } from './test-app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from '../src/domain/movies/entities/movie.entity';
import { MOVIE_REPOSITORY } from '../src/domain/movies/repositories/movie-repository.interface';
import { MovieRepository } from '../src/infrastructure/database/mongodb/repositories/movie-repository';
import { MoviesService } from '../src/domain/movies/services/movies.service';
import { JobManagerService } from '../src/domain/jobs/services/job-manager.service';

/**
 * This is a test app module that doesn't import the database module.
 * It's used for E2E tests where we want to use MongoMemoryServer instead.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        ttl: configService.get('CACHE_TTL', 3600),
      }),
    }),
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
    HttpModule,
    WebsocketsModule,
    ApplicationModule,
  ],
  controllers: [TestAppController],
  providers: [
    {
      provide: MOVIE_REPOSITORY,
      useClass: MovieRepository,
    },
    MoviesService,
    JobManagerService,
  ],
  exports: [MongooseModule],
})
export class TestAppModule {}
