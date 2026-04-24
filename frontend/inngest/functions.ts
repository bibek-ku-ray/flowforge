import { generateText } from "ai";
import { inngest } from "./client";
import { openai } from "@ai-sdk/openai";

export const execute = inngest.createFunction(
  { id: "execute-ai", triggers: { event: "execute/ai" } },

  async ({ event, step }) => {
    const { steps } = await step.ai.wrap("openai-generate-text", generateText, {
      model: openai("gpt-5-nano"),
      system: "You are a helpful assistant",
      prompt: "What is 4-9?",
    });

    return { message: "AI execution complete", steps };
  },
);
