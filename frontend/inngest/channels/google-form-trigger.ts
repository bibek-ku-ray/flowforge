import { realtime } from "inngest";
import { nodeStatusSchema } from "./node-status";

export const GOOGLE_FORM_TRIGGER_CHANNEL_NAME = "google-form-trigger-execution";

export const googleFormTriggerChannel = realtime.channel(
  {
    name: GOOGLE_FORM_TRIGGER_CHANNEL_NAME,
    topics: {
      status: {schema: nodeStatusSchema}
    }
  }
);
