#!/bin/sh
set -e

# Als root: Schema und Seed ins Volume kopieren, Rechte setzen
cp -f /app/prisma_schema/schema.prisma /app/prisma/
cp -f /app/prisma_schema/seed.js /app/prisma/
chown -R nextjs:nodejs /app/prisma

# DB-Schema anwenden (prisma CLI fehlt im Standalone; nutze Migrationsskripte)
su nextjs -s /bin/sh -c "cd /app && node migrate-recipe-columns.js" || true

# Setting-Tabelle per Prisma Client erstellen (ohne prisma CLI)
su nextjs -s /bin/sh -c "cd /app && node migrate-setting.js" || true

# Seed (nutzt nur Prisma Client)
su nextjs -s /bin/sh -c "cd /app && node prisma/seed.js" 2>/dev/null || true

# Server starten
exec su nextjs -s /bin/sh -c "exec node server.js"
