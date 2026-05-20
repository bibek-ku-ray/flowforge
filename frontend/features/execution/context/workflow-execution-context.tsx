"use client";

import { createContext, useContext } from "react";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";

interface WorkflowExecutionContextValue {
  syncNodeStatus: (
    nodeId: string,
    status: NodeStatus,
    nodeType?: string,
  ) => void;
  resetAllNodeStatuses: () => void;
}

const WorkflowExecutionContext =
  createContext<WorkflowExecutionContextValue | null>(null);

export function WorkflowExecutionProvider({
  children,
  syncNodeStatus,
  resetAllNodeStatuses,
}: {
  children: React.ReactNode;
  syncNodeStatus: (
    nodeId: string,
    status: NodeStatus,
    nodeType?: string,
  ) => void;
  resetAllNodeStatuses: () => void;
}) {
  return (
    <WorkflowExecutionContext.Provider
      value={{ syncNodeStatus, resetAllNodeStatuses }}
    >
      {children}
    </WorkflowExecutionContext.Provider>
  );
}

export function useWorkflowExecutionContext() {
  const context = useContext(WorkflowExecutionContext);
  if (!context) {
    throw new Error(
      "useWorkflowExecutionContext must be used within WorkflowExecutionProvider",
    );
  }
  return context;
}

export function getNodeExecutionStatus(
  data: Record<string, unknown> | undefined,
): NodeStatus {
  const status = data?.executionStatus;
  if (status === "loading" || status === "success" || status === "error") {
    return status;
  }
  return "initial";
}

export function resolveNodeIdForStatus(
  nodes: Array<{ id: string; type?: string | null }>,
  nodeId: string,
  nodeType?: string,
): string | null {
  if (nodes.some((node) => node.id === nodeId)) {
    return nodeId;
  }

  if (nodeType) {
    const match = nodes.find((node) => node.type === nodeType);
    if (match) return match.id;
  }

  return null;
}
