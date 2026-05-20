import "server-only";

import type { TriggerKind } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { TriggerSettingDto } from "@/features/admin/types";
import { TRIGGER_KINDS } from "@/lib/triggers/enforcement";

export const triggerSettingsRepository = {
  async findAll(): Promise<TriggerSettingDto[]> {
    const rows = await prisma.triggerSetting.findMany({
      orderBy: { kind: "asc" },
    });

    const byKind = new Map(rows.map((row) => [row.kind, row]));

    return TRIGGER_KINDS.map((kind) => {
      const existing = byKind.get(kind);
      return {
        kind,
        enabled: existing?.enabled ?? true,
        updatedAt: existing?.updatedAt ?? new Date(0),
      };
    });
  },

  async upsert(
    kind: TriggerKind,
    enabled: boolean,
  ): Promise<TriggerSettingDto> {
    const row = await prisma.triggerSetting.upsert({
      where: { kind },
      create: { kind, enabled },
      update: { enabled },
    });

    return {
      kind: row.kind,
      enabled: row.enabled,
      updatedAt: row.updatedAt,
    };
  },
};
