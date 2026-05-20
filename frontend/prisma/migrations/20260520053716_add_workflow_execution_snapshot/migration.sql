-- CreateTable
CREATE TABLE "WorkflowExecutionSnapshot" (
    "workflowId" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'idle',
    "nodeStatuses" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowExecutionSnapshot_pkey" PRIMARY KEY ("workflowId")
);

-- AddForeignKey
ALTER TABLE "WorkflowExecutionSnapshot" ADD CONSTRAINT "WorkflowExecutionSnapshot_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
