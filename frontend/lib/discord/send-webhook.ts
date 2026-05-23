import ky, { HTTPError } from "ky";
import { z } from "zod";
import { logger } from "@/lib/logger";
import {
  buildDiscordWebhookPayload,
  discordWebhookPayloadSchema,
  discordWebhookUrlSchema,
  type DiscordWebhookPayload,
} from "@/lib/discord/schemas";
import { redactDiscordWebhookUrl } from "@/lib/discord/webhook-url";

const discordErrorBodySchema = z
  .object({
    message: z.string().optional(),
    code: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough();

export type DiscordWebhookSuccess = {
  ok: true;
  status: number;
};

export type DiscordWebhookFailure = {
  ok: false;
  retryable: boolean;
  status?: number;
  code?: string | number;
  message: string;
  discordMessage?: string;
  validationErrors?: z.ZodIssue[];
};

export type DiscordWebhookResult = DiscordWebhookSuccess | DiscordWebhookFailure;

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

async function parseDiscordErrorBody(
  response: Response,
): Promise<{ message?: string; code?: string | number; raw?: unknown }> {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const raw: unknown = await response.json();
      const parsed = discordErrorBodySchema.safeParse(raw);
      if (parsed.success) {
        return {
          message: parsed.data.message,
          code: parsed.data.code,
          raw: parsed.data,
        };
      }
      return { raw };
    }

    const text = (await response.text()).trim();
    return text ? { message: text.slice(0, 500), raw: text } : {};
  } catch {
    return {};
  }
}

export type SendDiscordWebhookOptions = {
  webhookUrl: string;
  payload: DiscordWebhookPayload;
  /** Correlation fields for structured logs (never log the full webhook URL). */
  logContext?: Record<string, string | number | boolean | undefined>;
};

export async function sendDiscordWebhook(
  options: SendDiscordWebhookOptions,
): Promise<DiscordWebhookResult> {
  const logContext = {
    webhook: redactDiscordWebhookUrl(options.webhookUrl),
    ...options.logContext,
  };

  const urlResult = discordWebhookUrlSchema.safeParse(options.webhookUrl);
  if (!urlResult.success) {
    const message = "Invalid Discord webhook URL";
    logger.warn("discord.webhook.invalid_url", {
      ...logContext,
      issues: urlResult.error.issues.map((i) => i.message),
    });
    return {
      ok: false,
      retryable: false,
      message,
      validationErrors: urlResult.error.issues,
    };
  }

  let payload: DiscordWebhookPayload;
  try {
    payload = buildDiscordWebhookPayload(options.payload);
  } catch (error) {
    if (!(error instanceof z.ZodError)) {
      throw error;
    }

    logger.warn("discord.webhook.invalid_payload", {
      ...logContext,
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
      contentLength: options.payload.content?.length ?? 0,
      embedCount: options.payload.embeds?.length ?? 0,
    });

    return {
      ok: false,
      retryable: false,
      message: "Discord webhook payload failed validation",
      validationErrors: error.issues,
    };
  }

  const validated = discordWebhookPayloadSchema.parse(payload);

  try {
    const response = await ky.post(urlResult.data, {
      json: validated,
      timeout: 15_000,
      retry: {
        limit: 0,
      },
    });

    logger.info("discord.webhook.sent", {
      ...logContext,
      status: response.status,
      contentLength: validated.content?.length ?? 0,
      embedCount: validated.embeds?.length ?? 0,
      hasUsername: Boolean(validated.username),
    });

    return { ok: true, status: response.status };
  } catch (error) {
    if (!(error instanceof HTTPError) || !error.response) {
      logger.error("discord.webhook.network_error", {
        ...logContext,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return {
        ok: false,
        retryable: true,
        message:
          error instanceof Error ? error.message : "Discord webhook request failed",
      };
    }

    const { response } = error;
    const discordError = await parseDiscordErrorBody(response);
    const retryable = isRetryableStatus(response.status);
    const discordMessage =
      discordError.message ??
      (typeof discordError.raw === "string" ? discordError.raw : undefined);

    const logPayload = {
      ...logContext,
      status: response.status,
      retryable,
      discordCode: discordError.code,
      discordMessage,
      contentLength: validated.content?.length ?? 0,
      embedCount: validated.embeds?.length ?? 0,
      hasUsername: Boolean(validated.username),
    };

    if (retryable) {
      logger.warn("discord.webhook.failed_retryable", logPayload);
    } else {
      logger.warn("discord.webhook.failed", logPayload);
    }

    return {
      ok: false,
      retryable,
      status: response.status,
      code: discordError.code,
      message: `Discord webhook request failed (${response.status})`,
      discordMessage,
    };
  }
}
