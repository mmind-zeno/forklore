#!/bin/bash
set -e
echo "=== Deploying Recipe App v0.1.0 to recipes.mmind.space ==="
cd /opt/recipes
docker compose down 2>/dev/null || true
docker compose build --no-cache
docker compose up -d
echo "=== Deployment complete ==="
echo "App running at http://recipes.mmind.space (or http://195.201.145.97:3001)"
