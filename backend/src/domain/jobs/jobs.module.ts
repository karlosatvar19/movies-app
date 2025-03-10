import { Module } from '@nestjs/common';
import { JobManagerService } from './services/job-manager.service';

@Module({
  providers: [JobManagerService],
  exports: [JobManagerService],
})
export class JobsModule {}
