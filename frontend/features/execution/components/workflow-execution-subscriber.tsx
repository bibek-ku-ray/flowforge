"use client";

import type { WorkflowExecutionEvent } from "@/inngest/channels/workflow-execution";
import { useRealtime } from "inngest/react";
import { useCallback, useEffect, useRef } from "react";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { fetchWorkflowExecutionToken } from "@/features/execution/actions/fetch-workflow-execution-token";
import { useWorkflowExecutionContext } from "@/features/execution/context/workflow-execution-context";
import { getWorkflowExecutionChannel } from "@/inngest/channels/workflow-execution";

interface WorkflowExecutionSubscriberProps {
  workflowId: string;
}

export function WorkflowExecutionSubscriber({
  workflowId,
}: WorkflowExecutionSubscriberProps) {
  const { syncNodeStatus, resetAllNodeStatuses } = useWorkflowExecutionContext();
  const lastPollPhaseRef = useRef<string>("idle");

  const refreshToken = useCallback(
    () => fetchWorkflowExecutionToken(workflowId),
    [workflowId],
  );

  const { messages } = useRealtime({
    channel: getWorkflowExecutionChannel(workflowId),
    topics: ["status"],
    token: refreshToken,
    enabled: true,
    autoCloseOnTerminal: false,
    pauseOnHidden: false,
    reconnect: true,
  });

  const applyEvent = useCallback(
    (data: WorkflowExecutionEvent) => {
      if (data.workflowId !== workflowId) return;

      if (data.phase === "execution.started") {
        resetAllNodeStatuses();
        return;
      }

      if (data.phase === "execution.completed") {
        return;
      }

      if (data.nodeId && data.status) {
        syncNodeStatus(data.nodeId, data.status as NodeStatus, data.nodeType);
      }
    },
    [resetAllNodeStatuses, syncNodeStatus, workflowId],
  );

  useEffect(() => {
    for (const message of messages.delta) {
      if (message?.kind !== "data" || message.topic !== "status") continue;
      applyEvent(message.data as WorkflowExecutionEvent);
    }
  }, [messages.delta, applyEvent]);

  useEffect(() => {
    let cancelled = false;

    const pollExecutionStatus = async () => {
      try {
        const response = await fetch(
          `/api/workflows/${workflowId}/execution-status`,
          { cache: "no-store" },
        );

        if (!response.ok || cancelled) return;

        const payload = (await response.json()) as {
          phase: string;
          nodeStatuses: Record<
            string,
            { status: NodeStatus; nodeType?: string }
          >;
        };

        if (
          payload.phase === "running" &&
          lastPollPhaseRef.current !== "running"
        ) {
          resetAllNodeStatuses();
        }
        lastPollPhaseRef.current = payload.phase;

        for (const [nodeId, entry] of Object.entries(payload.nodeStatuses)) {
          syncNodeStatus(nodeId, entry.status, entry.nodeType);
        }
      } catch {
        // Polling is a fallback; ignore transient errors.
      }
    };

    void pollExecutionStatus();
    const intervalId = window.setInterval(pollExecutionStatus, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [resetAllNodeStatuses, syncNodeStatus, workflowId]);

  return null;
}
