import Handlebars from "handlebars";
import { decode } from "html-entities";
import { isAiNodeOutput, type AiNodeOutput } from "@/lib/ai/types";

function renderTemplate(
  template: string,
  context: Record<string, unknown>,
): string | undefined {
  return decode(Handlebars.compile(template)(context)).trim() || undefined;
}

export function getAiOutputsWithText(
  context: Record<string, unknown>,
): Array<[string, AiNodeOutput]> {
  return Object.entries(context).filter(
    (entry): entry is [string, AiNodeOutput] =>
      isAiNodeOutput(entry[1]) && Boolean(entry[1].text?.trim()),
  );
}

export type ResolveDiscordContentResult = {
  content: string | undefined;
  /** Set when a wrong template was auto-corrected to the sole AI output. */
  autoCorrectedFrom?: string;
  suggestedTemplate?: string;
};

/**
 * Renders Discord message content. When the template references a missing AI
 * variable but exactly one AI output exists in context, uses that output.
 */
export function resolveDiscordContent(
  template: string,
  context: Record<string, unknown>,
): ResolveDiscordContentResult {
  const direct = renderTemplate(template, context);
  if (direct) {
    return { content: direct };
  }

  const aiOutputs = getAiOutputsWithText(context);

  if (aiOutputs.length === 1) {
    const [aiName] = aiOutputs[0];
    const suggestedTemplate = `{{${aiName}.text}}`;
    const fallback = renderTemplate(suggestedTemplate, context);

    if (fallback) {
      return {
        content: fallback,
        autoCorrectedFrom: template.trim(),
        suggestedTemplate,
      };
    }
  }

  return { content: undefined };
}
