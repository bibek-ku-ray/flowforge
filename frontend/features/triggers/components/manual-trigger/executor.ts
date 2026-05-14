import { NodeExecutor } from "@/features/execution/types";

type ManualTriggerData = Record<string, unknown>;

export const manualTriggerExecutor: NodeExecutor<ManualTriggerData> = async ({
  nodeId,
  context,
  step,
  // publish,
}) => {
  const result = await step.run("manual-trigger", async () => context);

  return result;
};
