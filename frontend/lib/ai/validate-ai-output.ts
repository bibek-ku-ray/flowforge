import { discordAiResultSchema } from "@/lib/ai/discord-output-schema";

const DISCORD_CONTENT_MAX = 2000;

const MESSAGE_FIELD_CANDIDATES = [
  "discordMessage",
  "discord_message",
  "message",
  "content",
  "text",
  "teacherFeedback",
  "teacher_feedback",
  "feedback",
  "summary",
  "result",
  "answer",
  "response",
  "body",
  "output",
] as const;

export type ValidateAiOutputSuccess = {
  ok: true;
  message: string;
  source: "plain" | "structured" | "json-field" | "json-heuristic";
};

export type ValidateAiOutputFailure = {
  ok: false;
  message: string;
};

export type ValidateAiOutputResult =
  | ValidateAiOutputSuccess
  | ValidateAiOutputFailure;

export function truncateForDiscord(message: string): string {
  return message.trim().slice(0, DISCORD_CONTENT_MAX);
}

/** Strips ```json fences and leading/trailing whitespace. */
export function normalizeRawAiOutput(raw: string): string {
  let output = raw.trim();

  const fenceMatch = output.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  if (fenceMatch) {
    output = fenceMatch[1].trim();
  }

  return output;
}

function pickBestStringField(record: Record<string, unknown>): string | null {
  for (const key of MESSAGE_FIELD_CANDIDATES) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  const stringValues = Object.values(record).filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );

  if (stringValues.length === 1) {
    return stringValues[0];
  }

  if (stringValues.length > 1) {
    return stringValues.sort((a, b) => b.length - a.length)[0];
  }

  return null;
}

function extractMessageFromParsedJson(
  parsed: unknown,
  depth = 0,
): ValidateAiOutputResult | null {
  if (depth > 2) {
    return null;
  }

  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      const extracted = extractMessageFromParsedJson(item, depth + 1);
      if (extracted?.ok) {
        return extracted;
      }
    }
    return null;
  }

  const structured = discordAiResultSchema.safeParse(parsed);
  if (structured.success) {
    return {
      ok: true,
      message: truncateForDiscord(structured.data.discordMessage),
      source: "structured",
    };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  const record = parsed as Record<string, unknown>;

  const bestString = pickBestStringField(record);
  if (bestString) {
    const source =
      MESSAGE_FIELD_CANDIDATES.some(
        (key) =>
          typeof record[key] === "string" &&
          (record[key] as string).trim() === bestString.trim(),
      )
        ? "json-field"
        : "json-heuristic";

    return {
      ok: true,
      message: truncateForDiscord(bestString),
      source,
    };
  }

  for (const value of Object.values(record)) {
    if (typeof value === "object" && value !== null) {
      const nested = extractMessageFromParsedJson(value, depth + 1);
      if (nested?.ok) {
        return nested;
      }
    }
  }

  return null;
}

/**
 * Validates AI output before posting to Discord.
 * Accepts plain text or JSON with a discordMessage (or common) field.
 */
export function validateAndExtractDiscordMessage(
  raw: string | undefined,
): ValidateAiOutputResult {
  const output = normalizeRawAiOutput(raw ?? "");

  if (!output) {
    return { ok: false, message: "AI output is empty" };
  }

  if (!output.startsWith("{") && !output.startsWith("[")) {
    return {
      ok: true,
      message: truncateForDiscord(output),
      source: "plain",
    };
  }

  try {
    const parsed: unknown = JSON.parse(output);
    const extracted = extractMessageFromParsedJson(parsed);

    if (extracted?.ok) {
      return extracted;
    }

    return {
      ok: false,
      message:
        "AI JSON is missing a usable message field (expected discordMessage, message, feedback, summary, or a single string value)",
    };
  } catch {
    return { ok: false, message: "AI output is not valid JSON" };
  }
}
