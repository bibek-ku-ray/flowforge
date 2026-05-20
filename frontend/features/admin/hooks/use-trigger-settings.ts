"use client";

import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";

export const useSuspenseTriggerSettings = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.admin.triggers.list.queryOptions());
};

export const useUpdateTriggerSettings = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.admin.triggers.update.mutationOptions({
      onSuccess: () => {
        toast.success("Trigger settings saved");
        queryClient.invalidateQueries(trpc.admin.triggers.list.queryOptions());
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );
};
