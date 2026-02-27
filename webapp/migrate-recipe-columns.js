/**
 * Adds category, tags, updatedAt columns to Recipe table if they don't exist.
 * Needed when DB was created before these columns were in schema.
 *
 * IMPORTANT: updatedAt must be DATETIME (INTEGER affinity) so Prisma can write
 * Unix-ms integers. If it was added as TEXT (old migration), we recreate the table.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const addColumn = async (name, sql) => {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`Recipe.${name} column added`);
    } catch (e) {
      if (e.message && e.message.includes("duplicate column name")) {
        console.log(`Recipe.${name} already exists`);
      } else {
        throw e;
      }
    }
  };

  await addColumn("category", "ALTER TABLE Recipe ADD COLUMN category TEXT");
  await addColumn("tags", "ALTER TABLE Recipe ADD COLUMN tags TEXT");
  await addColumn("visibility", "ALTER TABLE Recipe ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private'");
  await addColumn("mainIngredients", "ALTER TABLE Recipe ADD COLUMN mainIngredients TEXT");

  // Add updatedAt as DATETIME so Prisma can store Unix-ms integers
  await addColumn("updatedAt", "ALTER TABLE Recipe ADD COLUMN updatedAt DATETIME");

  // Check column type – if TEXT (old migration), recreate table with DATETIME
  const cols = await prisma.$queryRawUnsafe("PRAGMA table_info(Recipe)");
  const updatedAtCol = cols.find((c) => c.name === "updatedAt");
  if (updatedAtCol && updatedAtCol.type.toUpperCase() === "TEXT") {
    console.log("updatedAt is TEXT – recreating Recipe table with DATETIME column...");

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Recipe_v2 (
        id TEXT NOT NULL PRIMARY KEY,
        title TEXT NOT NULL,
        imagePath TEXT,
        ingredients TEXT NOT NULL,
        steps TEXT NOT NULL,
        category TEXT,
        tags TEXT,
        mainIngredients TEXT,
        createdAt DATETIME NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updatedAt DATETIME NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        userId TEXT,
        visibility TEXT NOT NULL DEFAULT 'private',
        CONSTRAINT Recipe_userId_fkey FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

    // Copy existing rows; convert ISO-string updatedAt back to Unix-ms integer.
    // visibility wird nicht explizit gesetzt und fällt damit auf den Default "private" zurück.
    await prisma.$executeRawUnsafe(`
      INSERT OR REPLACE INTO Recipe_v2
        (id, title, imagePath, ingredients, steps, category, tags, mainIngredients, createdAt, updatedAt, userId)
      SELECT
        id,
        title,
        imagePath,
        ingredients,
        steps,
        category,
        tags,
        mainIngredients,
        createdAt,
        CASE
          WHEN updatedAt LIKE '%-%' THEN CAST(strftime('%s', updatedAt) AS INTEGER) * 1000
          ELSE CAST(updatedAt AS INTEGER)
        END,
        userId
      FROM Recipe
    `);

    await prisma.$executeRawUnsafe("DROP TABLE Recipe");
    await prisma.$executeRawUnsafe("ALTER TABLE Recipe_v2 RENAME TO Recipe");
    console.log("Recipe table recreated with DATETIME updatedAt");
  } else {
    // Column already DATETIME: just ensure NULL rows get a value
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE Recipe SET updatedAt = CAST(strftime('%s', 'now') AS INTEGER) * 1000
         WHERE updatedAt IS NULL OR updatedAt = ''`
      );
    } catch (e) {
      if (!e.message?.includes("no such column")) console.error("update updatedAt:", e.message);
    }
  }

  // Rating-Tabelle (pro User und Rezept ein Eintrag)
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Rating (
        id        TEXT PRIMARY KEY,
        recipeId  TEXT NOT NULL,
        userId    TEXT NOT NULL,
        stars     INTEGER NOT NULL,
        comment   TEXT,
        createdAt DATETIME NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        CONSTRAINT Rating_recipe_fkey FOREIGN KEY (recipeId) REFERENCES Recipe(id) ON DELETE CASCADE,
        CONSTRAINT Rating_user_fkey   FOREIGN KEY (userId)   REFERENCES User(id)   ON DELETE CASCADE,
        UNIQUE (recipeId, userId)
      )
    `);
    console.log("Rating table ensured");
  } catch (e) {
    console.error("ensure Rating table:", e.message);
  }

  try {
    await prisma.$executeRawUnsafe("ALTER TABLE User ADD COLUMN avatarPath TEXT");
    console.log("User.avatarPath column added");
  } catch (e) {
    if (e.message && e.message.includes("duplicate column name")) {
      console.log("User.avatarPath already exists");
    } else {
      console.error("User.avatarPath:", e.message);
    }
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS UserFavorite (
        id        TEXT PRIMARY KEY,
        userId    TEXT NOT NULL,
        recipeId  TEXT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        CONSTRAINT UserFavorite_user_fkey   FOREIGN KEY (userId)   REFERENCES User(id)   ON DELETE CASCADE,
        CONSTRAINT UserFavorite_recipe_fkey FOREIGN KEY (recipeId)  REFERENCES Recipe(id) ON DELETE CASCADE,
        UNIQUE (userId, recipeId)
      )
    `);
    console.log("UserFavorite table ensured");
  } catch (e) {
    console.error("UserFavorite table:", e.message);
  }

  console.log("Recipe columns migration done");
}

main()
  .catch((e) => {
    console.error("migrate-recipe-columns:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
