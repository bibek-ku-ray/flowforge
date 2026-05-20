import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { topologicalSort } from "./utils";
import type { Prisma } from "@/generated/prisma/client";
import { ExecutionStatus, NodeType } from "@/generated/prisma/enums";
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
import { discordChannel } from "./channels/discord";
import { slackChannel } from "./channels/slack";
import {
  executeWorkflowEvent,
  type ExecuteWorkflowEventData,
} from "./events";


const workflowRealtimeChannels = [
  httpRequestChannel,
  manualTriggerChannel,
  googleFormTriggerChannel,
  stripeTriggerChannel,
  geminiChannel,
  openAiChannel,
  anthropicChannel,
  discordChannel,
  slackChannel
] as const;

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    retries: 0,
    onFailure: async ({ event }) => {
      return prisma.execution.update({
        where: { inngestEventId: event.data.event.id },
        data: {
          status: ExecutionStatus.FAILED,
          error: event.data.error.message,
          errorStack: event.data.error.stack,
        },
      });
    },
    triggers: [{ event: executeWorkflowEvent }],
  },
  async ({ event, step }) => {
    const publish = inngest.realtime.publish.bind(inngest.realtime);
    void workflowRealtimeChannels;

    const { workflowId, initialData } =
      event.data as ExecuteWorkflowEventData;
      const inngestEventId = event.id;

      if (!inngestEventId || !workflowId) {
        throw new NonRetriableError("Event ID or workflow ID is missing");
      }

      await step.run("create-execution", async () => {
        return prisma.execution.create({
            data: {
              workflowId,
              inngestEventId,
            },
          });
        });
    

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

    let context = initialData ?? {};

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

      await step.run("update-execution", async () => {
        return prisma.execution.update({
          where: { inngestEventId, workflowId },
          data: {
            status: ExecutionStatus.SUCCESS,
            completedAt: new Date(),
            output: context as Prisma.InputJsonValue,
          },
        })
      });
  

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
