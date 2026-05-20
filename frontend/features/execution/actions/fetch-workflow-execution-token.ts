"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { getWorkflowExecutionChannel } from "@/inngest/channels/workflow-execution";
import { inngest } from "@/inngest/client";

export async function fetchWorkflowExecutionToken(workflowId: string) {
  return getClientSubscriptionToken(inngest, {
    channel: getWorkflowExecutionChannel(workflowId),
    topics: ["status"],
  });
}
