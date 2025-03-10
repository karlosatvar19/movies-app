import { Module } from '@nestjs/common';
import { MoviesCommandsModule } from '../commands/movies/movies-commands.module';

@Module({
  imports: [MoviesCommandsModule],
  exports: [MoviesCommandsModule],
})
export class TasksModule {}
