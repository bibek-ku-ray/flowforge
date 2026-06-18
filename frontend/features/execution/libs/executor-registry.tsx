import { NodeType } from "@/generated/prisma/client";
import { NodeExecutor } from "../types";
import { googleFormTriggerExecutor } from "@/features/triggers/components/google-form-trigger/executor";
import { manualTriggerExecutor } from "@/features/triggers/components/manual-trigger/executor";
import { httpRequestExecutor } from "../components/http-request/executor";
import { stripeTriggerExecutor } from "@/features/triggers/components/stripe-trigger/executor";
import { scheduleTriggerExecutor } from "@/features/triggers/components/schedule-trigger/executor";
import { eventTriggerExecutor } from "@/features/triggers/components/event-trigger/executor";
import { emailExecutor } from "../components/email/executor";
import { googleSheetsExecutor } from "../components/google-sheets/executor";
import { geminiExecutor } from "../components/gemini/executor";
import { openAiExecutor } from "../components/openai/executor";
import { anthropicExecutor } from "../components/anthropic/executor";
import { discordExecutor } from "../components/discord/executor";
import { slackExecutor } from "../components/slack/executor";
import { loopExecutor } from "../components/loop/executor";

export const executorRegistry: Record<NodeType, NodeExecutor> = {
  [NodeType.INITIAL]: manualTriggerExecutor,
  [NodeType.MANUAL_TRIGGER]: manualTriggerExecutor,
  [NodeType.GOOGLE_FORM_TRIGGER]: googleFormTriggerExecutor,
  [NodeType.STRIPE_TRIGGER]: stripeTriggerExecutor,
  [NodeType.SCHEDULE_TRIGGER]: scheduleTriggerExecutor,
  [NodeType.EVENT_TRIGGER]: eventTriggerExecutor,
  [NodeType.EMAIL]: emailExecutor,
  [NodeType.GOOGLE_SHEETS]: googleSheetsExecutor,
  [NodeType.HTTP_REQUEST]: httpRequestExecutor,
  [NodeType.GEMINI]: geminiExecutor,
  [NodeType.ANTHROPIC]: anthropicExecutor,
  [NodeType.OPENAI]: openAiExecutor,
  [NodeType.DISCORD]: discordExecutor,
  [NodeType.SLACK]: slackExecutor,
  // LOOP is orchestrated by the execution engine; this entry only satisfies the
  // exhaustive Record<NodeType, NodeExecutor> type and must never be invoked.
  [NodeType.LOOP]: loopExecutor,
};

export const getExecutor = (type: NodeType): NodeExecutor => {
  const executor = executorRegistry[type];
  if (!executor) {
    throw new Error(`No executor found for node type: ${type}`);
  }

  return executor;
};