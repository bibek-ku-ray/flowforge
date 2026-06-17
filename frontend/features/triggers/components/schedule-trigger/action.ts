"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { scheduleTriggerChannel } from "@/inngest/channels/schedule-trigger";
import { inngest } from "@/inngest/client";

export async function fetchScheduleTriggerRealtimeToken() {
  return getClientSubscriptionToken(inngest, {
    channel: scheduleTriggerChannel,
    topics: ["status"],
  });
}
