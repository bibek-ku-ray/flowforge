import { describe, expect, it } from "vitest";
import {
  diffContext,
  getByPath,
  LoopConfigError,
  resolveLoopArray,
} from "./loop";

describe("getByPath", () => {
  it("resolves a nested object path", () => {
    const source = { usersResponse: { users: [{ name: "John" }] } };
    expect(getByPath(source, "usersResponse.users")).toEqual([
      { name: "John" },
    ]);
  });

  it("resolves array indices", () => {
    const source = { items: [{ id: "a" }, { id: "b" }] };
    expect(getByPath(source, "items.1.id")).toBe("b");
  });

  it("returns undefined for a missing segment", () => {
    expect(getByPath({ a: {} }, "a.b.c")).toBeUndefined();
  });

  it("returns the source when path is empty", () => {
    const source = { a: 1 };
    expect(getByPath(source, "")).toBe(source);
  });

  it("does not throw when traversing through a primitive", () => {
    expect(getByPath({ a: 5 }, "a.b")).toBeUndefined();
  });
});

describe("resolveLoopArray", () => {
  it("returns the array at the source path", () => {
    const context = { usersResponse: { users: [1, 2, 3] } };
    expect(resolveLoopArray(context, "usersResponse.users")).toEqual([1, 2, 3]);
  });

  it("throws when the path is not configured", () => {
    expect(() => resolveLoopArray({}, undefined)).toThrow(LoopConfigError);
    expect(() => resolveLoopArray({}, "   ")).toThrow(/not configured/);
  });

  it("throws when nothing is found at the path", () => {
    expect(() => resolveLoopArray({ a: {} }, "a.missing")).toThrow(
      /nothing found/,
    );
  });

  it("throws when the value is not an array", () => {
    expect(() => resolveLoopArray({ a: { b: 5 } }, "a.b")).toThrow(
      /not an array/,
    );
  });
});

describe("diffContext", () => {
  it("returns only added or changed keys", () => {
    const parent = { keep: 1, change: "old" };
    const iteration = { keep: 1, change: "new", added: true };
    expect(diffContext(parent, iteration)).toEqual({
      change: "new",
      added: true,
    });
  });

  it("returns an empty object when nothing changed", () => {
    const shared = { a: { nested: true } };
    const parent = { ref: shared };
    const iteration = { ref: shared };
    expect(diffContext(parent, iteration)).toEqual({});
  });
});
