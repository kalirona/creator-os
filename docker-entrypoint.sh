#!/bin/sh
set -e

echo "🚀 CreatorOS Docker entrypoint starting..."

# Ensure data directory exists
mkdir -p /app/data

# Initialize the SQLite database schema (idempotent)
echo "🗄️  Initializing database schema..."
DATABASE_URL="file:/app/data/creatoros.db" bunx prisma db push --skip-generate --accept-data-loss
echo "✅ Database schema ready"

# Start the Next.js standalone server
echo "🚀 Starting Next.js server on port ${PORT:-3007}..."
exec bun server.js