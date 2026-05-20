"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { inngest } from "@/inngest/client";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";

export async function fetchGoogleFormTriggerRealtimeToken() {
  return getClientSubscriptionToken(inngest, {
    channel: googleFormTriggerChannel,
    topics: ["status"],
  });
}
