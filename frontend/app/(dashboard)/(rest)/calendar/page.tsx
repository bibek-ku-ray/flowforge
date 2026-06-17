import {
  CalendarContainer,
  CalendarError,
  CalendarList,
  CalendarLoading,
} from "@/features/calendar/components/calendar-list";
import { calendarParamsLoader } from "@/features/calendar/server/params-loader";
import { prefetchCalendarEvents } from "@/features/calendar/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { SearchParams } from "nuqs";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

type Props = {
  searchParams: Promise<SearchParams>;
};

const Page = async ({ searchParams }: Props) => {
  await requireAuth();

  const params = await calendarParamsLoader(searchParams);
  prefetchCalendarEvents(params);

  return (
    <CalendarContainer>
      <HydrateClient>
        <ErrorBoundary fallback={<CalendarError />}>
          <Suspense fallback={<CalendarLoading />}>
            <CalendarList />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </CalendarContainer>
  );
};

export default Page;
