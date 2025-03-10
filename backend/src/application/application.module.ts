import { Module } from '@nestjs/common';
import { CommandsModule } from './commands/commands.module';

@Module({
  imports: [CommandsModule],
  exports: [CommandsModule],
})
export class ApplicationModule {}
