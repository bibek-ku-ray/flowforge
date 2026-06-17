import type { WorkflowContext } from "@/features/execution/types";

/**
 * Configuration stored on a LOOP node's `data` JSON column.
 */
export type LoopConfig = {
  /** Dotted path into the workflow context that resolves to the array to iterate. */
  sourcePath: string;
  /** Context key each item is exposed under inside the loop body (e.g. "currentUser"). */
  itemVariableName: string;
  /** Context key the collected per-iteration results are stored under. */
  variableName: string;
  /** When true, a failing iteration is recorded instead of aborting the workflow. */
  continueOnError?: boolean;
};

/** Shape stored for an iteration that failed while `continueOnError` is enabled. */
export type LoopIterationFailure = {
  success: false;
  error: string;
};

/**
 * Thrown when a LOOP node is misconfigured or its source path does not resolve
 * to an array. Surfaces as a workflow failure (non-retriable at the engine).
 */
export class LoopConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoopConfigError";
  }
}

/**
 * Safe dotted-path getter. Supports object keys and numeric array indices, e.g.
 * `getByPath(ctx, "usersResponse.users")` or `getByPath(ctx, "items.0.id")`.
 * Returns `undefined` for any missing or non-traversable segment.
 */
export function getByPath(source: unknown, path: string): unknown {
  if (!path) {
    return source;
  }

  const segments = path.split(".").filter((segment) => segment.length > 0);

  let current: unknown = source;
  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index)) {
        return undefined;
      }
      current = current[index];
      continue;
    }

    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
      continue;
    }

    return undefined;
  }

  return current;
}

/**
 * Resolves the array a LOOP node iterates over, validating both the config and
 * that the resolved value is actually an array.
 */
export function resolveLoopArray(
  context: WorkflowContext,
  sourcePath: string | undefined,
): unknown[] {
  if (!sourcePath || sourcePath.trim().length === 0) {
    throw new LoopConfigError("Loop node: source array path is not configured");
  }

  const value = getByPath(context, sourcePath.trim());

  if (value === undefined) {
    throw new LoopConfigError(
      `Loop node: nothing found at path "${sourcePath}"`,
    );
  }

  if (!Array.isArray(value)) {
    throw new LoopConfigError(
      `Loop node: value at "${sourcePath}" is not an array (got ${describeType(
        value,
      )})`,
    );
  }

  return value;
}

/**
 * Returns the keys whose values were added or changed between the parent context
 * and an iteration's resulting context. This is what gets collected per item, so
 * the output variable holds each iteration's downstream outputs rather than a
 * bloated copy of the whole workflow context.
 */
export function diffContext(
  parent: WorkflowContext,
  iteration: WorkflowContext,
): Record<string, unknown> {
  const delta: Record<string, unknown> = {};

  for (const key of Object.keys(iteration)) {
    if (!(key in parent) || !Object.is(parent[key], iteration[key])) {
      delta[key] = iteration[key];
    }
  }

  return delta;
}

function describeType(value: unknown): string {
  if (value === null) return "null";
  return typeof value;
}
