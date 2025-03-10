import { Test, TestingModule } from '@nestjs/testing';
import { JobManagerService } from '../../../../src/domain/jobs/services/job-manager.service';

describe('JobManagerService', () => {
  let service: JobManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobManagerService],
    }).compile();

    service = module.get<JobManagerService>(JobManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('job management', () => {
    const jobId = 'test-job-id';

    it('should register a job', () => {
      service.registerJob(jobId);
      expect(service.isJobActive(jobId)).toBe(true);
    });

    it('should check if a job is active', () => {
      expect(service.isJobActive(jobId)).toBe(false);

      service.registerJob(jobId);
      expect(service.isJobActive(jobId)).toBe(true);
    });

    it('should cancel a job', () => {
      service.registerJob(jobId);
      expect(service.isJobActive(jobId)).toBe(true);

      const result = service.cancelJob(jobId);
      expect(result).toBe(true);
      expect(service.isJobActive(jobId)).toBe(false);
    });

    it('should return false when canceling non-existent job', () => {
      const result = service.cancelJob('non-existent-job');
      expect(result).toBe(false);
    });

    it('should remove a job', () => {
      service.registerJob(jobId);
      expect(service.isJobActive(jobId)).toBe(true);

      service.removeJob(jobId);
      expect(service.isJobActive(jobId)).toBe(false);
    });

    it('should get a list of active jobs', () => {
      const jobId1 = 'job-1';
      const jobId2 = 'job-2';

      service.registerJob(jobId1);
      service.registerJob(jobId2);

      const activeJobs = service.getActiveJobs();
      expect(activeJobs).toContain(jobId1);
      expect(activeJobs).toContain(jobId2);
      expect(activeJobs.length).toBe(2);
    });
  });
});
