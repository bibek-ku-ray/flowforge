"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRole } from "@/generated/prisma/enums";
import type { AdminUserDto } from "@/features/admin/types";
import {
  useDeleteAdminUser,
  useSetUserRole,
} from "@/features/admin/hooks/use-admin-users";
import { MoreVerticalIcon } from "lucide-react";

export function AdminUserActions({ user }: { user: AdminUserDto }) {
  const setRole = useSetUserRole();
  const deleteUser = useDeleteAdminUser();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const nextRole =
    user.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreVerticalIcon className="size-4" />
            <span className="sr-only">Open user actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={setRole.isPending}
            onClick={() =>
              setRole.mutate({ userId: user.id, role: nextRole })
            }
          >
            Set role to {nextRole}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmDelete(true)}
          >
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {user.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the user, their sessions, workflows,
              credentials, and execution history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteUser.isPending}
              onClick={() => {
                deleteUser.mutate(
                  { userId: user.id },
                  { onSuccess: () => setConfirmDelete(false) },
                );
              }}
            >
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
