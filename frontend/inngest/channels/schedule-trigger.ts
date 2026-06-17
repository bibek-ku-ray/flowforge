import { realtime } from "inngest";
import { nodeStatusSchema } from "./node-status";

export const SCHEDULE_TRIGGER_CHANNEL_NAME = "schedule-trigger-execution";

export const scheduleTriggerChannel = realtime.channel({
  name: SCHEDULE_TRIGGER_CHANNEL_NAME,
  topics: {
    status: { schema: nodeStatusSchema },
  },
});
