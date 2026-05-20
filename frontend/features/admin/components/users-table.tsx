"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRole } from "@/generated/prisma/enums";
import { useSuspenseAdminUsers } from "@/features/admin/hooks/use-admin-users";
import { useAdminUsersParams } from "@/features/admin/hooks/use-admin-users-params";
import { AdminUserActions } from "./user-actions";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function AdminUsersTable() {
  const { data } = useSuspenseAdminUsers();
  const [params, setParams] = useAdminUsersParams();

  return (
    <div className="flex flex-col gap-6">
      <Input
        value={params.search}
        onChange={(event) =>
          setParams({ search: event.target.value, page: 1 })
        }
        placeholder="Search by email or name"
        className="max-w-md bg-white"
      />

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-zinc-500">
                  No users match your search.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-zinc-900">
                        {user.name || "Unnamed user"}
                      </span>
                      <span className="text-xs text-zinc-500">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === UserRole.ADMIN ? "default" : "secondary"
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <AdminUserActions user={user} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (data.hasPreviousPage) {
                    setParams({ page: Math.max(1, params.page - 1) });
                  }
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                {data.page} / {data.totalPages}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (data.hasNextPage) {
                    setParams({ page: params.page + 1 });
                  }
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

      <p className="text-xs text-zinc-500">
        {data.totalCount} user{data.totalCount === 1 ? "" : "s"} total
      </p>
    </div>
  );
}
