#!/bin/sh
set -e

echo "[entrypoint] Running Prisma migrate deploy…"
npx prisma migrate deploy

echo "[entrypoint] Starting server…"
node dist/index.js