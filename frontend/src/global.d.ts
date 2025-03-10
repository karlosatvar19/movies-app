/// <reference types="vitest/globals" />

// Import module declarations
declare module "*.svg" {
  import React = require("react");
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.json" {
  const content: Record<string, any>;
  export default content;
}

// Declare component module types to fix import errors
declare module "./MovieCard" {
  import { Movie } from "../../domain/movies/entities/Movie";

  interface MovieCardProps {
    movie: Movie;
  }

  const MovieCard: React.FC<MovieCardProps>;
  export default MovieCard;
}

// Add global window properties
interface Window {
  ResizeObserver: typeof ResizeObserver;
}

// Define import.meta for environment variables
interface ImportMeta {
  env: {
    VITE_API_URL: string;
    [key: string]: string;
  };
}
