// prisma/create-user.ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [email, pass] = process.argv.slice(2);
  if (!email || !pass) {
    console.error("Usage: tsx prisma/create-user.ts <email> <password>");
    process.exit(1);
  }
  const hash = await bcrypt.hash(pass, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hash, role: Role.ADMIN },
    create: { email, password: hash, role: Role.ADMIN },
  });

  console.log("✅ Upserted admin:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
