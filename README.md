# Forklore – Recipe App v0.7.1

Rezepte per Notiz, Foto und Sprache erfassen. Mobile-first Web-App.

## Live

- **URL:** http://195.201.145.97:3001
- **Domain:** https://forklore.mmind.space (auch recipes.mmind.space)

## Features

- **Notiz-Modus:** Rezept als Text schreiben (optional mit Foto)
- **Mikrofon-Modus:** Foto + Sprache einsprechen
- KI extrahiert Zutaten und Schritte (Whisper + GPT-4o)
- Rezepte in SQLite speichern
- Persönliche Rezepte pro Benutzer:in, öffentliche Rezepte für alle sichtbar
- Suche nach Titel, Zutaten und Tags
- Filter nach Hauptzutaten
- Sterne-Bewertungen pro Rezept (Durchschnitt & Anzahl)
- **Admin:** User-Verwaltung unter `/admin`

## Tech-Stack

- Next.js 14, Tailwind, Prisma, SQLite
- OpenAI: Whisper (Audio), GPT-4o (Bild + Text)
- Docker auf Hetzner

## Lokal starten

```bash
cd webapp
cp .env.example .env   # OPENAI_API_KEY, ADMIN_PASSWORD eintragen
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

## Umgebungsvariablen (Server)

Nach dem ersten Deploy auf dem Server:

```bash
ssh hetzner "cd /opt/recipes && cp .env.example .env"
# .env bearbeiten: OPENAI_API_KEY=sk-..., ADMIN_PASSWORD=dein-sicheres-passwort
ssh hetzner "cd /opt/recipes && docker compose restart"
```

## DNS-Setup

```
forklore.mmind.space  →  A  →  195.201.145.97
recipes.mmind.space   →  A  →  195.201.145.97
```

SSL (nach DNS-Propagation): `ssh hetzner "sudo certbot --nginx -d forklore.mmind.space"`
