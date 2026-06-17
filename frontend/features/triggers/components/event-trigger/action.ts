"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { eventTriggerChannel } from "@/inngest/channels/event-trigger";
import { inngest } from "@/inngest/client";

export async function fetchEventTriggerRealtimeToken() {
  return getClientSubscriptionToken(inngest, {
    channel: eventTriggerChannel,
    topics: ["status"],
  });
}
