import { describe, expect, it } from "vitest";
import { diagnoseEmptyDiscordTemplate } from "@/lib/discord/diagnose-template";

describe("diagnoseEmptyDiscordTemplate", () => {
  it("detects wrong AI variable name", () => {
    const hints = diagnoseEmptyDiscordTemplate("{{myGemini.text}}", {
      myOpenAi: { text: "Summary ready" },
    });

    expect(hints.some((h) => h.includes("myOpenAi.text"))).toBe(true);
  });

  it("detects myDiscord.text misuse", () => {
    const hints = diagnoseEmptyDiscordTemplate("{{myDiscord.text}}", {
      myOpenAi: { text: "Summary ready" },
    });

    expect(hints.some((h) => h.includes("myOpenAi.text"))).toBe(true);
  });

  it("detects empty AI text", () => {
    const hints = diagnoseEmptyDiscordTemplate("{{myOpenAi.text}}", {
      myOpenAi: { text: "   " },
    });

    expect(hints.some((h) => h.includes('empty .text'))).toBe(true);
  });
});
