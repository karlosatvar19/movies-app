import { Test, TestingModule } from '@nestjs/testing';
import { HttpExceptionFilter } from '../../../../src/infrastructure/http/filters/http-exception.filter';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);

    // Mock Logger to avoid console logs during tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation(jest.fn());
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should handle HttpException and format response', () => {
      // Create mock request and response objects
      const mockRequest = {
        url: '/test-url',
        method: 'GET',
      } as unknown as Request;

      const mockJsonResponse = jest.fn();
      const mockResponse = {
        status: jest.fn().mockImplementation(() => ({
          json: mockJsonResponse,
        })),
      } as unknown as Response;

      // Create a test exception
      const statusCode = HttpStatus.NOT_FOUND;
      const message = 'Resource not found';
      const exception = new HttpException(message, statusCode);

      // Mock Date.toISOString to return consistent value
      const mockDate = '2025-03-08T01:00:00.000Z';
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      // Call the filter
      filter.catch(exception, {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as any);

      // Verify response was properly formatted
      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        statusCode,
        message: { message },
        timestamp: mockDate,
        path: '/test-url',
      });
    });

    it('should handle HttpException with string error', () => {
      // Create mock request and response objects
      const mockRequest = {
        url: '/test-url',
        method: 'GET',
      } as unknown as Request;

      const mockJsonResponse = jest.fn();
      const mockResponse = {
        status: jest.fn().mockImplementation(() => ({
          json: mockJsonResponse,
        })),
      } as unknown as Response;

      // Create a test exception with a string response
      const statusCode = HttpStatus.BAD_REQUEST;
      const message = 'Bad request';

      // Mock the exception to return a string response
      const exception = new HttpException(message, statusCode);
      jest.spyOn(exception, 'getResponse').mockReturnValue(message);

      // Mock Date.toISOString to return consistent value
      const mockDate = '2025-03-08T01:00:00.000Z';
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      // Call the filter
      filter.catch(exception, {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as any);

      // Verify response was properly formatted
      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        statusCode,
        message: { message },
        timestamp: mockDate,
        path: '/test-url',
      });
    });
  });
});
