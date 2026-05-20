import { realtime } from "inngest";
import { nodeStatusSchema } from "./node-status";

export const ANTHROPIC_CHANNEL_NAME = "anthropic-execution";

export const anthropicChannel = realtime.channel({
  name: ANTHROPIC_CHANNEL_NAME,
  topics: {
    status: { schema: nodeStatusSchema },
  },
});
