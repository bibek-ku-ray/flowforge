-- CreateEnum
CREATE TYPE "ReminderUnit" AS ENUM ('MINUTES', 'HOURS', 'DAYS');

-- CreateEnum
CREATE TYPE "ReminderDirection" AS ENUM ('BEFORE', 'AFTER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CredentialType" ADD VALUE 'RESEND';
ALTER TYPE "CredentialType" ADD VALUE 'GOOGLE_SHEETS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NodeType" ADD VALUE 'EVENT_TRIGGER';
ALTER TYPE "NodeType" ADD VALUE 'EMAIL';
ALTER TYPE "NodeType" ADD VALUE 'GOOGLE_SHEETS';

-- AlterEnum
ALTER TYPE "TriggerKind" ADD VALUE 'EVENT';

-- CreateTable
CREATE TABLE "calendar_event" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_reminder" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "offsetValue" INTEGER NOT NULL,
    "offsetUnit" "ReminderUnit" NOT NULL,
    "direction" "ReminderDirection" NOT NULL,
    "fireAt" TIMESTAMP(3) NOT NULL,
    "triggeredAt" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_event_userId_startAt_idx" ON "calendar_event"("userId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_reminder_nodeId_key" ON "event_reminder"("nodeId");

-- CreateIndex
CREATE INDEX "event_reminder_triggeredAt_fireAt_idx" ON "event_reminder"("triggeredAt", "fireAt");

-- CreateIndex
CREATE INDEX "event_reminder_eventId_idx" ON "event_reminder"("eventId");

-- AddForeignKey
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reminder" ADD CONSTRAINT "event_reminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reminder" ADD CONSTRAINT "event_reminder_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
