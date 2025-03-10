export interface IJobManager {
  registerJob(jobId: string): void;
  isJobActive(jobId: string): boolean;
  cancelJob(jobId: string): boolean;
  removeJob(jobId: string): void;
  getActiveJobs(): string[];
}

export const JOB_MANAGER = 'JOB_MANAGER';
