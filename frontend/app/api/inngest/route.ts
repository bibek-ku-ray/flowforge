import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { helloworldTask, processTask } from "@/inngest/functions";


export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processTask, helloworldTask],
});