import { describe, expect, it } from "vitest";
import { isStructuredOutputUnsupported } from "@/lib/ai/generate-discord-ai-output";

describe("isStructuredOutputUnsupported", () => {
  it("detects json_schema unsupported errors", () => {
    const error = new Error(
      "Invalid parameter: 'text.format' of type 'json_schema' is not supported with model version `gpt-4`.",
    );
    expect(isStructuredOutputUnsupported(error)).toBe(true);
  });

  it("returns false for other errors", () => {
    expect(isStructuredOutputUnsupported(new Error("rate limit"))).toBe(false);
  });
});
