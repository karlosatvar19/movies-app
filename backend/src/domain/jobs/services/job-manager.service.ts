// src/domain/jobs/services/job-manager.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { IJobManager } from '../interfaces/job-manager.interface';

@Injectable()
export class JobManagerService implements IJobManager {
  private readonly logger = new Logger(JobManagerService.name);
  private activeJobs: Set<string> = new Set();

  registerJob(jobId: string): void {
    this.activeJobs.add(jobId);
    this.logger.log(`Job registered: ${jobId}`);
  }

  isJobActive(jobId: string): boolean {
    return this.activeJobs.has(jobId);
  }

  cancelJob(jobId: string): boolean {
    if (this.activeJobs.has(jobId)) {
      this.activeJobs.delete(jobId);
      this.logger.log(`Job cancelled: ${jobId}`);
      return true;
    }
    return false;
  }

  removeJob(jobId: string): void {
    this.activeJobs.delete(jobId);
    this.logger.log(`Job removed: ${jobId}`);
  }

  getActiveJobs(): string[] {
    return Array.from(this.activeJobs);
  }
}
