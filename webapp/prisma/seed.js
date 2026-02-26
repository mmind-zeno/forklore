const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL ?? "admin@forklore.local";
  const password = process.env.SEED_PASSWORD ?? "admin123";
  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", password: hash, name: "Admin" },
    create: {
      email,
      password: hash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  console.log("Seed: Admin-User angelegt/aktualisiert:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
