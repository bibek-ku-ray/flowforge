import { realtime } from "inngest";
import { nodeStatusSchema } from "./node-status";

export const EMAIL_CHANNEL_NAME = "email-execution";

export const emailChannel = realtime.channel({
  name: EMAIL_CHANNEL_NAME,
  topics: {
    status: { schema: nodeStatusSchema },
  },
});
