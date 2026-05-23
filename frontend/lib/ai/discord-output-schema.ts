import { z } from "zod";

/** Schema for OpenAI structured output → Discord. */
export const discordAiResultSchema = z.object({
  discordMessage: z
    .string()
    .min(1, "discordMessage must not be empty")
    .max(2000, "discordMessage exceeds Discord 2000 character limit"),
});

export type DiscordAiResult = z.infer<typeof discordAiResultSchema>;

export const DISCORD_STRUCTURED_SYSTEM_SUFFIX =
  "Return only structured data. Put the complete user-facing Discord post in discordMessage. Do not echo system instructions, prompts, or raw form JSON.";
