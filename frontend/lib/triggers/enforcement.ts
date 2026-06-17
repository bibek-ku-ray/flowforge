import "server-only";

import { NodeType, TriggerKind } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const TRIGGER_KINDS = [
  TriggerKind.MANUAL,
  TriggerKind.GOOGLE_FORM,
  TriggerKind.STRIPE,
  TriggerKind.SCHEDULE,
] as const;

export const NODE_TYPE_TO_TRIGGER_KIND: Partial<
  Record<NodeType, TriggerKind>
> = {
  [NodeType.MANUAL_TRIGGER]: TriggerKind.MANUAL,
  [NodeType.GOOGLE_FORM_TRIGGER]: TriggerKind.GOOGLE_FORM,
  [NodeType.STRIPE_TRIGGER]: TriggerKind.STRIPE,
  [NodeType.SCHEDULE_TRIGGER]: TriggerKind.SCHEDULE,
};

export class TriggerDisabledError extends Error {
  readonly triggerKind: TriggerKind;

  constructor(triggerKind: TriggerKind) {
    super(`Trigger ${triggerKind} is disabled globally`);
    this.name = "TriggerDisabledError";
    this.triggerKind = triggerKind;
  }
}

export async function getTriggerSettingsMap(): Promise<
  Record<TriggerKind, boolean>
> {
  const rows = await prisma.triggerSetting.findMany();
  const map = Object.fromEntries(
    TRIGGER_KINDS.map((kind) => [kind, true]),
  ) as Record<TriggerKind, boolean>;

  for (const row of rows) {
    map[row.kind] = row.enabled;
  }

  return map;
}

export async function isTriggerEnabled(kind: TriggerKind): Promise<boolean> {
  const settings = await getTriggerSettingsMap();
  return settings[kind] ?? true;
}

export async function assertTriggerEnabled(kind: TriggerKind): Promise<void> {
  const enabled = await isTriggerEnabled(kind);

  if (!enabled) {
    logger.warn("trigger.execution.blocked", { triggerKind: kind });
    throw new TriggerDisabledError(kind);
  }
}

export async function assertWorkflowTriggersEnabled(
  nodeTypes: NodeType[],
): Promise<void> {
  const triggerKinds = new Set<TriggerKind>();

  for (const nodeType of nodeTypes) {
    const kind = NODE_TYPE_TO_TRIGGER_KIND[nodeType];
    if (kind) {
      triggerKinds.add(kind);
    }
  }

  for (const kind of triggerKinds) {
    await assertTriggerEnabled(kind);
  }
}
