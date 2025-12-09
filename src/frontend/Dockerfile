# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Angular app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install simple HTTP server for SPA
RUN npm install -g http-server

# Copy built app from builder
COPY --from=builder /app/dist/flight-booking ./dist

# Expose port
EXPOSE 4200

# Start server - serve SPA with history mode fallback
CMD ["http-server", "dist", "-p", "4200", "--brotli", "--gzip", "-s"]
