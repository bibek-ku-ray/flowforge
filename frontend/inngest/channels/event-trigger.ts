import { realtime } from "inngest";
import { nodeStatusSchema } from "./node-status";

export const EVENT_TRIGGER_CHANNEL_NAME = "event-trigger-execution";

export const eventTriggerChannel = realtime.channel({
  name: EVENT_TRIGGER_CHANNEL_NAME,
  topics: {
    status: { schema: nodeStatusSchema },
  },
});
