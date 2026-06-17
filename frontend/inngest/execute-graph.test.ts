import { describe, expect, it } from "vitest";
import type { Connection, Node } from "@/generated/prisma/client";
import { NodeType } from "@/generated/prisma/enums";
import type { WorkflowContext } from "@/features/execution/types";
import { executeGraph, type RunNode } from "./execute-graph";

/** Minimal Node factory — only the fields the engine reads. */
function node(id: string, type: NodeType, data: Record<string, unknown> = {}): Node {
  return {
    id,
    workflowId: "wf",
    name: id,
    type,
    position: { x: 0, y: 0 },
    data,
    credentialId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Node;
}

function edge(fromNodeId: string, toNodeId: string): Connection {
  return { fromNodeId, toNodeId } as unknown as Connection;
}

describe("executeGraph — normal (non-loop) workflows", () => {
  it("runs each node exactly once in order and threads context", async () => {
    const calls: string[] = [];
    const runNode: RunNode = async (n, ctx) => {
      calls.push(n.id);
      return { ...ctx, [n.id]: true };
    };

    const nodes = [
      node("a", NodeType.MANUAL_TRIGGER),
      node("b", NodeType.HTTP_REQUEST),
      node("c", NodeType.DISCORD),
    ];
    const connections = [edge("a", "b"), edge("b", "c")];

    const result = await executeGraph(nodes, connections, {}, runNode);

    expect(calls).toEqual(["a", "b", "c"]);
    expect(result).toEqual({ a: true, b: true, c: true });
  });
});

describe("executeGraph — loop workflows", () => {
  const loopNodes = [
    node("loop", NodeType.LOOP, {
      sourcePath: "src.users",
      itemVariableName: "currentUser",
      variableName: "processedUsers",
    }),
    node("body", NodeType.DISCORD),
  ];
  const loopConnections = [edge("loop", "body")];

  it("runs downstream nodes once per array item", async () => {
    const seen: unknown[] = [];
    const runNode: RunNode = async (n, ctx) => {
      seen.push(ctx.currentUser);
      return { ...ctx, sent: true };
    };

    const context: WorkflowContext = {
      src: { users: [{ name: "John" }, { name: "Sarah" }, { name: "Mike" }] },
    };

    const result = await executeGraph(
      loopNodes,
      loopConnections,
      context,
      runNode,
    );

    expect(seen).toEqual([
      { name: "John" },
      { name: "Sarah" },
      { name: "Mike" },
    ]);
    expect(Array.isArray(result.processedUsers)).toBe(true);
    expect((result.processedUsers as unknown[]).length).toBe(3);
    // Each collected entry holds the item plus the iteration's downstream output.
    expect((result.processedUsers as Record<string, unknown>[])[0]).toEqual({
      currentUser: { name: "John" },
      sent: true,
    });
    // The original source remains untouched on the parent context.
    expect(result.src).toEqual(context.src);
  });

  it("isolates context between iterations (no leakage)", async () => {
    const markersSeen: unknown[] = [];
    const runNode: RunNode = async (n, ctx) => {
      // If iterations leaked, a marker set in a prior iteration would persist.
      markersSeen.push(ctx.marker);
      return { ...ctx, marker: "set-by-iteration" };
    };

    const context: WorkflowContext = { src: { users: [1, 2, 3] } };

    await executeGraph(loopNodes, loopConnections, context, runNode);

    // Every iteration starts with a fresh clone → marker is always undefined.
    expect(markersSeen).toEqual([undefined, undefined, undefined]);
  });

  it("passes a distinct iterationKey to each downstream invocation", async () => {
    const keys: (string | undefined)[] = [];
    const runNode: RunNode = async (_n, ctx, iterationKey) => {
      keys.push(iterationKey);
      return ctx;
    };

    const context: WorkflowContext = { src: { users: ["a", "b"] } };
    await executeGraph(loopNodes, loopConnections, context, runNode);

    expect(keys).toEqual(["0", "1"]);
  });

  it("throws when the source path is not an array", async () => {
    const runNode: RunNode = async (_n, ctx) => ctx;
    const context: WorkflowContext = { src: { users: "not-an-array" } };

    await expect(
      executeGraph(loopNodes, loopConnections, context, runNode),
    ).rejects.toThrow(/not an array/);
  });
});

describe("executeGraph — nested loops", () => {
  it("produces N*M downstream executions", async () => {
    const nodes = [
      node("outer", NodeType.LOOP, {
        sourcePath: "groups",
        itemVariableName: "group",
        variableName: "outerResults",
      }),
      node("inner", NodeType.LOOP, {
        sourcePath: "group.items",
        itemVariableName: "n",
        variableName: "innerResults",
      }),
      node("body", NodeType.DISCORD),
    ];
    const connections = [edge("outer", "inner"), edge("inner", "body")];

    const bodyItems: unknown[] = [];
    const runNode: RunNode = async (n, ctx) => {
      bodyItems.push(ctx.n);
      return { ...ctx, handled: true };
    };

    const context: WorkflowContext = {
      groups: [{ items: [1, 2] }, { items: [3] }],
    };

    const result = await executeGraph(nodes, connections, context, runNode);

    // body runs for 1, 2 (first group) then 3 (second group) = 3 times.
    expect(bodyItems).toEqual([1, 2, 3]);
    expect((result.outerResults as unknown[]).length).toBe(2);
  });
});

describe("executeGraph — error handling", () => {
  const loopNodes = (continueOnError: boolean) => [
    node("loop", NodeType.LOOP, {
      sourcePath: "src.items",
      itemVariableName: "item",
      variableName: "out",
      continueOnError,
    }),
    node("body", NodeType.DISCORD),
  ];
  const connections = [edge("loop", "body")];

  it("fail-fast: rethrows on the first failing iteration (default)", async () => {
    const runNode: RunNode = async (_n, ctx) => {
      if (ctx.item === 2) {
        throw new Error("boom");
      }
      return ctx;
    };
    const context: WorkflowContext = { src: { items: [1, 2, 3] } };

    await expect(
      executeGraph(loopNodes(false), connections, context, runNode),
    ).rejects.toThrow("boom");
  });

  it("continue-on-error: records failures and keeps going", async () => {
    const runNode: RunNode = async (_n, ctx) => {
      if (ctx.item === 2) {
        throw new Error("boom");
      }
      return { ...ctx, ok: true };
    };
    const context: WorkflowContext = { src: { items: [1, 2, 3] } };

    const result = await executeGraph(
      loopNodes(true),
      connections,
      context,
      runNode,
    );

    const out = result.out as Record<string, unknown>[];
    expect(out.length).toBe(3);
    expect(out[1]).toEqual({ success: false, error: "boom" });
    expect(out[0]).toMatchObject({ ok: true });
  });
});
