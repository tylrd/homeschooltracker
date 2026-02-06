#!/bin/sh
set -e

if [ "$1" = "migrate" ]; then
  echo "Running database migrations..."
  node /app/migrate.js
  echo "Migrations complete."
else
  exec node server.js
fi
