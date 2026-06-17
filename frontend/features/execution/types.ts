import type { GetStepTools, Inngest, Realtime } from "inngest";

export type WorkflowContext = Record<string, unknown>;
export type StepTools = GetStepTools<Inngest.Any>;

export interface NodeExecutorParams<TData = Record<string, unknown>> {
  data: TData;
  nodeId: string;
  nodeType: string;
  workflowId: string;
  userId: string;
  context: WorkflowContext;
  step: StepTools;
  publish: Realtime.TypedPublishFn;
  /**
   * Identifies a single loop iteration, e.g. "0", "1", "0:2" for nested loops.
   * Undefined outside of a LOOP body. Executors must fold this (together with
   * their nodeId) into every Inngest step id so the same node running once per
   * loop item does not collide on memoized step results.
   */
  iterationKey?: string;
}

export type NodeExecutor<TData = Record<string, unknown>> = (
  params: NodeExecutorParams<TData>,
) => Promise<WorkflowContext>;
