import { validate } from 'class-validator';
import { FetchMovieDto } from '../../../src/application/dto/fetch-movie.dto';

describe('FetchMovieDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new FetchMovieDto();
    dto.searchTerm = 'space';
    dto.year = '2020';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate searchTerm as string', async () => {
    // Test with non-string searchTerm
    const dto = new FetchMovieDto();
    (dto as any).searchTerm = 123;
    dto.year = '2020';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('searchTerm');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should validate year as string', async () => {
    // Test with non-string year
    const dto = new FetchMovieDto();
    dto.searchTerm = 'space';
    (dto as any).year = 2020;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('year');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should allow searchTerm to be optional', async () => {
    const dto = new FetchMovieDto();
    dto.year = '2020';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should allow year to be optional', async () => {
    const dto = new FetchMovieDto();
    dto.searchTerm = 'space';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should allow both properties to be optional', async () => {
    const dto = new FetchMovieDto();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
