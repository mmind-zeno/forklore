# Deploy Forklore v0.5.0 to Hetzner
# Usage: .\deploy-local.ps1 [ssh-host]
param([string]$SshHost = "hetzner")

$ErrorActionPreference = "Stop"
Write-Host "=== Deploying Forklore v0.5.0 to $SshHost ===" -ForegroundColor Cyan

# Copy webapp (exclude node_modules, .next)
$deployDir = "webapp-deploy"
if (Test-Path $deployDir) { Remove-Item -Recurse -Force $deployDir }
New-Item -ItemType Directory -Path $deployDir | Out-Null
robocopy webapp "$deployDir\webapp" /E /XD node_modules .next .git /NFL /NDL /NJH /NJS
Copy-Item docker-compose.yml, nginx-recipes.conf, .env.example $deployDir

Write-Host "Copying to server..." -ForegroundColor Yellow
scp -r $deployDir\* "${SshHost}:/opt/recipes/"

Write-Host "Building and starting on server..." -ForegroundColor Yellow
ssh $SshHost "cd /opt/recipes && docker compose down 2>/dev/null || true && docker compose build --no-cache && docker compose up -d"

Write-Host "Updating Nginx config..." -ForegroundColor Yellow
ssh $SshHost "sudo cp /opt/recipes/nginx-recipes.conf /etc/nginx/sites-available/recipes && sudo ln -sf /etc/nginx/sites-available/recipes /etc/nginx/sites-enabled/recipes 2>/dev/null || true && sudo nginx -t && sudo nginx -s reload"

Remove-Item -Recurse -Force $deployDir -ErrorAction SilentlyContinue
Write-Host "=== Deployment complete ===" -ForegroundColor Green
Write-Host "App: https://forklore.mmind.space or http://195.201.145.97:3001"
Write-Host "SSL: ssh $SshHost 'sudo certbot --nginx -d forklore.mmind.space' (falls noch nicht eingerichtet)"
