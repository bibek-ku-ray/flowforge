import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { executeWorkflow, schedulerScan } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [executeWorkflow, schedulerScan],
});