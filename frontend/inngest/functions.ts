import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { topologicalSort } from "./utils";
import { NodeType } from "@/generated/prisma/client";
import { getExecutor } from "@/features/execution/libs/executor-registry";
import { httpRequestChannel } from "./channels/http-request";
import { manualTriggerChannel } from "./channels/manual-trigger";
import { googleFormTriggerChannel } from "./channels/google-form-trigger";
import { stripeTriggerChannel } from "./channels/stripe-trigger";
import { geminiChannel } from "./channels/gemini";
import { openAiChannel } from "./channels/openai";
import { anthropicChannel } from "./channels/anthropic";
import {
  publishExecutionCompleted,
  publishExecutionStarted,
} from "@/features/execution/lib/publish-execution-event";

const workflowRealtimeChannels = [
  httpRequestChannel,
  manualTriggerChannel,
  googleFormTriggerChannel,
  stripeTriggerChannel,
  geminiChannel,
  openAiChannel,
  anthropicChannel,
] as const;

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    retries: 0,
    triggers: [{ event: "workflows/execute.workflow" }],
  },
  async ({ event, step }) => {
    const publish = inngest.realtime.publish.bind(inngest.realtime);
    void workflowRealtimeChannels;

    const workflowId = event.data.workflowId;

    if (!workflowId) {
      throw new NonRetriableError("Workflow ID is missing");
    }

    const { sortedNodes, userId } = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: {
          nodes: true,
          connections: true,
        },
      });

      return {
        sortedNodes: topologicalSort(workflow.nodes, workflow.connections),
        userId: workflow.userId,
      };
    });

    await publishExecutionStarted(publish, workflowId);

    let context = (event.data.initialData as Record<string, unknown>) || {};

    try {
      for (const node of sortedNodes) {
        const executor = getExecutor(node.type as NodeType);
        context = await executor({
          data: node.data as Record<string, unknown>,
          nodeId: node.id,
          nodeType: node.type,
          workflowId,
          userId,
          context,
          step,
          publish,
        });
      }

      await publishExecutionCompleted(publish, workflowId, true);

      return {
        workflowId,
        result: context,
      };
    } catch (error) {
      await publishExecutionCompleted(publish, workflowId, false);
      throw error;
    }
  },
);
