"use client";

import { useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { TriggerKind } from "@/generated/prisma/enums";
import {
  useSuspenseTriggerSettings,
  useUpdateTriggerSettings,
} from "@/features/admin/hooks/use-trigger-settings";

const TRIGGER_LABELS: Record<TriggerKind, { title: string; description: string }> = {
  [TriggerKind.MANUAL]: {
    title: "Manual trigger",
    description: "Editor test runs and explicit workflow execution.",
  },
  [TriggerKind.GOOGLE_FORM]: {
    title: "Google Form trigger",
    description: "Inbound submissions via the Google Form webhook.",
  },
  [TriggerKind.STRIPE]: {
    title: "Stripe trigger",
    description: "Payment events received through the Stripe webhook.",
  },
  [TriggerKind.SCHEDULE]: {
    title: "Schedule trigger",
    description: "Workflows triggered by cron schedules and intervals.",
  },
};

export function AdminTriggersPanel() {
  const { data: settings } = useSuspenseTriggerSettings();
  const updateSettings = useUpdateTriggerSettings();
  const [draft, setDraft] = useState<Record<TriggerKind, boolean>>(() =>
    Object.fromEntries(settings.map((row) => [row.kind, row.enabled])) as Record<
      TriggerKind,
      boolean
    >,
  );

  const isDirty = useMemo(() => {
    return settings.some((row) => draft[row.kind] !== row.enabled);
  }, [draft, settings]);

  return (
    <div className="flex flex-col gap-4">
      {settings.map((row) => {
        const meta = TRIGGER_LABELS[row.kind];

        return (
          <div
            key={row.kind}
            className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-col gap-1">
              <p className="font-medium text-zinc-900">{meta.title}</p>
              <p className="text-sm text-zinc-600">{meta.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {draft[row.kind] ? "Enabled" : "Disabled"}
              </span>
              <Switch
                checked={draft[row.kind]}
                onCheckedChange={(enabled) =>
                  setDraft((current) => ({ ...current, [row.kind]: enabled }))
                }
              />
            </div>
          </div>
        );
      })}

      <div className="flex justify-end">
        <Button
          disabled={!isDirty || updateSettings.isPending}
          onClick={() =>
            updateSettings.mutate(
              {
                settings: settings.map((row) => ({
                  kind: row.kind,
                  enabled: draft[row.kind],
                })),
              },
              {
                onSuccess: (updated) => {
                  setDraft(
                    Object.fromEntries(
                      updated.map((row) => [row.kind, row.enabled]),
                    ) as Record<TriggerKind, boolean>,
                  );
                },
              },
            )
          }
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
