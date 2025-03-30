FROM node:20-slim

# Install dependencies for Playwright
RUN apt-get update && apt-get install -y \
    libgtk-3-0 \
    libasound2 \
    libxtst6 \
    libxss1 \
    libnss3 \
    libnspr4 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libegl1 \
    libpangocairo-1.0-0 \
    libglib2.0-0 \
    fonts-liberation \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Create directories for logs and screenshots
RUN mkdir -p /app/logs /app/screenshots \
    && chmod -R 777 /app/logs /app/screenshots

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production

# Expose the application port
EXPOSE 3000

# Create an entrypoint script
RUN echo '#!/bin/sh\n\
npm run migration:run\n\
npm run start:prod\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Start the application with migrations
CMD ["/app/entrypoint.sh"] 