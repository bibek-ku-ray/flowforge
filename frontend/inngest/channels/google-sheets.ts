import { realtime } from "inngest";
import { nodeStatusSchema } from "./node-status";

export const GOOGLE_SHEETS_CHANNEL_NAME = "google-sheets-execution";

export const googleSheetsChannel = realtime.channel({
  name: GOOGLE_SHEETS_CHANNEL_NAME,
  topics: {
    status: { schema: nodeStatusSchema },
  },
});
