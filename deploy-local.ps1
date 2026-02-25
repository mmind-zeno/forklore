# Deploy Recipe App v0.1.0 to Hetzner
# Usage: .\deploy-local.ps1 [ssh-host]
param([string]$SshHost = "hetzner")

$ErrorActionPreference = "Stop"
Write-Host "=== Deploying Recipe App v0.1.0 to $SshHost ===" -ForegroundColor Cyan

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

Remove-Item -Recurse -Force $deployDir -ErrorAction SilentlyContinue
Write-Host "=== Deployment complete ===" -ForegroundColor Green
Write-Host "App: http://recipes.mmind.space or http://195.201.145.97:3001"
