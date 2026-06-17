import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/execution/types";

/**
 * Configuration stored on a LOOP node's `data` JSON column.
 *
 * @example
 * {
 *   sourcePath: "usersResponse.users",
 *   itemVariableName: "currentUser",
 *   variableName: "processedUsers",
 *   continueOnError: false
 * }
 */
export type LoopNodeData = {
  /** Dotted path into the workflow context resolving to the array to iterate. */
  sourcePath?: string;
  /** Context key each item is exposed under inside the loop body. */
  itemVariableName?: string;
  /** Context key the collected per-iteration results are stored under. */
  variableName?: string;
  /** Record failed iterations instead of failing the workflow. Defaults to false. */
  continueOnError?: boolean;
};

/**
 * LOOP nodes are orchestrated directly by the workflow execution engine
 * (`executeGraph`), which needs graph-level access that the standard
 * {@link NodeExecutor} signature does not provide. This guard exists only to
 * satisfy the exhaustive `Record<NodeType, NodeExecutor>` registry — the engine
 * special-cases LOOP before ever consulting the registry, so it must never run.
 */
export const loopExecutor: NodeExecutor<LoopNodeData> = async () => {
  throw new NonRetriableError(
    "LOOP nodes are handled by the execution engine, not the executor registry",
  );
};
