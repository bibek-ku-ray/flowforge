import { realtime } from "inngest";
import { nodeStatusSchema } from "./node-status";

export const OPENAI_CHANNEL_NAME = "openai-execution";

export const openAiChannel = realtime.channel({
  name: OPENAI_CHANNEL_NAME,
  topics: {
    status: { schema: nodeStatusSchema },
  },
});
