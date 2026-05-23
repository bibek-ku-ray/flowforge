import { describe, expect, it } from "vitest";
import {
  assertAiSourceInContext,
  mergeOpenAiIntoContext,
  OPENAI_CANONICAL_KEY,
} from "@/lib/ai/workflow-context";

describe("mergeOpenAiIntoContext", () => {
  it("writes both custom name and openai alias", () => {
    const entry = { text: "Hello Discord" };
    const context = mergeOpenAiIntoContext(
      { googleForm: { formTitle: "Quiz" } },
      "ffopenai",
      entry,
    );

    expect(context.ffopenai).toEqual(entry);
    expect(context[OPENAI_CANONICAL_KEY]).toEqual(entry);
  });

  it("does not duplicate when variable is already openai", () => {
    const entry = { text: "Hi" };
    const context = mergeOpenAiIntoContext({}, "openai", entry);
    expect(context.openai).toEqual(entry);
    expect(Object.keys(context)).toEqual(["openai"]);
  });
});

describe("assertAiSourceInContext", () => {
  it("passes when openai exists", () => {
    expect(
      assertAiSourceInContext({ openai: { text: "x" } }, "openai"),
    ).toEqual({ ok: true, variableName: "openai" });
  });

  it("fails with available keys hint", () => {
    const result = assertAiSourceInContext(
      { ffopenai: { text: "x" } },
      "openai",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("ffopenai");
    }
  });
});
