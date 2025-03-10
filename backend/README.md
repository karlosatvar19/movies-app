# Space Movies Backend

The backend service for the Space Movies application, built with NestJS and following clean architecture principles.

## Architecture

The backend follows a domain-driven design approach with clear separation of concerns:

```
src/
├── application/        # Application services and use cases
├── domain/            # Domain entities, repositories, and services
├── infrastructure/    # Implementation details (database, external services)
│   ├── database/      # MongoDB connection and repositories
│   ├── external-services/ # OMDB API client
│   ├── http/          # HTTP controllers
│   ├── cache/         # Redis cache service
│   └── messaging/     # WebSockets implementation
└── main.ts           # Application entry point
```

### Key Components

- **Domain Layer**: Contains core business logic, entities, and repository interfaces
- **Application Layer**: Orchestrates use cases and business operations
- **Infrastructure Layer**: Implements external integrations and technical concerns

## Technology Stack

- **NestJS**: Progressive Node.js framework for building server-side applications
- **MongoDB**: Primary data store for movie information
- **Mongoose**: MongoDB object modeling for Node.js
- **Socket.io**: Real-time bidirectional event-based communication
- **Redis**: Cache store and rate limiting
- **Axios**: HTTP client for external API requests
- **Jest**: Testing framework

## API Endpoints

| Method | Endpoint                        | Description                     |
| ------ | ------------------------------- | ------------------------------- |
| GET    | /movies                         | Get all movies with pagination  |
| GET    | /movies/:id                     | Get a movie by ID               |
| GET    | /movies/search                  | Search movies by query          |
| POST   | /movies/fetch                   | Start fetching movies from OMDB |
| GET    | /movies/fetch/jobs              | Get active fetch jobs           |
| POST   | /movies/fetch/cancel/:requestId | Cancel a fetch job              |

## WebSocket Events

| Event           | Description                        | Data Format                                                                              |
| --------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| fetch:progress  | Emitted during fetch progress      | `{ jobId: string, progress: number, total: number, searchTerm: string, status: string }` |
| fetch:completed | Emitted when a fetch job completes | `{ jobId: string, movies: number, searchTerm: string }`                                  |
| fetch:error     | Emitted when a fetch job errors    | `{ jobId: string, error: string }`                                                       |

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Local Setup

1. Clone the repository and navigate to the backend directory:

   ```
   git clone <repository-url>
   cd space-movies/backend
   ```

2. Install dependencies:

   ```
   pnpm install
   ```

3. Create a `.env` file with the following content:

   ```
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/space-movies

   # OMDB API
   OMDB_API_KEY=your_api_key_here

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # App settings
   PORT=3000
   NODE_ENV=development
   ```

4. Start the development server:
   ```
   pnpm start:dev
   ```

### Testing

The backend includes unit, integration, and e2e tests:

```
# Run all tests
pnpm test

# Run unit tests
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run e2e tests
pnpm test:e2e

# Generate test coverage
pnpm test:cov
```

### Build

To build the application for production:

```
pnpm build
```

The compiled output will be placed in the `dist/` directory.

## Configuration Options

| Environment Variable | Description                   | Default                                |
| -------------------- | ----------------------------- | -------------------------------------- |
| MONGODB_URI          | MongoDB connection string     | mongodb://localhost:27017/space-movies |
| OMDB_API_KEY         | Your OMDB API key             | -                                      |
| REDIS_HOST           | Redis host                    | localhost                              |
| REDIS_PORT           | Redis port                    | 6379                                   |
| PORT                 | Application port              | 3000                                   |
| NODE_ENV             | Environment mode              | development                            |
| CACHE_TTL            | Cache time-to-live in seconds | 3600                                   |
| THROTTLE_TTL         | Throttle window in seconds    | 60                                     |
| THROTTLE_LIMIT       | Request limit per window      | 20                                     |

## Docker

The backend application can be run in a Docker container:

```
# Build image
docker build -t space-movies-backend .

# Run container
docker run -p 3000:3000 -e OMDB_API_KEY=your_api_key_here space-movies-backend
```
