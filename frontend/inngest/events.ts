import { eventType, staticSchema } from "inngest";

export type ExecuteWorkflowEventData = {
  workflowId: string;
  initialData?: Record<string, unknown>;
};

const executeWorkflowEventDataSchema =
  staticSchema<ExecuteWorkflowEventData>();

export const executeWorkflowEvent = eventType("workflows/execute.workflow", {
  schema: executeWorkflowEventDataSchema,
});
