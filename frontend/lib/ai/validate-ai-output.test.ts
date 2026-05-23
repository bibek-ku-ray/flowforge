import { describe, expect, it } from "vitest";
import { validateAndExtractDiscordMessage } from "@/lib/ai/validate-ai-output";

describe("validateAndExtractDiscordMessage", () => {
  it("rejects empty output", () => {
    expect(validateAndExtractDiscordMessage("")).toEqual({
      ok: false,
      message: "AI output is empty",
    });
  });

  it("accepts plain text", () => {
    const result = validateAndExtractDiscordMessage("Hello team");
    expect(result).toMatchObject({ ok: true, message: "Hello team", source: "plain" });
  });

  it("parses structured JSON with discordMessage", () => {
    const result = validateAndExtractDiscordMessage(
      JSON.stringify({ discordMessage: "New form: Jane" }),
    );
    expect(result).toMatchObject({
      ok: true,
      message: "New form: Jane",
      source: "structured",
    });
  });

  it("rejects invalid JSON", () => {
    expect(validateAndExtractDiscordMessage("{not json")).toEqual({
      ok: false,
      message: "AI output is not valid JSON",
    });
  });

  it("accepts teacherFeedback field", () => {
    const result = validateAndExtractDiscordMessage(
      JSON.stringify({ teacherFeedback: "Great work on Q1." }),
    );
    expect(result).toMatchObject({
      ok: true,
      message: "Great work on Q1.",
      source: "json-field",
    });
  });

  it("accepts a single string property heuristic", () => {
    const result = validateAndExtractDiscordMessage(
      JSON.stringify({ evaluation: "Student shows strong understanding." }),
    );
    expect(result).toMatchObject({
      ok: true,
      message: "Student shows strong understanding.",
      source: "json-heuristic",
    });
  });

  it("strips markdown json fences", () => {
    const result = validateAndExtractDiscordMessage(
      '```json\n{"discordMessage":"Hello"}\n```',
    );
    expect(result).toMatchObject({ ok: true, message: "Hello" });
  });

  it("rejects JSON without a message field", () => {
    expect(validateAndExtractDiscordMessage(JSON.stringify({ foo: 1, bar: 2 }))).toEqual({
      ok: false,
      message:
        "AI JSON is missing a usable message field (expected discordMessage, message, feedback, summary, or a single string value)",
    });
  });
});
