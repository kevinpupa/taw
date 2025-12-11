# Angular Frontend - Docker Configuration
# Development ready with live reload support

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port for Angular dev server
EXPOSE 4200

# Start Angular development server
CMD ["npm", "start"]
