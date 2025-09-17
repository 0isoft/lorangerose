#!/usr/bin/env bash
set -euo pipefail

echo "Running Prisma generate…"
npx prisma generate

echo "Applying migrations (safe in CI/CD if your workflow expects it)…"
npx prisma migrate deploy

echo "Starting API…"
node dist/server.js
