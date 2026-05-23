import { describe, expect, it } from "vitest";
import { buildDiscordWebhookPayload } from "@/lib/discord/schemas";
import { redactDiscordWebhookUrl } from "@/lib/discord/webhook-url";

describe("buildDiscordWebhookPayload", () => {
  it("rejects empty content without embeds", () => {
    expect(() => buildDiscordWebhookPayload({ content: "   " })).toThrow();
  });

  it("accepts non-empty content", () => {
    const payload = buildDiscordWebhookPayload({ content: "Hello" });
    expect(payload).toEqual({ content: "Hello" });
  });

  it("omits blank username", () => {
    const payload = buildDiscordWebhookPayload({
      content: "Hello",
      username: "   ",
    });
    expect(payload).toEqual({ content: "Hello" });
  });

  it("rejects forbidden usernames", () => {
    expect(() =>
      buildDiscordWebhookPayload({
        content: "Hello",
        username: "Discord Bot",
      }),
    ).toThrow();
  });
});

describe("redactDiscordWebhookUrl", () => {
  it("never includes the webhook token", () => {
    const redacted = redactDiscordWebhookUrl(
      "https://discord.com/api/webhooks/123456789/secret-token-value",
    );
    expect(redacted).toBe("https://discord.com/api/webhooks/123456789/…");
    expect(redacted).not.toContain("secret-token-value");
  });
});
