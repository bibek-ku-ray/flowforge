import { realtime } from "inngest";
import { nodeStatusSchema } from "./node-status";

export const STRIPE_TRIGGER_CHANNEL_NAME = "stripe-trigger-execution";

export const stripeTriggerChannel = realtime.channel({
  name: STRIPE_TRIGGER_CHANNEL_NAME,
  topics: {
    status: { schema: nodeStatusSchema },
  },
});
