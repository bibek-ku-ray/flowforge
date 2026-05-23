import { describe, expect, it } from "vitest";
import { resolveDiscordContent } from "@/lib/discord/resolve-discord-content";

describe("resolveDiscordContent", () => {
  it("renders a correct template", () => {
    const result = resolveDiscordContent("{{ffopenai.text}}", {
      ffopenai: { text: "Hello" },
    });
    expect(result).toEqual({ content: "Hello" });
  });

  it("auto-corrects when template uses wrong AI variable name", () => {
    const result = resolveDiscordContent("{{openai.text}}", {
      ffopenai: { text: "Hello from AI" },
    });
    expect(result.content).toBe("Hello from AI");
    expect(result.autoCorrectedFrom).toBe("{{openai.text}}");
    expect(result.suggestedTemplate).toBe("{{ffopenai.text}}");
  });

  it("does not auto-correct when multiple AI outputs exist", () => {
    const result = resolveDiscordContent("{{openai.text}}", {
      ffopenai: { text: "A" },
      otherAi: { text: "B" },
    });
    expect(result.content).toBeUndefined();
  });
});
