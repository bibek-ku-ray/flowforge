import { realtime } from "inngest";
import { nodeStatusSchema } from "./node-status";

export const HTTP_REQUEST_CHANNEL_NAME = "http-request-execution";

export const httpRequestChannel = realtime.channel({
  name: HTTP_REQUEST_CHANNEL_NAME,
  topics: {
    status: { schema: nodeStatusSchema },
  },
});
