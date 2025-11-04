#!/bin/sh

# Docker Entrypoint Script
# Runs database migrations before starting the application

set -e

echo "Starting MedInventory API..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "DATABASE_URL is configured"

# Run Prisma migrations
echo "Running database migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "Migrations completed successfully"
else
  echo "Migration failed"
  exit 1
fi

# Generate Prisma Client (in case it's not up to date)
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Start the application
echo "Starting NestJS application..."
exec node dist/main.js
