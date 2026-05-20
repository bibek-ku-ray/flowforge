import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/execution/types";
import { publishNodeStatus } from "@/features/execution/lib/publish-execution-event";
import ky from "ky";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);

  return safeString;
});

type DiscordData = {
  variableName?: string;
  webhookUrl?: string;
  content?: string;
  username?: string;
};

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

  if (!data.content) {
    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "error");
    throw new NonRetriableError("Discord node: Message content is required");
  }

  const rawContent = Handlebars.compile(data.content)(context);
  const content = decode(rawContent);
  const username = data.username
    ? decode(Handlebars.compile(data.username)(context))
    : undefined;

  try {
    const result = await step.run("discord-webhook", async () => {
      if (!data.webhookUrl) {
        throw new NonRetriableError("Discord node: Webhook URL is required");
      }

      await ky.post(data.webhookUrl, {
        json: {
          content: content.slice(0, 2000),
          username,
        },
      });

      if (!data.variableName) {
        throw new NonRetriableError("Discord node: Variable name is missing");
      }

      return {
        ...context,
        [data.variableName]: {
          messageContent: content.slice(0, 2000),
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
