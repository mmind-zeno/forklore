/**
 * Adds category and tags columns to Recipe table if they don't exist.
 * Needed when DB was created before these columns were in schema.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const addColumn = async (name) => {
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE Recipe ADD COLUMN ${name} TEXT`
      );
      console.log(`Recipe.${name} column added`);
    } catch (e) {
      if (e.message && e.message.includes("duplicate column name")) {
        console.log(`Recipe.${name} already exists`);
      } else {
        throw e;
      }
    }
  };

  await addColumn("category");
  await addColumn("tags");
  console.log("Recipe columns migration done");
}

main()
  .catch((e) => {
    console.error("migrate-recipe-columns:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
