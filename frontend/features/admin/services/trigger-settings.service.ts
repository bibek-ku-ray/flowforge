import "server-only";

import type { TriggerKind } from "@/generated/prisma/enums";
import { logger } from "@/lib/logger";
import { triggerSettingsRepository } from "@/features/admin/repositories/trigger-settings.repository";
import type { TriggerSettingDto } from "@/features/admin/types";
import type { adminUpdateTriggersInputSchema } from "@/features/admin/validation/schemas";
import type z from "zod";

type UpdateInput = z.infer<typeof adminUpdateTriggersInputSchema>;

export const triggerSettingsService = {
  async getSettings(): Promise<TriggerSettingDto[]> {
    return triggerSettingsRepository.findAll();
  },

  async updateSettings(
    actorId: string,
    input: UpdateInput,
  ): Promise<TriggerSettingDto[]> {
    const updated: TriggerSettingDto[] = [];

    for (const setting of input.settings) {
      const row = await triggerSettingsRepository.upsert(
        setting.kind as TriggerKind,
        setting.enabled,
      );
      updated.push(row);
    }

    logger.info("admin.triggers.updated", {
      actorId,
      settings: input.settings,
    });

    return updated;
  },
};
