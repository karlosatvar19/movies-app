// src/infrastructure/cache/services/cache-manager.service.ts
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheManagerService {
  private readonly logger = new Logger(CacheManagerService.name);
  private readonly activeCacheKeys: Set<string> = new Set();

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.cacheManager.get<T>(key);
    if (value) {
      this.logger.log(`Cache hit for: ${key}`);
    }
    return value;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.activeCacheKeys.add(key);
    await this.cacheManager.set(key, value, ttl);
    this.logger.log(`Cache set for: ${key}`);
  }

  async del(key: string): Promise<void> {
    this.activeCacheKeys.delete(key);
    await this.cacheManager.del(key);
    this.logger.log(`Cache deleted for: ${key}`);
  }

  async invalidateCache(): Promise<void> {
    for (const key of this.activeCacheKeys) {
      await this.cacheManager.del(key);
    }
    this.activeCacheKeys.clear();
    this.logger.log('Cache invalidated');
  }

  // New method to remove cache entries by pattern
  async removeByPattern(pattern: string): Promise<void> {
    const keysToRemove = Array.from(this.activeCacheKeys).filter((key) =>
      key.includes(pattern),
    );

    this.logger.log(
      `Removing ${keysToRemove.length} cache entries matching pattern: ${pattern}`,
    );

    for (const key of keysToRemove) {
      await this.del(key);
    }
  }
}
