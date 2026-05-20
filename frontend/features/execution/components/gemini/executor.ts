import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { NodeExecutor } from "@/features/execution/types";
import { publishNodeStatus } from "@/features/execution/lib/publish-execution-event";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);

  return safeString;
});

type GeminiData = {
  variableName?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

export const geminiExecutor: NodeExecutor<GeminiData> = async ({
  data,
  nodeId,
  nodeType,
  workflowId,
  context,
  step,
  publish,
}) => {
  await publishNodeStatus(publish, workflowId, nodeId, nodeType, "loading");

  if (!data.variableName) {
    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "error");
    throw new NonRetriableError("Gemini node: Variable name is missing");
  }

  if (!data.userPrompt) {
    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "error");
    throw new NonRetriableError("Gemini node: User prompt is missing");
  }

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant.";
  const userPrompt = Handlebars.compile(data.userPrompt)(context);

  const credentialValue = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

  const google = createGoogleGenerativeAI({
    apiKey: credentialValue,
  });

  try {
    const { steps } = await step.ai.wrap(
      "gemini-generate-text",
      generateText,
      {
        model: google("gemini-2.0-flash"),
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
      steps[0].content[0].type === "text"
        ? steps[0].content[0].text
        : "";

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
