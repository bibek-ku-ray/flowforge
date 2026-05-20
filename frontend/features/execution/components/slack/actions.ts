"use server";

import { getSubscriptionToken } from "@inngest/realtime";
import { slackChannel } from "@/inngest/channels/slack";
import { inngest } from "@/inngest/client";

export async function fetchSlackRealtimeToken() {
  return getSubscriptionToken(inngest, {
    channel: slackChannel(),
    topics: ["status"] as ["status"],
  });
}

export type SlackToken = Awaited<ReturnType<typeof fetchSlackRealtimeToken>>;
