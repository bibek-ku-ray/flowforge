import type { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { prisma } from "@/lib/prisma";

export type ExecutionPhase = "idle" | "running" | "completed" | "failed";

export type CachedNodeStatus = {
  status: NodeStatus;
  nodeType?: string;
};

type NodeStatusMap = Record<string, CachedNodeStatus>;

export async function resetCachedExecution(workflowId: string) {
  await prisma.workflowExecutionSnapshot.upsert({
    where: { workflowId },
    create: {
      workflowId,
      phase: "running",
      nodeStatuses: {},
    },
    update: {
      phase: "running",
      nodeStatuses: {},
    },
  });
}

export async function setCachedNodeStatus(
  workflowId: string,
  nodeId: string,
  status: NodeStatus,
  nodeType?: string,
) {
  const existing = await prisma.workflowExecutionSnapshot.findUnique({
    where: { workflowId },
  });

  const nodeStatuses: NodeStatusMap = {
    ...((existing?.nodeStatuses as NodeStatusMap | null) ?? {}),
    [nodeId]: { status, nodeType },
  };

  const phase =
    status === "loading"
      ? "running"
      : existing?.phase === "running"
        ? "running"
        : existing?.phase ?? "running";

  await prisma.workflowExecutionSnapshot.upsert({
    where: { workflowId },
    create: {
      workflowId,
      phase,
      nodeStatuses,
    },
    update: {
      phase,
      nodeStatuses,
    },
  });
}

export async function setCachedExecutionPhase(
  workflowId: string,
  phase: ExecutionPhase,
) {
  await prisma.workflowExecutionSnapshot.upsert({
    where: { workflowId },
    create: {
      workflowId,
      phase,
      nodeStatuses: {},
    },
    update: {
      phase,
    },
  });
}

export async function getCachedExecution(workflowId: string) {
  const entry = await prisma.workflowExecutionSnapshot.findUnique({
    where: { workflowId },
  });

  if (!entry) {
    return {
      phase: "idle" as const,
      nodeStatuses: {} as Record<string, CachedNodeStatus>,
      updatedAt: 0,
    };
  }

  return {
    phase: entry.phase as ExecutionPhase,
    nodeStatuses: (entry.nodeStatuses as Record<string, CachedNodeStatus>) ?? {},
    updatedAt: entry.updatedAt.getTime(),
  };
}
