import { InitialNode } from "@/components/initial-node";
import { HttpRequestNode } from "@/features/execution/components/http-request/node";
import { GoogleFormTrigger } from "@/features/triggers/components/google-form-trigger/node";
import { ManualTriggerNode } from "@/features/triggers/components/manual-trigger/node";
import { StripeTriggerNode } from "@/features/triggers/components/stripe-trigger/node";
import { ScheduleTriggerNode } from "@/features/triggers/components/schedule-trigger/node";
import { GeminiNode } from "@/features/execution/components/gemini/node";
import { OpenAiNode } from "@/features/execution/components/openai/node";
import { AnthropicNode } from "@/features/execution/components/anthropic/node";
import { NodeType } from "@/generated/prisma/enums";
import type { NodeTypes } from "@xyflow/react";
import { DiscordNode } from "@/features/execution/components/discord/node";
import { SlackNode } from "@/features/execution/components/slack/node";
import { LoopNode } from "@/features/execution/components/loop/node";

export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
  [NodeType.HTTP_REQUEST]: HttpRequestNode,
  [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
  [NodeType.GOOGLE_FORM_TRIGGER]: GoogleFormTrigger,
  [NodeType.STRIPE_TRIGGER]: StripeTriggerNode,
  [NodeType.SCHEDULE_TRIGGER]: ScheduleTriggerNode,
  [NodeType.GEMINI]: GeminiNode,
  [NodeType.OPENAI]: OpenAiNode,
  [NodeType.ANTHROPIC]: AnthropicNode,
  [NodeType.DISCORD]: DiscordNode,
  [NodeType.SLACK]: SlackNode,
  [NodeType.LOOP]: LoopNode,

} as const satisfies NodeTypes

export type RegisteredNodeType = keyof typeof nodeComponents