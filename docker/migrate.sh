#!/bin/bash

# Script to run database migrations in a containerized environment
# This script should be used instead of running migrations automatically on container startup

set -e

# Source the environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Build and run a temporary container to execute migrations
docker build -t landingscout-migrations -f docker/Dockerfile .
docker run --rm \
  --network landingscout_default \
  -e DATABASE_HOST=db \
  -e DATABASE_PORT=${DATABASE_PORT:-3306} \
  -e DATABASE_USER=${DATABASE_USER:-root} \
  -e DATABASE_PASSWORD=${DATABASE_PASSWORD:-root} \
  -e DATABASE_NAME=${DATABASE_NAME:-landingscout} \
  landingscout-migrations \
  npm run migration:run

echo "Migrations completed successfully" 