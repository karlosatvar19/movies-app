import { Module } from '@nestjs/common';
import { CacheManagerService } from './services/cache-manager.service';
import { HttpCacheInterceptor } from './interceptors/http-cache.interceptor';

@Module({
  providers: [CacheManagerService, HttpCacheInterceptor],
  exports: [CacheManagerService, HttpCacheInterceptor],
})
export class CacheModule {}
