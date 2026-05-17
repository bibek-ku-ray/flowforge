import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { topologicalSort } from "./utils";
import { getExecutor } from "@/features/execution/libs/executor-registry";
import { NodeType } from "@/generated/prisma/client";

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    retries: 0,
    triggers: [{ event: "workflows/execute.workflow" }],
  },
  async ({ event, step }) => {
    const publish = inngest.realtime.publish.bind(inngest.realtime);

    const workflowId = event.data.workflowId;

    if (!workflowId) {
      throw new NonRetriableError("Workflow ID is missing");
    }

    const { sortedNodes, userId } = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          nodes: true,
          connections: true,
        },
      });

      if (!workflow) {
        throw new NonRetriableError("Workflow not found");
      }

      return {
        sortedNodes: topologicalSort(workflow.nodes, workflow.connections),
        userId: workflow.userId,
      };
    });

    let context = (event.data.initialData as Record<string, unknown>) || {};

    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType);
      context = await executor({
        data: node.data as Record<string, unknown>,
        nodeId: node.id,
        userId,
        context,
        step,
        publish,
      });
    }

    return { sortedNodes };
  },
);
