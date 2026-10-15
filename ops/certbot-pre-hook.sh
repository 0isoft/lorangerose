#!/bin/sh
set -eu

cd /srv/app
docker compose -f docker-compose.prod.yml stop nginx
