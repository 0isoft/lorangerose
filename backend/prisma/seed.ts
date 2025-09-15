// prisma/seed.ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@lorange.local";
  const pass = "changeme";
  const hash = await bcrypt.hash(pass, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password: hash, role: Role.ADMIN },
  });

  console.log("Seeded admin:", email, "password:", pass);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
