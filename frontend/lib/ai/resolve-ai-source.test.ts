import { describe, expect, it } from "vitest";
import { resolveAiSourceVariable } from "@/lib/ai/resolve-ai-source";

describe("resolveAiSourceVariable", () => {
  it("uses explicit aiSourceVariable", () => {
    const result = resolveAiSourceVariable(
      { ffopenai: { text: "hi" } },
      { aiSourceVariable: "ffopenai" },
    );
    expect(result).toEqual({ variableName: "ffopenai" });
  });

  it("parses legacy {{var.text}} template", () => {
    const result = resolveAiSourceVariable(
      { ffopenai: { text: "hi" } },
      { legacyContentTemplate: "{{ffopenai.text}}" },
    );
    expect(result).toEqual({ variableName: "ffopenai" });
  });

  it("auto-selects single AI output", () => {
    const result = resolveAiSourceVariable(
      { ffopenai: { text: "hi" } },
      {},
    );
    expect(result).toEqual({ variableName: "ffopenai" });
  });

  it("resolves openai template to sole AI output when openai alias missing", () => {
    const result = resolveAiSourceVariable(
      { ffopenai: { text: "hi" } },
      { legacyContentTemplate: "{{openai.text}}" },
    );
    expect(result).toEqual({ variableName: "ffopenai" });
  });

  it("prefers openai key when present", () => {
    const result = resolveAiSourceVariable(
      { openai: { text: "hi" }, ffopenai: { text: "old" } },
      { aiSourceVariable: "openai" },
    );
    expect(result).toEqual({ variableName: "openai" });
  });
});
