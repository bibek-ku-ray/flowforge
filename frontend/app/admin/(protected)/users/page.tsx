import { Suspense } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminUsersTable } from "@/features/admin/components/users-table";
import { adminUsersParamsLoader } from "@/features/admin/server/params-loader";
import { prefetchAdminUsers } from "@/features/admin/server/prefetch";
import { HydrateClient } from "@/trpc/server";
import { Spinner } from "@/components/ui/spinner";
import type { SearchParams } from "nuqs/server";

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await adminUsersParamsLoader(searchParams);
  await prefetchAdminUsers(params);

  return (
    <AdminShell
      title="Users"
      description="Search accounts, adjust roles, and remove users with guardrails for the last administrator."
    >
      <HydrateClient>
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Spinner className="size-6" />
            </div>
          }
        >
          <AdminUsersTable />
        </Suspense>
      </HydrateClient>
    </AdminShell>
  );
}
