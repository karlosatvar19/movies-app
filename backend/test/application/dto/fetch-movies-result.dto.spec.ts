import { FetchMoviesResult } from '../../../src/application/commands/movies/fetch-movies-result.dto';

describe('FetchMoviesResult', () => {
  it('should create a successful result', () => {
    const result = new FetchMoviesResult(true, 'Success message', 5);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Success message');
    expect(result.count).toBe(5);
  });

  it('should create a failed result', () => {
    const result = new FetchMoviesResult(false, 'Error message', 0);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Error message');
    expect(result.count).toBe(0);
  });

  it('should initialize properties via constructor', () => {
    // Test that constructor properly initializes values
    const result = new FetchMoviesResult(true, 'Initial message', 10);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Initial message');
    expect(result.count).toBe(10);
  });
});
