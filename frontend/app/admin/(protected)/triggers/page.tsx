import { Suspense } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminTriggersPanel } from "@/features/admin/components/triggers-panel";
import { prefetchTriggerSettings } from "@/features/admin/server/prefetch";
import { HydrateClient } from "@/trpc/server";
import { Spinner } from "@/components/ui/spinner";

export default async function AdminTriggersPage() {
  await prefetchTriggerSettings();

  return (
    <AdminShell
      title="Triggers"
      description="Disable trigger entry points platform-wide. Enforcement applies to webhooks, manual runs, and workflow execution."
    >
      <HydrateClient>
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Spinner className="size-6" />
            </div>
          }
        >
          <AdminTriggersPanel />
        </Suspense>
      </HydrateClient>
    </AdminShell>
  );
}
