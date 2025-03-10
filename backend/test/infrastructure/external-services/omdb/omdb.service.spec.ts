import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { OmdbService } from '../../../../src/infrastructure/external-services/omdb/omdb.service';

describe('OmdbService', () => {
  let service: OmdbService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockApiKey = 'test-api-key';
  const mockApiUrl = 'http://test-api.com';

  const mockMovieSearchResponse = {
    Search: [
      {
        Title: 'Space Movie',
        Year: '2020',
        imdbID: 'tt1234',
        Type: 'movie',
        Poster: 'test-poster.jpg',
      },
    ],
    totalResults: '1',
    Response: 'True',
  };

  const mockMovieDetailsResponse = {
    Title: 'Space Movie',
    Year: '2020',
    Rated: 'PG',
    Released: '01 Jan 2020',
    Runtime: '120 min',
    Genre: 'Sci-Fi',
    Director: 'Director Name',
    Plot: 'Test plot',
    Poster: 'test-poster.jpg',
    imdbID: 'tt1234',
    Type: 'movie',
    Response: 'True',
  };

  beforeEach(async () => {
    const httpServiceMock = {
      get: jest.fn(),
    };

    const configServiceMock = {
      get: jest.fn((key, defaultValue) => {
        if (key === 'OMDB_API_KEY') return mockApiKey;
        if (key === 'OMDB_API_URL') return mockApiUrl;
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OmdbService,
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<OmdbService>(OmdbService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchMoviesByTitle', () => {
    it('should return search results when search is successful', async () => {
      const response: AxiosResponse = {
        data: mockMovieSearchResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://test-api.com' } as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(response));

      const result = await service.searchMoviesByTitle('space', '2020', 1);

      expect(result).toEqual(mockMovieSearchResponse);
      expect(httpService.get).toHaveBeenCalledWith(mockApiUrl, {
        params: {
          apikey: mockApiKey,
          s: 'space',
          y: '2020',
          page: '1',
          type: 'movie',
        },
      });
    });

    it('should throw an error when API request fails', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => throwError(() => new Error('API error')));

      await expect(service.searchMoviesByTitle('space')).rejects.toThrow(
        'Failed to fetch data from OMDB API',
      );
    });

    it('should handle whitespace in search terms properly', async () => {
      const response: AxiosResponse = {
        data: mockMovieSearchResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://test-api.com' } as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(response));

      // Test with whitespace in the search term
      const result = await service.searchMoviesByTitle(
        '  space  movie  ',
        '2020',
        1,
      );

      expect(result).toEqual(mockMovieSearchResponse);
      expect(httpService.get).toHaveBeenCalledWith(mockApiUrl, {
        params: {
          apikey: mockApiKey,
          s: '  space  movie  ', // The service currently doesn't normalize whitespace
          y: '2020',
          page: '1',
          type: 'movie',
        },
      });
    });

    it('should handle empty or null year parameter', async () => {
      const response: AxiosResponse = {
        data: mockMovieSearchResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://test-api.com' } as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(response));

      // Test with undefined year parameter
      const result = await service.searchMoviesByTitle('space');

      expect(result).toEqual(mockMovieSearchResponse);
      expect(httpService.get).toHaveBeenCalledWith(mockApiUrl, {
        params: {
          apikey: mockApiKey,
          s: 'space',
          y: undefined,
          page: '1',
          type: 'movie',
        },
      });
    });

    it('should handle network timeouts gracefully', async () => {
      jest.spyOn(httpService, 'get').mockImplementationOnce(() =>
        throwError(() => {
          const error: any = new Error('Timeout of 5000ms exceeded');
          error.code = 'ECONNABORTED';
          return error;
        }),
      );

      await expect(service.searchMoviesByTitle('space')).rejects.toThrow(
        'Failed to fetch data from OMDB API',
      );
    });
  });

  describe('getMovieDetails', () => {
    it('should return movie details when request is successful', async () => {
      const response: AxiosResponse = {
        data: mockMovieDetailsResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://test-api.com' } as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(response));

      const result = await service.getMovieDetails('tt1234');

      expect(result).toEqual(mockMovieDetailsResponse);
      expect(httpService.get).toHaveBeenCalledWith(mockApiUrl, {
        params: {
          apikey: mockApiKey,
          i: 'tt1234',
          plot: 'full',
        },
      });
    });

    it('should throw an error when API request fails', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => throwError(() => new Error('API error')));

      await expect(service.getMovieDetails('tt1234')).rejects.toThrow(
        'Movie not found!',
      );
    });
  });
});
