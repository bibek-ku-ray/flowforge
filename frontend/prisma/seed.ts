import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { UserRole, TriggerKind } from "../generated/prisma/enums";
import { auth } from "../lib/auth";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function seedTriggerSettings() {
  for (const kind of Object.values(TriggerKind)) {
    await prisma.triggerSetting.upsert({
      where: { kind },
      create: { kind, enabled: true },
      update: {},
    });
  }
}

async function seedBootstrapAdmin() {
  // Local/dev bootstrap only — override via ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME in production.
  const email = process.env.ADMIN_EMAIL ?? "admin@flowforge.com";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const name = process.env.ADMIN_NAME ?? "FlowForge Admin";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== UserRole.ADMIN) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: UserRole.ADMIN },
      });
      console.info(`Promoted existing user ${email} to ADMIN`);
    } else {
      console.info(`Admin user ${email} already exists`);
    }
    return;
  }

  await auth.api.createUser({
    body: {
      email,
      password,
      name,
      role: UserRole.ADMIN,
    },
  });

  console.info(`Created bootstrap admin ${email}`);
}

async function main() {
  await seedTriggerSettings();
  await seedBootstrapAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
