import {
  listAiContextKeys,
  OPENAI_CANONICAL_KEY,
} from "@/lib/ai/workflow-context";
import { isAiNodeOutput, type AiNodeOutput } from "@/lib/ai/types";

const AI_TEXT_TEMPLATE = /^\{\{([A-Za-z_$][\w$]*)\.text\}\}$/;

export function parseAiSourceFromContentTemplate(
  content: string | undefined,
): string | undefined {
  const trimmed = content?.trim();
  if (!trimmed) {
    return undefined;
  }

  const match = trimmed.match(AI_TEXT_TEMPLATE);
  return match?.[1];
}

export function findAiOutputsInContext(
  context: Record<string, unknown>,
): Array<[string, AiNodeOutput]> {
  return Object.entries(context).filter((entry): entry is [string, AiNodeOutput] =>
    isAiNodeOutput(entry[1]),
  );
}

export function resolveAiSourceVariable(
  context: Record<string, unknown>,
  options: {
    aiSourceVariable?: string;
    legacyContentTemplate?: string;
  },
): { variableName: string } | { error: string } {
  if (options.aiSourceVariable?.trim()) {
    const name = options.aiSourceVariable.trim();
    if (!isAiNodeOutput(context[name])) {
      return {
        error: missingAiSourceMessage(name, context),
      };
    }
    return { variableName: name };
  }

  const fromTemplate = parseAiSourceFromContentTemplate(
    options.legacyContentTemplate,
  );
  if (fromTemplate) {
    if (isAiNodeOutput(context[fromTemplate])) {
      return { variableName: fromTemplate };
    }

    const aiOutputs = findAiOutputsInContext(context);
    if (
      fromTemplate === OPENAI_CANONICAL_KEY &&
      aiOutputs.length === 1
    ) {
      return { variableName: aiOutputs[0][0] };
    }

    return {
      error: missingAiSourceMessage(fromTemplate, context),
    };
  }

  const aiOutputs = findAiOutputsInContext(context);
  if (aiOutputs.length === 1) {
    return { variableName: aiOutputs[0][0] };
  }

  if (aiOutputs.length === 0) {
    return {
      error:
        "No AI output in context. Connect an OpenAI node before Discord and run the workflow.",
    };
  }

  return {
    error: `Multiple AI outputs found (${aiOutputs.map(([n]) => n).join(", ")}). Set AI Source Variable on the Discord node.`,
  };
}

function missingAiSourceMessage(
  name: string,
  context: Record<string, unknown>,
): string {
  const available = listAiContextKeys(context);
  const hints =
    available.length > 0
      ? `Available: ${available.map((k) => `{{${k}.text}}`).join(", ")}`
      : "none (run OpenAI before Discord)";

  return `AI source "${name}" is missing from context. ${hints}. OpenAI nodes also expose {{openai.text}} when using a custom Variable Name.`;
}
