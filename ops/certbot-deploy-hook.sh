#!/bin/sh
set -eu

cd /srv/app
/home/ubuntu/.docker/cli-plugins/docker-compose -f docker-compose.prod.yml exec -T nginx nginx -t
/home/ubuntu/.docker/cli-plugins/docker-compose -f docker-compose.prod.yml exec -T nginx nginx -s reload
