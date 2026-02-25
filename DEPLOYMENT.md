# Recipe App – Deployment auf Hetzner

## v0.1.0 – Live

### Erledigt

- App läuft unter http://195.201.145.97:3001
- Nginx-Config für recipes.mmind.space aktiv

### Wichtig: OPENAI_API_KEY setzen

Damit Rezepte erstellt werden können, muss der API-Key auf dem Server gesetzt werden:

```bash
ssh hetzner
cd /opt/recipes
cp .env.example .env
nano .env   # OPENAI_API_KEY=sk-dein-key eintragen
docker compose restart
```

### Server

- **IP:** 195.201.145.97
- **SSH:** `ssh hetzner`
- **Pfad:** /opt/recipes/

### Ersteinrichtung

1. **Verzeichnis erstellen:**
   ```bash
   ssh hetzner "mkdir -p /opt/recipes"
   ```

2. **Dateien kopieren:**
   ```bash
   scp -r webapp docker-compose.yml nginx-recipes.conf .env.example hetzner:/opt/recipes/
   ```

3. **.env anlegen:**
   ```bash
   ssh hetzner "cd /opt/recipes && cp .env.example .env"
   # OPENAI_API_KEY in .env eintragen
   ```

4. **Nginx aktivieren** (falls noch nicht):
   ```bash
   ssh hetzner "cp /opt/recipes/nginx-recipes.conf /etc/nginx/sites-available/recipes && ln -sf /etc/nginx/sites-available/recipes /etc/nginx/sites-enabled/ && nginx -t && nginx -s reload"
   ```

5. **Deploy:**
   ```bash
   ssh hetzner "cd /opt/recipes && docker compose down 2>/dev/null || true && docker compose build --no-cache && docker compose up -d"
   ```

6. **SSL (optional):**
   ```bash
   ssh hetzner "certbot --nginx -d recipes.mmind.space"
   ```

### DNS

```
recipes.mmind.space  →  A  →  195.201.145.97
```

### Updates

```bash
scp -r webapp docker-compose.yml hetzner:/opt/recipes/
ssh hetzner "cd /opt/recipes && docker compose down && docker compose build --no-cache && docker compose up -d"
```
