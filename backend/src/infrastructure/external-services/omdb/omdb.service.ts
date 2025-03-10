// src/infrastructure/external-services/omdb/omdb.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, lastValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class OmdbService {
  private readonly logger = new Logger(OmdbService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OMDB_API_KEY');
    if (!apiKey) {
      throw new Error(
        'OMDB_API_KEY is not defined in the environment variables',
      );
    }
    this.apiKey = apiKey;
    this.apiUrl = this.configService.get<string>(
      'OMDB_API_URL',
      'http://www.omdbapi.com',
    );
  }

  async searchMoviesByTitle(title: string, year?: string, page: number = 1) {
    try {
      const params = {
        apikey: this.apiKey,
        s: title,
        y: year,
        page: page.toString(),
        type: 'movie',
      };

      const response = await lastValueFrom(
        this.httpService.get(this.apiUrl, { params }).pipe(
          map((res) => res.data),
          catchError((error: AxiosError) => {
            this.logger.error(
              'Failed to fetch movies from OMDB: ' + error.message,
            );
            throw new Error('Failed to fetch data from OMDB API');
          }),
        ),
      );

      return response;
    } catch (error) {
      this.logger.error(`Error in searchMoviesByTitle: ${error.message}`);
      throw error;
    }
  }

  async getMovieDetails(imdbId: string) {
    try {
      const params = {
        apikey: this.apiKey,
        i: imdbId,
        plot: 'full',
      };

      const response = await lastValueFrom(
        this.httpService.get(this.apiUrl, { params }).pipe(
          map((res) => res.data),
          catchError((error: AxiosError) => {
            this.logger.error(
              'Failed to fetch movie details from OMDB: ' + error.message,
            );
            throw new Error('Movie not found!');
          }),
        ),
      );

      return response;
    } catch (error) {
      this.logger.error(`Error in getMovieDetails: ${error.message}`);
      throw error;
    }
  }
}
