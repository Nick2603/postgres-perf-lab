#!/bin/sh
set -e

echo "Waiting for database and applying migrations..."
npx dbmate --wait up

echo "Starting application..."
exec node dist/index.js
