-- AlterEnum
ALTER TYPE "NodeType" ADD VALUE 'SCHEDULE_TRIGGER';

-- AlterEnum
ALTER TYPE "TriggerKind" ADD VALUE 'SCHEDULE';

-- CreateTable
CREATE TABLE "schedule_trigger" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'SIMPLE',
    "cronExpression" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_trigger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schedule_trigger_nodeId_key" ON "schedule_trigger"("nodeId");

-- CreateIndex
CREATE INDEX "schedule_trigger_enabled_nextRunAt_idx" ON "schedule_trigger"("enabled", "nextRunAt");

-- AddForeignKey
ALTER TABLE "schedule_trigger" ADD CONSTRAINT "schedule_trigger_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
