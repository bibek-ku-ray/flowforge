"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { googleSheetsChannel } from "@/inngest/channels/google-sheets";
import { inngest } from "@/inngest/client";

export async function fetchGoogleSheetsRealtimeToken() {
  return getClientSubscriptionToken(inngest, {
    channel: googleSheetsChannel,
    topics: ["status"],
  });
}
