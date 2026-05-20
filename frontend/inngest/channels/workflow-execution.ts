import { realtime } from "inngest";
import { z } from "zod";

export const workflowExecutionEventSchema = z.object({
  workflowId: z.string(),
  nodeId: z.string().optional(),
  nodeType: z.string().optional(),
  status: z.enum(["loading", "success", "error"]).optional(),
  phase: z.enum([
    "execution.started",
    "execution.completed",
    "node.started",
    "node.completed",
    "node.failed",
  ]),
});

export type WorkflowExecutionEvent = z.infer<typeof workflowExecutionEventSchema>;

type WorkflowChannelParams = { workflowId: string };

export const workflowExecutionChannel = realtime.channel({
  name: ({ workflowId }: WorkflowChannelParams) =>
    `workflow-execution:${workflowId}`,
  topics: {
    status: { schema: workflowExecutionEventSchema },
  },
});

export function getWorkflowExecutionChannel(workflowId: string) {
  return workflowExecutionChannel({ workflowId });
}
