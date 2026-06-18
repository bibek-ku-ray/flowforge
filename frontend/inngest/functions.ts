import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { topologicalSort } from "./utils";
import { executeGraph } from "./execute-graph";
import type { Prisma } from "@/generated/prisma/client";
import { ExecutionStatus, NodeType } from "@/generated/prisma/enums";
import { assertWorkflowTriggersEnabled } from "@/lib/triggers/enforcement";
import { getExecutor } from "@/features/execution/libs/executor-registry";
import { publishNodeStatus } from "@/features/execution/lib/publish-execution-event";
import { httpRequestChannel } from "./channels/http-request";
import { manualTriggerChannel } from "./channels/manual-trigger";
import { googleFormTriggerChannel } from "./channels/google-form-trigger";
import { stripeTriggerChannel } from "./channels/stripe-trigger";
import { scheduleTriggerChannel } from "./channels/schedule-trigger";
import { eventTriggerChannel } from "./channels/event-trigger";
import { emailChannel } from "./channels/email";
import { googleSheetsChannel } from "./channels/google-sheets";
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
import { runScan } from "@/features/triggers/components/schedule-trigger/scheduler.service";
import { runReminderScan } from "@/features/triggers/components/event-trigger/reminder.service";


const workflowRealtimeChannels = [
  httpRequestChannel,
  manualTriggerChannel,
  googleFormTriggerChannel,
  stripeTriggerChannel,
  scheduleTriggerChannel,
  eventTriggerChannel,
  emailChannel,
  googleSheetsChannel,
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
    

    const { sortedNodes, connections, userId } = await step.run(
      "prepare-workflow",
      async () => {
        const workflow = await prisma.workflow.findUniqueOrThrow({
          where: { id: workflowId },
          include: {
            nodes: true,
            connections: true,
          },
        });

        await assertWorkflowTriggersEnabled(
          workflow.nodes.map((node) => node.type as NodeType),
        );

        return {
          sortedNodes: topologicalSort(workflow.nodes, workflow.connections),
          connections: workflow.connections,
          userId: workflow.userId,
        };
      },
    );

    await publishExecutionStarted(publish, workflowId);

    const initialContext = initialData ?? {};

    try {
      const context = await executeGraph(
        sortedNodes,
        connections,
        initialContext,
        (node, nodeContext, iterationKey) => {
          const executor = getExecutor(node.type as NodeType);
          return executor({
            data: node.data as Record<string, unknown>,
            nodeId: node.id,
            nodeType: node.type,
            workflowId,
            userId,
            context: nodeContext,
            step,
            publish,
            iterationKey,
          });
        },
        {
          onLoopStart: (node) =>
            publishNodeStatus(publish, workflowId, node.id, node.type, "loading"),
          onLoopSuccess: (node) =>
            publishNodeStatus(publish, workflowId, node.id, node.type, "success"),
          onLoopError: (node) =>
            publishNodeStatus(publish, workflowId, node.id, node.type, "error"),
        },
      );

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

export const schedulerScan = inngest.createFunction(
  { id: "scheduler-scan", triggers: [{ cron: "* * * * *" }] },
  async () => {
    const now = new Date();
    // Reuse the single cron tick for both recurring schedules and event
    // reminders — one scheduler, two scan passes. Each pass is self-contained
    // and isolates its own errors, so a failure in one cannot abort the other.
    const [scheduleResult, reminderResult] = await Promise.allSettled([
      runScan(now),
      runReminderScan(now),
    ]);
    return {
      ok: true,
      schedules: scheduleResult.status,
      reminders: reminderResult.status,
    };
  },
);
