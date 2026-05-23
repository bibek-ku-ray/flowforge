import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/execution/types";
import { publishNodeStatus } from "@/features/execution/lib/publish-execution-event";
import { resolveAiSourceVariable } from "@/lib/ai/resolve-ai-source";
import { assertAiSourceInContext } from "@/lib/ai/workflow-context";
import { isAiNodeOutput } from "@/lib/ai/types";
import { validateAndExtractDiscordMessage } from "@/lib/ai/validate-ai-output";
import { sendDiscordWebhook } from "@/lib/discord/send-webhook";
import { logger } from "@/lib/logger";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);

  return safeString;
});

type DiscordData = {
  variableName?: string;
  webhookUrl?: string;
  /** @deprecated Use aiSourceVariable — legacy Handlebars template */
  content?: string;
  /** OpenAI (or other AI) node variable name, e.g. ffopenai */
  aiSourceVariable?: string;
  username?: string;
};

function renderTemplate(
  template: string | undefined,
  context: Record<string, unknown>,
): string | undefined {
  if (!template?.trim()) {
    return undefined;
  }

  return decode(Handlebars.compile(template)(context)).trim() || undefined;
}

function toDiscordFailureMessage(result: Extract<
  Awaited<ReturnType<typeof sendDiscordWebhook>>,
  { ok: false }
>): string {
  const parts = [result.message];

  if (result.discordMessage) {
    parts.push(result.discordMessage);
  }

  if (result.code !== undefined) {
    parts.push(`code=${String(result.code)}`);
  }

  return parts.join(": ");
}

export const discordExecutor: NodeExecutor<DiscordData> = async ({
  data,
  nodeId,
  nodeType,
  workflowId,
  context,
  step,
  publish,
}) => {
  await publishNodeStatus(publish, workflowId, nodeId, nodeType, "loading");

  const aiSource = resolveAiSourceVariable(context, {
    aiSourceVariable: data.aiSourceVariable,
    legacyContentTemplate: data.content,
  });

  if ("error" in aiSource) {
    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "error");
    throw new NonRetriableError(`Discord node: ${aiSource.error}`);
  }

  try {
    const content = await step.run("validate-ai-output", async () => {
      const asserted = assertAiSourceInContext(
        context,
        aiSource.variableName,
      );

      if (!asserted.ok) {
        throw new NonRetriableError(`Discord node: ${asserted.message}`);
      }

      const aiOutput = context[asserted.variableName];

      if (!isAiNodeOutput(aiOutput)) {
        throw new NonRetriableError(
          `Discord node: AI source "${aiSource.variableName}" is not a valid AI result`,
        );
      }

      const validated = validateAndExtractDiscordMessage(aiOutput.text);

      if (!validated.ok) {
        throw new NonRetriableError(`Discord node: ${validated.message}`);
      }

      logger.info("discord.ai_output.validated", {
        workflowId,
        nodeId,
        aiSourceVariable: aiSource.variableName,
        source: validated.source,
        messageLength: validated.message.length,
      });

      return validated.message;
    });

    const username = renderTemplate(data.username, context);

    const result = await step.run("discord-webhook", async () => {
      if (!data.webhookUrl) {
        throw new NonRetriableError("Discord node: Webhook URL is required");
      }

      if (!data.variableName) {
        throw new NonRetriableError("Discord node: Variable name is missing");
      }

      const webhookResult = await sendDiscordWebhook({
        webhookUrl: data.webhookUrl,
        payload: { content },
        logContext: {
          workflowId,
          nodeId,
          nodeType,
          aiSourceVariable: aiSource.variableName,
        },
      });

      if (!webhookResult.ok) {
        const message = toDiscordFailureMessage(webhookResult);

        if (!webhookResult.retryable) {
          throw new NonRetriableError(`Discord node: ${message}`);
        }

        throw new Error(`Discord node: ${message}`);
      }

      return {
        ...context,
        [data.variableName]: {
          messageContent: content,
        },
      };
    });

    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "success");

    return result;
  } catch (error) {
    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "error");
    throw error;
  }
};
