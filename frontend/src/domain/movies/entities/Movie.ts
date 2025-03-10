export interface Movie {
  id: string;
  imdbID: string;
  title: string;
  year: string;
  rated?: string;
  released?: string;
  runtime?: string;
  director: string;
  writer?: string;
  actors?: string;
  plot: string;
  language?: string;
  country?: string;
  awards?: string;
  poster: string;
  ratings?: Rating[];
  metascore?: string;
  imdbRating?: string;
  imdbVotes?: string;
  type?: string;
  dvd?: string;
  boxOffice?: string;
  production?: string;
  website?: string;
  response?: string;
}

export interface Rating {
  source: string;
  value: string;
}

export interface MovieSearchParams {
  query?: string;
  page: number;
  limit: number;
}

export interface PaginatedMoviesResponse {
  items: Movie[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FetchMoviesCommand {
  searchTerm: string;
  year?: string;
}

export interface FetchJobStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  total: number;
  searchTerm: string;
  createdAt: string;
  updatedAt: string;
}
