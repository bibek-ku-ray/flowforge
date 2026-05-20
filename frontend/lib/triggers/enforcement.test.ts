import { describe, expect, it, vi, beforeEach } from "vitest";
import { TriggerKind } from "@/generated/prisma/enums";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    triggerSetting: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  assertTriggerEnabled,
  TriggerDisabledError,
} from "@/lib/triggers/enforcement";

describe("trigger enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows enabled triggers", async () => {
    vi.mocked(prisma.triggerSetting.findMany).mockResolvedValue([
      {
        kind: TriggerKind.MANUAL,
        enabled: true,
        updatedAt: new Date(),
      },
      {
        kind: TriggerKind.GOOGLE_FORM,
        enabled: true,
        updatedAt: new Date(),
      },
      {
        kind: TriggerKind.STRIPE,
        enabled: true,
        updatedAt: new Date(),
      },
    ]);

    await expect(assertTriggerEnabled(TriggerKind.MANUAL)).resolves.toBeUndefined();
  });

  it("blocks disabled triggers", async () => {
    vi.mocked(prisma.triggerSetting.findMany).mockResolvedValue([
      {
        kind: TriggerKind.MANUAL,
        enabled: false,
        updatedAt: new Date(),
      },
      {
        kind: TriggerKind.GOOGLE_FORM,
        enabled: true,
        updatedAt: new Date(),
      },
      {
        kind: TriggerKind.STRIPE,
        enabled: true,
        updatedAt: new Date(),
      },
    ]);

    await expect(assertTriggerEnabled(TriggerKind.MANUAL)).rejects.toBeInstanceOf(
      TriggerDisabledError,
    );
  });
});
