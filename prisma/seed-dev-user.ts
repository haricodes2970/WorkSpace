/**
 * Idempotent dev-user seed.
 * Creates the deterministic local developer account if it doesn't exist.
 * Safe to run multiple times — upserts by authId.
 *
 * Usage: npx dotenv -e .env.local -- tsx prisma/seed-dev-user.ts
 */

import { PrismaClient } from "@prisma/client";

const DEV_USER_ID    = "00000000-0000-0000-0000-000000000001";
const DEV_AUTH_ID    = "00000000-0000-0000-0000-000000000002";
const DEV_USER_EMAIL = "dev@workspace.local";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where:  { authId: DEV_AUTH_ID },
    create: {
      id:       DEV_USER_ID,
      authId:   DEV_AUTH_ID,
      email:    DEV_USER_EMAIL,
      name:     "Developer",
      timezone: "UTC",
    },
    update: {
      email: DEV_USER_EMAIL,
      name:  "Developer",
    },
  });

  console.log(`[seed-dev-user] Dev user ready: ${user.id} (${user.email})`);
}

main()
  .catch((err) => {
    console.error("[seed-dev-user] Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
