import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { NodeExecutor } from "@/features/execution/types";
import { publishNodeStatus } from "@/features/execution/lib/publish-execution-event";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { makeStepId } from "@/features/execution/lib/step-id";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);

  return safeString;
});

type AnthropicData = {
  variableName?: string;
  credentialId?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

export const anthropicExecutor: NodeExecutor<AnthropicData> = async ({
  data,
  nodeId,
  userId,
  nodeType,
  workflowId,
  context,
  step,
  publish,
  iterationKey,
}) => {
  await publishNodeStatus(publish, workflowId, nodeId, nodeType, "loading");

  if (!data.variableName) {
    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "error");
    throw new NonRetriableError("Anthropic node: Variable name is missing");
  }

  if (!data.credentialId) {
    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "error");
    throw new NonRetriableError("Anthropic node: Credential is required");
  }

  if (!data.userPrompt) {
    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "error");
    throw new NonRetriableError("Anthropic node: User prompt is missing");
  }

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant.";
  const userPrompt = Handlebars.compile(data.userPrompt)(context);

  const credential = await step.run(makeStepId("get-credential", nodeId, iterationKey), () => {
    return prisma.credential.findUnique({
      where: {
        id: data.credentialId,
        userId,
      },
    });
  });

  if (!credential) {
    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "error");
    throw new NonRetriableError("Anthropic node: Credential not found");
  }

  const anthropic = createAnthropic({
    apiKey: decrypt(credential.value),
  });

  try {
    const { steps } = await step.ai.wrap(
      makeStepId("anthropic-generate-text", nodeId, iterationKey),
      generateText,
      {
        model: anthropic("claude-sonnet-4-5"),
        system: systemPrompt,
        prompt: userPrompt,
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      },
    );

    const text =
      steps[0].content[0].type === "text" ? steps[0].content[0].text : "";

    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "success");

    return {
      ...context,
      [data.variableName]: {
        text,
      },
    };
  } catch (error) {
    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "error");
    throw error;
  }
};
