import type { Connection, Node } from "@/generated/prisma/client";
import { NodeType } from "@/generated/prisma/enums";
import type { WorkflowContext } from "@/features/execution/types";
import {
  diffContext,
  LoopConfigError,
  resolveLoopArray,
  type LoopConfig,
} from "./loop";

/**
 * The engine only needs a node's id, type, and data. Using a structural subset
 * (rather than the full Prisma `Node`) lets callers pass values that have been
 * round-tripped through Inngest `step.run` serialization, where `Date` fields
 * become strings.
 */
export type GraphNode = Pick<Node, "id" | "type" | "data">;
export type GraphConnection = Pick<Connection, "fromNodeId" | "toNodeId">;

/**
 * Runs a single (non-loop) node and returns the updated context. Injected by the
 * caller so this module stays free of Inngest/Prisma and remains unit-testable
 * with a fake implementation.
 */
export type RunNode = (
  node: GraphNode,
  context: WorkflowContext,
  iterationKey: string | undefined,
) => Promise<WorkflowContext>;

/** Optional hooks so the caller can publish LOOP node status to the UI. */
export type LoopLifecycle = {
  onLoopStart?: (node: GraphNode) => Promise<void> | void;
  onLoopSuccess?: (node: GraphNode) => Promise<void> | void;
  onLoopError?: (node: GraphNode) => Promise<void> | void;
};

/**
 * Executes a workflow graph.
 *
 * Backward compatible with the previous flat executor: when there are no LOOP
 * nodes the walk visits each node exactly once, in the provided topological
 * order, threading a single context through — identical to the old behavior.
 *
 * When a LOOP node is encountered, every node reachable downstream of it is
 * treated as the loop body and executed once per array item with an isolated
 * context copy (see {@link runLoop}). Nested loops are handled by recursion.
 *
 * @param orderedNodes  Nodes in topological order (use {@link topologicalSort}).
 * @param connections   Workflow edges, used to derive the downstream adjacency.
 * @param context       Initial workflow context.
 * @param runNode       Executes a single non-loop node.
 * @param lifecycle     Optional LOOP status hooks.
 */
export async function executeGraph(
  orderedNodes: GraphNode[],
  connections: GraphConnection[],
  context: WorkflowContext,
  runNode: RunNode,
  lifecycle: LoopLifecycle = {},
): Promise<WorkflowContext> {
  const downstream = buildDownstreamMap(connections);
  return walk(orderedNodes, downstream, context, runNode, lifecycle, undefined);
}

async function walk(
  scopeNodes: GraphNode[],
  downstream: Map<string, string[]>,
  context: WorkflowContext,
  runNode: RunNode,
  lifecycle: LoopLifecycle,
  iterationKey: string | undefined,
): Promise<WorkflowContext> {
  const skip = new Set<string>();
  let current = context;

  for (const node of scopeNodes) {
    if (skip.has(node.id)) {
      continue;
    }

    if (node.type === NodeType.LOOP) {
      const descendantIds = collectDescendants(node.id, downstream);
      for (const id of descendantIds) {
        skip.add(id);
      }
      const bodyNodes = scopeNodes.filter((candidate) =>
        descendantIds.has(candidate.id),
      );
      current = await runLoop(
        node,
        bodyNodes,
        downstream,
        current,
        runNode,
        lifecycle,
        iterationKey,
      );
      continue;
    }

    current = await runNode(node, current, iterationKey);
  }

  return current;
}

/**
 * Runs the loop body once per item of the resolved source array. Each iteration
 * gets a deep-cloned context (full isolation — no leakage between iterations)
 * with the current item bound under `itemVariableName`. The per-iteration
 * downstream outputs are collected and stored under `variableName`.
 */
async function runLoop(
  loopNode: GraphNode,
  bodyNodes: GraphNode[],
  downstream: Map<string, string[]>,
  context: WorkflowContext,
  runNode: RunNode,
  lifecycle: LoopLifecycle,
  parentIterationKey: string | undefined,
): Promise<WorkflowContext> {
  await lifecycle.onLoopStart?.(loopNode);

  try {
    const config = (loopNode.data ?? {}) as Partial<LoopConfig>;
    const itemVariableName = config.itemVariableName?.trim();
    const variableName = config.variableName?.trim();

    if (!itemVariableName) {
      throw new LoopConfigError(
        "Loop node: current item variable is not configured",
      );
    }
    if (!variableName) {
      throw new LoopConfigError(
        "Loop node: output variable is not configured",
      );
    }

    const items = resolveLoopArray(context, config.sourcePath);

    const results: unknown[] = [];

    for (let index = 0; index < items.length; index++) {
      const iterationKey = parentIterationKey
        ? `${parentIterationKey}:${index}`
        : String(index);

      // Deep clone for full isolation between iterations, then bind the item.
      // `baseline` is the pre-body snapshot we diff against, so the collected
      // result holds only the item plus this iteration's downstream outputs
      // (clone breaks reference identity with `context`, so we cannot diff
      // against the original parent here).
      const baseline = structuredClone(context) as WorkflowContext;
      const iterationContext: WorkflowContext = {
        ...baseline,
        [itemVariableName]: items[index],
      };

      try {
        const resultContext = await walk(
          bodyNodes,
          downstream,
          iterationContext,
          runNode,
          lifecycle,
          iterationKey,
        );
        results.push(diffContext(baseline, resultContext));
      } catch (error) {
        if (config.continueOnError) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
          continue;
        }
        throw error;
      }
    }

    const next: WorkflowContext = { ...context, [variableName]: results };
    await lifecycle.onLoopSuccess?.(loopNode);
    return next;
  } catch (error) {
    await lifecycle.onLoopError?.(loopNode);
    throw error;
  }
}

function buildDownstreamMap(
  connections: GraphConnection[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const connection of connections) {
    const list = map.get(connection.fromNodeId) ?? [];
    list.push(connection.toNodeId);
    map.set(connection.fromNodeId, list);
  }
  return map;
}

/** Breadth-first collection of every node reachable downstream of `startId`. */
function collectDescendants(
  startId: string,
  downstream: Map<string, string[]>,
): Set<string> {
  const result = new Set<string>();
  const queue = [...(downstream.get(startId) ?? [])];

  while (queue.length > 0) {
    const id = queue.shift() as string;
    if (result.has(id)) {
      continue;
    }
    result.add(id);
    for (const next of downstream.get(id) ?? []) {
      queue.push(next);
    }
  }

  return result;
}
