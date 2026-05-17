import { realtime } from "inngest";
import { z } from "zod";

export const nodeStatusSchema = z.object({
  nodeId: z.string(),
  status: z.enum(["loading", "success", "error"]),
});

export type NodeStatusPayload = z.infer<typeof nodeStatusSchema>;
