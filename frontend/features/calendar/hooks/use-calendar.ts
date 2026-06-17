import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useCalendarParams } from "./use-calendar-params";

/** Fetch the paginated calendar event list (suspense). */
export const useSuspenseCalendarEvents = () => {
  const trpc = useTRPC();
  const [params] = useCalendarParams();
  return useSuspenseQuery(trpc.calendar.getMany.queryOptions(params));
};

/** Fetch all upcoming events (non-suspense) — used by the event trigger picker. */
export const useCalendarEventOptions = () => {
  const trpc = useTRPC();
  return useQuery(
    trpc.calendar.getMany.queryOptions({ filter: "all", pageSize: 100 }),
  );
};

/** Fetch a single event (suspense). */
export const useSuspenseCalendarEvent = (id: string) => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.calendar.getOne.queryOptions({ id }));
};

export const useCreateCalendarEvent = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.calendar.create.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Event "${data.title}" created`);
        queryClient.invalidateQueries(trpc.calendar.getMany.queryOptions({}));
      },
      onError: (error) => {
        toast.error(`Failed to create event: ${error.message}`);
      },
    }),
  );
};

export const useUpdateCalendarEvent = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.calendar.update.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Event "${data.title}" saved`);
        queryClient.invalidateQueries(trpc.calendar.getMany.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.calendar.getOne.queryOptions({ id: data.id }),
        );
      },
      onError: (error) => {
        toast.error(`Failed to save event: ${error.message}`);
      },
    }),
  );
};

export const useRemoveCalendarEvent = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.calendar.remove.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Event "${data.title}" removed`);
        queryClient.invalidateQueries(trpc.calendar.getMany.queryOptions({}));
      },
      onError: (error) => {
        toast.error(`Failed to remove event: ${error.message}`);
      },
    }),
  );
};
