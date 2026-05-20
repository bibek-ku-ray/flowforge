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

type SlackData = {
  variableName?: string;
  webhookUrl?: string;
  content?: string;
};

export const slackExecutor: NodeExecutor<SlackData> = async ({
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
    throw new NonRetriableError("Slack node: Message content is required");
  }

  const rawContent = Handlebars.compile(data.content)(context);
  const content = decode(rawContent);

  try {
    const result = await step.run("slack-webhook", async () => {
      if (!data.webhookUrl) {
        throw new NonRetriableError("Slack node: Webhook URL is required");
      }

      await ky.post(data.webhookUrl, {
        json: {
          content,
        },
      });

      if (!data.variableName) {
        throw new NonRetriableError("Slack node: Variable name is missing");
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
