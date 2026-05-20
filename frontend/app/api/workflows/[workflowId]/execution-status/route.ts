import { getCachedExecution } from "@/lib/execution-status-store";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const { workflowId } = await params;
  const execution = await getCachedExecution(workflowId);

  return NextResponse.json({
    workflowId,
    phase: execution.phase,
    nodeStatuses: execution.nodeStatuses,
    updatedAt: execution.updatedAt,
  });
}
