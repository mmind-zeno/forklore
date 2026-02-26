# Forklore – Agent Notes

Kontext und Entscheidungen aus Agent-Sessions. Für zukünftige Sessions und zur Trennung von aiact.

## Projekt

- **URL:** https://forklore.mmind.space (auch recipes.mmind.space, IP: 195.201.145.97:3001)
- **Server:** 195.201.145.97, SSH `hetzner`, Pfad `/opt/recipes/`
- **Tech:** Next.js 14, Prisma/SQLite, OpenAI Whisper (Audio), GPT-4o (Bild + Text)
- **Port:** 3001 (aiact nutzt 3000)

## Projektstruktur

```
Forklore/
├── webapp/
│   ├── prisma/              schema.prisma, dev.db
│   ├── src/app/              page.tsx, add/, recipe/[id]
│   ├── src/app/actions/     create-recipe.ts (Whisper + GPT-4o)
│   ├── src/lib/              openai.ts, prisma.ts
│   └── src/app/api/uploads/  [filename] – Bild-Serving
├── docker-compose.yml
├── deploy-local.ps1
├── nginx-recipes.conf
└── .env.example
```

## Features (v0.4.0)

- **Notiz-Modus:** Rezept als Text schreiben (optional mit Foto)
- **Mikrofon-Modus:** Foto + Sprache (Whisper + GPT-4o)
- KI extrahiert Zutaten und Schritte
- Rezepte in SQLite speichern
- **User-Login:** NextAuth, nur registrierte User (Admin legt an)
- **Admin:** User-Verwaltung unter /admin (ADMIN_PASSWORD in .env)
- **Admin Settings:** OpenAI API Key in DB hinterlegbar (Fallback: .env)
- **Seed:** Erster Admin-User admin@forklore.local / admin123

## Docker & Volumes

- **Port:** 3001:3000
- **Volumes:** `recipes-db:/app/prisma/data`, `recipes-uploads:/app/uploads`
- **DB-Pfad:** `file:/app/prisma/data/dev.db` (Schema bleibt in /app/prisma/)
- **Env:** DATABASE_URL, OPENAI_API_KEY, ADMIN_PASSWORD

## Prisma-Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("USER")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  recipes   Recipe[]
}

model Recipe {
  id          String   @id @default(cuid())
  title       String
  imagePath   String?
  ingredients String
  steps       String
  createdAt   DateTime @default(now())
  userId      String?
  user        User?    @relation(...)
}
```

## Wichtige Dateien

| Datei | Zweck |
|-------|-------|
| webapp/src/app/actions/create-recipe.ts | Rezept-Erstellung (Whisper + GPT-4o) |
| webapp/src/lib/image-resize.ts | Sharp: Bilder max 1024px, JPEG Q82. Fallback: Original bei Sharp-Fehler. |
| webapp/src/lib/openai.ts | OpenAI API |
| webapp/prisma/schema.prisma | Recipe-Modell |
| webapp/src/app/api/uploads/[filename]/route.ts | Bild-Upload/-Serving |

## Lokale Entwicklung

```bash
cd webapp
cp .env.example .env   # OPENAI_API_KEY eintragen
npx prisma db push
npm run dev
```

## Deployment

**Mit deploy-local.ps1:**
```powershell
.\deploy-local.ps1 hetzner
```
Kopiert webapp (ohne node_modules, .next), docker-compose.yml, nginx-recipes.conf, .env.example.

**Manuell:**
```bash
scp -r webapp docker-compose.yml nginx-recipes.conf .env.example hetzner:/opt/recipes/
ssh hetzner "cd /opt/recipes && docker compose down && docker compose build --no-cache && docker compose up -d"
```

## Ersteinrichtung

1. Verzeichnis: `ssh hetzner "mkdir -p /opt/recipes"`
2. Dateien kopieren (siehe Manuell oben)
3. `.env` anlegen: `ssh hetzner "cd /opt/recipes && cp .env.example .env"`
4. OPENAI_API_KEY in .env eintragen
5. Nginx: `ssh hetzner "cp /opt/recipes/nginx-recipes.conf /etc/nginx/sites-available/recipes && ln -sf /etc/nginx/sites-available/recipes /etc/nginx/sites-enabled/ && nginx -t && nginx -s reload"`
6. Docker starten (siehe Deployment)

## Server .env (wichtig!)

Nach Deploy muss `/opt/recipes/.env` existieren mit:
- `NEXTAUTH_SECRET` (min. 32 Zeichen)
- `NEXTAUTH_URL` (z.B. http://195.201.145.97:3001 oder https://forklore.mmind.space)
- `ADMIN_PASSWORD`
- `OPENAI_API_KEY` (oder in Admin → Settings hinterlegen)

## OPENAI_API_KEY

Nach Deploy auf Server in `.env` eintragen:

```bash
ssh hetzner "cd /opt/recipes && cp .env.example .env"
# .env bearbeiten: OPENAI_API_KEY=sk-...
ssh hetzner "cd /opt/recipes && docker compose restart"
```

## DNS

```
forklore.mmind.space  →  A  →  195.201.145.97
recipes.mmind.space   →  A  →  195.201.145.97
```

SSL: `ssh hetzner "sudo certbot --nginx -d forklore.mmind.space"` (erledigt)

## Bekannte Fallstricke

- **Dockerfile:** Nutzt `prisma db push` mit `USER nextjs`. Bei Volume-Rechte-Problemen (Schema-Änderung schlägt fehl) evtl. aiact-Lösung übernehmen: migrate-Script + Entrypoint als root.
- **DB-Schema manuell:** Falls User-Tabelle fehlt: `docker run --rm -e DATABASE_URL=file:/app/prisma/dev.db -v recipes_recipes-db:/app/prisma -v /opt/recipes/webapp:/app/src -w /app/src node:20-alpine sh -c 'npx prisma db push --accept-data-loss && npx prisma db seed'`
- **.env-Änderung:** Nach Änderung von NEXTAUTH_URL etc. `docker compose up -d --force-recreate` (nicht nur restart).
- **Forklore vs. aiact:** Separate Projekte. Bei Multi-Root-Workspace können Agent-Transkripte im falschen Projekt-Ordner landen.
