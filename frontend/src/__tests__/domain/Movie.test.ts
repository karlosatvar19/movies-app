import { describe, it, expect } from "vitest";
import { Movie } from "../../domain/movies/entities/Movie";

describe("Movie Entity", () => {
  it("should create a movie with all required properties", () => {
    const movie: Movie = {
      id: "123",
      imdbID: "tt0816692",
      title: "Interstellar",
      year: "2014",
      director: "Christopher Nolan",
      poster: "http://example.com/poster.jpg",
      plot: "A team of explorers travel through a wormhole in space.",
      rated: "PG-13",
      released: "07 Nov 2014",
      runtime: "169 min",
      writer: "Jonathan Nolan, Christopher Nolan",
      actors: "Matthew McConaughey, Anne Hathaway, Jessica Chastain",
      language: "English",
      country: "USA, UK, Canada",
      awards: "Won 1 Oscar. 44 wins & 148 nominations total",
      metascore: "74",
      imdbRating: "8.6",
      imdbVotes: "1,750,000",
      type: "movie",
      dvd: "31 Mar 2015",
      boxOffice: "$188,020,017",
      production: "Paramount Pictures",
      website: "https://www.interstellarmovie.com/",
      response: "True",
    };

    expect(movie.id).toBe("123");
    expect(movie.imdbID).toBe("tt0816692");
    expect(movie.title).toBe("Interstellar");
    expect(movie.year).toBe("2014");
    expect(movie.director).toBe("Christopher Nolan");
  });

  it("should create a movie with only required properties", () => {
    const movie: Movie = {
      id: "123",
      imdbID: "tt0816692",
      title: "Interstellar",
      year: "2014",
      director: "Christopher Nolan",
      poster: "http://example.com/poster.jpg",
      plot: "A team of explorers travel through a wormhole in space.",
    };

    expect(movie.id).toBe("123");
    expect(movie.imdbID).toBe("tt0816692");
    expect(movie.title).toBe("Interstellar");
    expect(movie.imdbRating).toBeUndefined();
    expect(movie.runtime).toBeUndefined();
  });
});
