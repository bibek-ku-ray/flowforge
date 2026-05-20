-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TriggerKind" AS ENUM ('MANUAL', 'GOOGLE_FORM', 'STRIPE');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banExpires" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "session" ADD COLUMN     "impersonatedBy" TEXT;

-- CreateTable
CREATE TABLE "trigger_setting" (
    "kind" "TriggerKind" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trigger_setting_pkey" PRIMARY KEY ("kind")
);

-- Seed default trigger settings
INSERT INTO "trigger_setting" ("kind", "enabled", "updatedAt") VALUES
('MANUAL', true, CURRENT_TIMESTAMP),
('GOOGLE_FORM', true, CURRENT_TIMESTAMP),
('STRIPE', true, CURRENT_TIMESTAMP);
