import { IsString, IsOptional } from 'class-validator';

export class FetchMovieDto {
  @IsString()
  @IsOptional()
  searchTerm?: string;

  @IsString()
  @IsOptional()
  year?: string;
}
