import { PrismaClient } from "@prisma/client";
import { PERMISSIONS, PERMISSION_DESCRIPTIONS } from "../../packages/config/permissions";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${PERMISSIONS.length} permissions...`);

  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: { description: PERMISSION_DESCRIPTIONS[key] },
      create: { key, description: PERMISSION_DESCRIPTIONS[key] },
    });
  }

  console.log("Permission catalog seeded.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
