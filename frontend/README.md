# Space Movies Frontend

A React-based frontend for the Space Movies application, providing a responsive and intuitive user interface for browsing and searching space-themed movies.

## Architecture

The frontend follows a structured approach with clear separation of concerns:

```
src/
├── application/        # Application logic
│   ├── errors/         # Error handling
│   ├── hooks/          # Custom React hooks
│   └── store/          # State management
├── domain/             # Domain entities and interfaces
│   ├── movies/         # Movie-related domain models
│   └── notifications/  # Notification-related domain models
├── infrastructure/     # External integrations
│   ├── api/            # API client
│   ├── repositories/   # Repository implementations
│   └── websocket/      # WebSocket client
├── presentation/       # UI components
│   └── components/     # React components
└── App.tsx            # Main application component
```

### Key Components

- **Application Layer**: Manages application state and logic
- **Domain Layer**: Contains domain models and interfaces
- **Infrastructure Layer**: Handles external service interactions
- **Presentation Layer**: Provides the user interface

## Technology Stack

- **React**: JavaScript library for building user interfaces
- **TypeScript**: Static typing for improved code quality
- **Tailwind CSS**: Utility-first CSS framework
- **daisyUI**: Component library for Tailwind CSS
- **Socket.io-client**: WebSocket client for real-time updates
- **Axios**: HTTP client for API requests
- **Vitest**: Testing framework
- **React Testing Library**: Testing utilities for React components

## Features

- **Movie Browsing**: View all movies with pagination
- **Search Functionality**: Search movies by title, director, or plot
- **Movie Details**: View detailed information about each movie
- **Data Fetching**: Initiate and monitor new data fetches
- **Real-time Updates**: WebSocket-based progress indicators
- **Responsive Design**: Mobile-friendly layout

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Local Setup

1. Clone the repository and navigate to the frontend directory:

   ```
   git clone <repository-url>
   cd space-movies/frontend
   ```

2. Install dependencies:

   ```
   pnpm install
   ```

3. Create a `.env` file with the following content:

   ```
   VITE_API_URL=http://localhost:3000
   ```

4. Start the development server:

   ```
   pnpm dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Testing

The frontend includes comprehensive unit and component tests:

```
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate test coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

### Build

To build the application for production:

```
pnpm build
```

The compiled output will be placed in the `dist/` directory.

## Component Structure

- **MovieList**: Displays a grid of movie cards with pagination
- **MovieCard**: Shows movie poster, title, director, and plot
- **SearchBar**: Allows users to search for movies
- **FetchMoviesButton**: Initiates new data fetches from OMDB
- **NotificationCenter**: Displays real-time fetch progress and notifications
- **ErrorBoundary**: Captures and displays errors gracefully

## State Management

The application uses React Context for state management, with the following key contexts:

- **MoviesContext**: Manages movie data, search, and fetch operations
- **WebSocketContext**: Handles real-time communication with the backend

## Docker

The frontend application can be run in a Docker container:

```
# Build image
docker build -t space-movies-frontend .

# Run container
docker run -p 80:80 space-movies-frontend
```
