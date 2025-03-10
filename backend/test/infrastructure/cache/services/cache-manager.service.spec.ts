import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheManagerService } from '../../../../src/infrastructure/cache/services/cache-manager.service';
import { Logger } from '@nestjs/common';

describe('CacheManagerService', () => {
  let service: CacheManagerService;
  let cacheManagerMock: any;

  beforeEach(async () => {
    cacheManagerMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      store: {
        keys: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheManagerService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManagerMock,
        },
      ],
    }).compile();

    module.useLogger(new Logger());
    service = module.get<CacheManagerService>(CacheManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should retrieve data from cache', async () => {
      const testKey = 'test-key';
      const testData = { test: 'data' };
      cacheManagerMock.get.mockResolvedValue(testData);

      const result = await service.get(testKey);
      expect(result).toEqual(testData);
      expect(cacheManagerMock.get).toHaveBeenCalledWith(testKey);
    });

    it('should return null when key is not found', async () => {
      const testKey = 'non-existent-key';
      cacheManagerMock.get.mockResolvedValue(null);

      const result = await service.get(testKey);
      expect(result).toBeNull();
      expect(cacheManagerMock.get).toHaveBeenCalledWith(testKey);
    });
  });

  describe('set', () => {
    it('should store data in cache', async () => {
      const testKey = 'test-key';
      const testData = { test: 'data' };
      const ttl = 60;

      await service.set(testKey, testData, ttl);
      expect(cacheManagerMock.set).toHaveBeenCalledWith(testKey, testData, ttl);
    });
  });

  describe('del', () => {
    it('should delete data from cache', async () => {
      const testKey = 'test-key';

      await service.del(testKey);
      expect(cacheManagerMock.del).toHaveBeenCalledWith(testKey);
    });
  });

  describe('invalidateCache', () => {
    it('should clear all cache entries tracked by the service', async () => {
      // First add some keys to the active cache keys set
      await service.set('key1', 'value1');
      await service.set('key2', 'value2');

      // Now invalidate the cache
      await service.invalidateCache();

      // Verify del was called for both keys
      expect(cacheManagerMock.del).toHaveBeenCalledWith('key1');
      expect(cacheManagerMock.del).toHaveBeenCalledWith('key2');
    });
  });

  describe('removeByPattern', () => {
    it('should remove cache entries that match a pattern', async () => {
      // Set some test data
      await service.set('movies_1', 'value1');
      await service.set('movies_2', 'value2');
      await service.set('other_key', 'value3');

      // Clear the mock calls from setting the values
      cacheManagerMock.del.mockClear();

      // Remove by pattern
      await service.removeByPattern('movies_');

      // Verify only matching keys were deleted
      expect(cacheManagerMock.del).toHaveBeenCalledWith('movies_1');
      expect(cacheManagerMock.del).toHaveBeenCalledWith('movies_2');
      expect(cacheManagerMock.del).not.toHaveBeenCalledWith('other_key');
    });

    it('should handle case with no matching keys', async () => {
      // Set some test data with non-matching keys
      await service.set('other_1', 'value1');
      await service.set('other_2', 'value2');

      // Clear the mock calls from setting the values
      cacheManagerMock.del.mockClear();

      // Remove by pattern that doesn't match any keys
      await service.removeByPattern('movies_');

      // Verify no keys were deleted
      expect(cacheManagerMock.del).not.toHaveBeenCalled();
    });
  });
});
