import { realtime } from "inngest";
import { nodeStatusSchema } from "./node-status";

export const MANUAL_TRIGGER_CHANNEL_NAME = "manual-trigger-execution";

export const manualTriggerChannel = realtime.channel({
  name: MANUAL_TRIGGER_CHANNEL_NAME,
  topics: {
    status: { schema: nodeStatusSchema },
  },
});
