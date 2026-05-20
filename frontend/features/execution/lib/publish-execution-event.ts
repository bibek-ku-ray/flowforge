import { getWorkflowExecutionChannel } from "@/inngest/channels/workflow-execution";
import {
  resetCachedExecution,
  setCachedExecutionPhase,
  setCachedNodeStatus,
} from "@/lib/execution-status-store";
import type { Realtime } from "inngest";

export async function publishExecutionStarted(
  publish: Realtime.TypedPublishFn,
  workflowId: string,
) {
  await resetCachedExecution(workflowId);

  await publish(getWorkflowExecutionChannel(workflowId).status, {
    workflowId,
    phase: "execution.started",
  });
}

export async function publishExecutionCompleted(
  publish: Realtime.TypedPublishFn,
  workflowId: string,
  success: boolean,
) {
  await setCachedExecutionPhase(workflowId, success ? "completed" : "failed");

  await publish(getWorkflowExecutionChannel(workflowId).status, {
    workflowId,
    phase: "execution.completed",
    status: success ? "success" : "error",
  });
}

export async function publishNodeStatus(
  publish: Realtime.TypedPublishFn,
  workflowId: string,
  nodeId: string,
  nodeType: string,
  status: "loading" | "success" | "error",
) {
  const phase =
    status === "loading"
      ? "node.started"
      : status === "success"
        ? "node.completed"
        : "node.failed";

  await setCachedNodeStatus(workflowId, nodeId, status, nodeType);

  await publish(getWorkflowExecutionChannel(workflowId).status, {
    workflowId,
    nodeId,
    nodeType,
    status,
    phase,
  });
}
