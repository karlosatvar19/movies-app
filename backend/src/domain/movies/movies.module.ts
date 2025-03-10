import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from './entities/movie.entity';
import { MoviesService } from './services/movies.service';
import { MOVIE_REPOSITORY } from './repositories/movie-repository.interface';
import { MovieRepository } from '../../infrastructure/database/mongodb/repositories/movie-repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
  ],
  providers: [
    {
      provide: MOVIE_REPOSITORY,
      useClass: MovieRepository,
    },
    MoviesService,
  ],
  exports: [MOVIE_REPOSITORY, MoviesService],
})
export class MoviesModule {}
