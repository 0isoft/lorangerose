#!/bin/sh
set -e
echo "Prisma migrate deploy..."
npx prisma migrate deploy
echo "Starting server..."
node dist/index.js
