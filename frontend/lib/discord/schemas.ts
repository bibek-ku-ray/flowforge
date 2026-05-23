import { z } from "zod";
import { isDiscordWebhookUrl } from "@/lib/discord/webhook-url";

const DISCORD_CONTENT_MAX = 2000;
const DISCORD_USERNAME_MAX = 80;

const forbiddenUsername = /discord|clyde/i;

const discordEmbedSchema = z.object({
  title: z.string().max(256).optional(),
  description: z.string().max(4096).optional(),
  url: z.string().url().optional(),
  color: z.number().int().min(0).max(0xffffff).optional(),
  fields: z
    .array(
      z.object({
        name: z.string().min(1).max(256),
        value: z.string().min(1).max(1024),
        inline: z.boolean().optional(),
      }),
    )
    .max(25)
    .optional(),
  footer: z
    .object({
      text: z.string().min(1).max(2048),
      icon_url: z.string().url().optional(),
    })
    .optional(),
  timestamp: z.string().datetime().optional(),
});

export const discordWebhookPayloadSchema = z
  .object({
    content: z.string().max(DISCORD_CONTENT_MAX).optional(),
    username: z
      .string()
      .min(1)
      .max(DISCORD_USERNAME_MAX)
      .refine((value) => !forbiddenUsername.test(value), {
        message: 'Username cannot contain "discord" or "clyde"',
      })
      .optional(),
    avatar_url: z.string().url().optional(),
    embeds: z.array(discordEmbedSchema).max(10).optional(),
    allowed_mentions: z
      .object({
        parse: z.array(z.enum(["roles", "users", "everyone"])).optional(),
      })
      .optional(),
  })
  .superRefine((payload, ctx) => {
    const content = payload.content?.trim();
    const hasContent = Boolean(content);
    const hasEmbeds = Boolean(payload.embeds?.length);

    if (!hasContent && !hasEmbeds) {
      ctx.addIssue({
        code: "custom",
        message:
          "Discord requires at least one of: non-empty content, or embeds",
        path: ["content"],
      });
    }
  });

export type DiscordWebhookPayload = z.infer<typeof discordWebhookPayloadSchema>;

export const discordWebhookUrlSchema = z.string().url().refine(isDiscordWebhookUrl, {
  message: "Must be a valid Discord webhook URL (https://discord.com/api/webhooks/...)",
});

/** Strips empty optional fields Discord rejects or treats as invalid. */
export function buildDiscordWebhookPayload(
  input: DiscordWebhookPayload,
): DiscordWebhookPayload {
  const trimmedContent = input.content?.trim();
  const trimmedUsername = input.username?.trim();

  const candidate: DiscordWebhookPayload = {
    ...(trimmedContent ? { content: trimmedContent.slice(0, DISCORD_CONTENT_MAX) } : {}),
    ...(trimmedUsername ? { username: trimmedUsername.slice(0, DISCORD_USERNAME_MAX) } : {}),
    ...(input.avatar_url ? { avatar_url: input.avatar_url } : {}),
    ...(input.embeds?.length ? { embeds: input.embeds } : {}),
    ...(input.allowed_mentions ? { allowed_mentions: input.allowed_mentions } : {}),
  };

  return discordWebhookPayloadSchema.parse(candidate);
}
