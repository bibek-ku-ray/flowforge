import { isAiNodeOutput, type AiNodeOutput } from "@/lib/ai/types";

/** Canonical key so Discord can use {{openai.text}} regardless of custom Variable Name. */
export const OPENAI_CANONICAL_KEY = "openai";

export function createAiNodeOutput(
  message: string,
  structured?: AiNodeOutput["structured"],
): AiNodeOutput {
  return {
    text: message,
    ...(structured ? { structured } : {}),
  };
}

/**
 * Merges AI output into workflow context under the node Variable Name and, when
 * different, under `openai` for templates that expect {{openai.text}}.
 */
export function mergeOpenAiIntoContext(
  context: Record<string, unknown>,
  variableName: string,
  entry: AiNodeOutput,
): Record<string, unknown> {
  const next: Record<string, unknown> = {
    ...context,
    [variableName]: entry,
  };

  if (variableName !== OPENAI_CANONICAL_KEY) {
    next[OPENAI_CANONICAL_KEY] = entry;
  }

  return next;
}

export function listAiContextKeys(context: Record<string, unknown>): string[] {
  return Object.entries(context)
    .filter(([, value]) => isAiNodeOutput(value))
    .map(([key]) => key);
}

export type AssertAiSourceResult =
  | { ok: true; variableName: string }
  | { ok: false; message: string };

export function assertAiSourceInContext(
  context: Record<string, unknown>,
  sourceVariable: string,
): AssertAiSourceResult {
  const name = sourceVariable.trim();

  if (!name) {
    return { ok: false, message: "AI source variable name is required" };
  }

  if (isAiNodeOutput(context[name])) {
    return { ok: true, variableName: name };
  }

  const available = listAiContextKeys(context);
  const hints =
    available.length > 0
      ? `Available: ${available.map((k) => `{{${k}.text}}`).join(", ")}`
      : "No AI output in context — ensure the OpenAI node runs before Discord.";

  return {
    ok: false,
    message: `AI source "${name}" is missing from context. ${hints}`,
  };
}
