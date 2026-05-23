const DISCORD_WEBHOOK_HOSTS = new Set(["discord.com", "discordapp.com"]);

/** Discord incoming webhook path: /api/webhooks/{id}/{token} */
const DISCORD_WEBHOOK_PATH = /^\/api\/webhooks\/\d+\/[\w-]+$/;

export function isDiscordWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (!DISCORD_WEBHOOK_HOSTS.has(parsed.hostname)) return false;
    return DISCORD_WEBHOOK_PATH.test(parsed.pathname);
  } catch {
    return false;
  }
}

/** Safe for logs — never includes the webhook token. */
export function redactDiscordWebhookUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);

    if (
      segments[0] === "api" &&
      segments[1] === "webhooks" &&
      segments[2]
    ) {
      return `${parsed.origin}/api/webhooks/${segments[2]}/…`;
    }

    return `${parsed.origin}/…`;
  } catch {
    return "<invalid-webhook-url>";
  }
}
