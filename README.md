# Forklore – Recipe App v0.1.0

Rezepte per Foto und Sprache erfassen. Mobile-first Web-App.

## Live

- **URL:** http://195.201.145.97:3001
- **Domain (nach DNS-Setup):** http://recipes.mmind.space

## Features

- Foto vom Essen aufnehmen
- Rezept per Sprache einsprechen
- KI extrahiert Zutaten und Schritte (Whisper + GPT-4o)
- Rezepte in SQLite speichern
- Übersicht und Detail-Ansicht

## Tech-Stack

- Next.js 14, Tailwind, Prisma, SQLite
- OpenAI: Whisper (Audio), GPT-4o (Bild + Text)
- Docker auf Hetzner

## Lokal starten

```bash
cd webapp
cp .env.example .env   # OPENAI_API_KEY eintragen
npm install
npx prisma db push
npm run dev
```

## Git / GitHub

Das Repo ist initialisiert. Repo auf GitHub anlegen (https://github.com/new, Name: `forklore`), dann:

```powershell
git push -u origin main
```

Details: [SETUP-GITHUB.md](SETUP-GITHUB.md)

## Deploy

```bash
.\deploy-local.ps1 hetzner
```

## OPENAI_API_KEY (Server)

Nach dem ersten Deploy auf dem Server:

```bash
ssh hetzner "cd /opt/recipes && cp .env.example .env"
# .env bearbeiten: OPENAI_API_KEY=sk-...
ssh hetzner "cd /opt/recipes && docker compose restart"
```

## DNS-Setup für recipes.mmind.space

```
recipes.mmind.space  →  A  →  195.201.145.97
```

Dann SSL: `ssh hetzner "certbot --nginx -d recipes.mmind.space"`
