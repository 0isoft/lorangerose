#!/bin/sh
set -eu

cd /srv/app
docker compose -f docker-compose.prod.yml up -d nginx
docker compose -f docker-compose.prod.yml exec -T nginx nginx -t
