import { isAiNodeOutput, type AiNodeOutput } from "@/lib/ai/types";

const HANDLEBARS_REF = /\{\{([^}#/][^}]*)\}\}/g;

function parseRootRef(expression: string): string | undefined {
  const trimmed = expression.trim();
  if (trimmed.startsWith("json ")) {
    return trimmed.slice(5).trim().split(".")[0]?.split("[")[0];
  }
  return trimmed.split(".")[0]?.split("[")[0];
}

export function diagnoseEmptyDiscordTemplate(
  template: string,
  context: Record<string, unknown>,
): string[] {
  const hints: string[] = [];
  const aiVariables = Object.entries(context).filter(([, value]) =>
    isAiNodeOutput(value),
  );

  for (const match of template.matchAll(HANDLEBARS_REF)) {
    const expression = match[1]?.trim() ?? "";

    if (expression.startsWith("json ")) {
      continue;
    }

    const root = parseRootRef(expression);

    if (!root) {
      continue;
    }

    if (root === "myDiscord" || expression.includes("myDiscord.text")) {
      hints.push(
        "Do not use {{myDiscord.text}} for the message body. That is this node's output name — use your AI node's variable, e.g. {{myOpenAi.text}}.",
      );
    }

    if (expression.endsWith(".text") && !(root in context)) {
      const aiNames = aiVariables.map(([name]) => name);
      hints.push(
        `{{${expression}}} is undefined. Available AI outputs: ${
          aiNames.length ? aiNames.map((n) => `{{${n}.text}}`).join(", ") : "(none yet — check node order)"
        }.`,
      );
    }

    if (root in context && !expression.includes(".") && isAiNodeOutput(context[root])) {
      hints.push(
        `Use {{${root}.text}} instead of {{${root}}} — AI nodes store the message on the .text property.`,
      );
    }
  }

  for (const [name, value] of aiVariables as Array<[string, AiNodeOutput]>) {
    if (!value.text?.trim()) {
      hints.push(
        `AI variable "${name}" has empty .text — verify the AI node prompt and that it ran before Discord.`,
      );
    }
  }

  if (!aiVariables.length) {
    hints.push(
      "No AI output found in workflow context (expected shape: { myOpenAi: { text: \"...\" } }). Ensure an AI node runs before Discord and has a Variable Name set.",
    );
  }

  if (hints.length === 0) {
    hints.push(
      "Set Discord Message Content to your AI variable, e.g. {{myOpenAi.text}}, matching the AI node's Variable Name exactly.",
    );
  }

  return [...new Set(hints)];
}
