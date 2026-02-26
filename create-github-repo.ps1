# GitHub Repo erstellen und pushen
# Voraussetzung: gh auth login einmal ausführen (öffnet Browser)

Write-Host "Prüfe GitHub-Anmeldung..." -ForegroundColor Cyan
gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nBitte zuerst anmelden:" -ForegroundColor Yellow
    Write-Host "  gh auth login --web" -ForegroundColor White
    Write-Host "`nDann dieses Skript erneut ausführen." -ForegroundColor Yellow
    exit 1
}

Write-Host "`nErstelle Repo 'forklore' auf GitHub..." -ForegroundColor Cyan
gh repo create forklore --public --source=. --remote=origin --push

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nFertig! Repo: https://github.com/mmind-zeno/forklore" -ForegroundColor Green
} else {
    Write-Host "`nFehler. Repo existiert evtl. bereits. Manuell pushen:" -ForegroundColor Yellow
    Write-Host "  git push -u origin main" -ForegroundColor White
}
