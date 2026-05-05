import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

function normEmail(email) {
  return String(email).trim().toLowerCase();
}

const prisma = new PrismaClient();

async function main() {
  const adminEmail = normEmail(process.env.SEED_ADMIN_EMAIL || "admin@example.com");
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  const memberEmail = normEmail(process.env.SEED_MEMBER_EMAIL || "member@example.com");
  const memberPassword = process.env.SEED_MEMBER_PASSWORD || "Member123!";

  const adminHash = await bcrypt.hash(adminPassword, 12);
  const memberHash = await bcrypt.hash(memberPassword, 12);

  // Always refresh password + role so re-seeding fixes a stuck admin (e.g. email taken by a prior signup).
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Admin User",
      password: adminHash,
      role: "ADMIN",
    },
    create: {
      name: "Admin User",
      email: adminEmail,
      password: adminHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: memberEmail },
    update: {
      name: "Member User",
      password: memberHash,
      role: "MEMBER",
    },
    create: {
      name: "Member User",
      email: memberEmail,
      password: memberHash,
      role: "MEMBER",
    },
  });

  console.log("Seed complete.");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`Member: ${memberEmail} / ${memberPassword}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
