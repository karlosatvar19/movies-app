import { Module } from '@nestjs/common';
import { HttpModule as NestHttpModule } from '@nestjs/axios';
import { OmdbService } from './omdb.service';

@Module({
  imports: [NestHttpModule],
  providers: [OmdbService],
  exports: [OmdbService],
})
export class OmdbModule {}
