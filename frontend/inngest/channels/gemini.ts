import { realtime } from "inngest";
import { nodeStatusSchema } from "./node-status";

export const GEMINI_CHANNEL_NAME = "gemini-execution";

export const geminiChannel = realtime.channel({
  name: GEMINI_CHANNEL_NAME,
  topics: {
    status: { schema: nodeStatusSchema },
  },
});
