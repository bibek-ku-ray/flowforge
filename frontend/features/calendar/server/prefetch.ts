import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.calendar.getMany>;

/** Prefetch the paginated calendar event list. */
export const prefetchCalendarEvents = (params: Input) => {
  return prefetch(trpc.calendar.getMany.queryOptions(params));
};

/** Prefetch a single calendar event. */
export const prefetchCalendarEvent = (id: string) => {
  return prefetch(trpc.calendar.getOne.queryOptions({ id }));
};
