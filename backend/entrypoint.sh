#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Running database seed..."
npx prisma db seed || echo "Seed already applied or skipped"

echo "Starting backend server..."
exec node dist/main
