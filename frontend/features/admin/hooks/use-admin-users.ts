"use client";

import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminUsersParams } from "./use-admin-users-params";

export const useSuspenseAdminUsers = () => {
  const trpc = useTRPC();
  const [params] = useAdminUsersParams();

  return useSuspenseQuery(trpc.admin.users.list.queryOptions(params));
};

export const useSetUserRole = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [params] = useAdminUsersParams();

  return useMutation(
    trpc.admin.users.setRole.mutationOptions({
      onSuccess: () => {
        toast.success("User role updated");
        queryClient.invalidateQueries(
          trpc.admin.users.list.queryOptions(params),
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );
};

export const useDeleteAdminUser = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [params] = useAdminUsersParams();

  return useMutation(
    trpc.admin.users.delete.mutationOptions({
      onSuccess: () => {
        toast.success("User deleted");
        queryClient.invalidateQueries(
          trpc.admin.users.list.queryOptions(params),
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );
};
