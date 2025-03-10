import { Module } from '@nestjs/common';
import { MoviesCommandsModule } from './movies/movies-commands.module';

@Module({
  imports: [MoviesCommandsModule],
  exports: [MoviesCommandsModule],
})
export class CommandsModule {}
