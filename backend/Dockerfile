FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy all files
COPY . .

# Verify that tsconfig.json exists
RUN ls -la && echo "TypeScript configs:" && ls -la tsconfig*

# Install dependencies
RUN pnpm install

# Build the application
RUN pnpm build

# Verify that build succeeded
RUN ls -la dist/ && ls -la dist/src/

# Expose port for both HTTP and WebSockets
EXPOSE 3000

# Start the application with the correct path
CMD ["node", "dist/src/main.js"]