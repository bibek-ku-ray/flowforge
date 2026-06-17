import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { CalendarEventView } from "@/features/calendar/components/calendar-form";
import {
  CalendarError,
  CalendarLoading,
} from "@/features/calendar/components/calendar-list";
import { prefetchCalendarEvent } from "@/features/calendar/server/prefetch";

interface PageProp {
  params: Promise<{ id: string }>;
}

const Page = async ({ params }: PageProp) => {
  await requireAuth();

  const { id } = await params;
  prefetchCalendarEvent(id);

  return (
    <div className="p-4 md:px-10 md:py-6 h-full">
      <div className="mx-auto max-w-3xl w-full flex flex-col gap-y-8 h-full">
        <HydrateClient>
          <ErrorBoundary fallback={<CalendarError />}>
            <Suspense fallback={<CalendarLoading />}>
              <CalendarEventView eventId={id} />
            </Suspense>
          </ErrorBoundary>
        </HydrateClient>
      </div>
    </div>
  );
};

export default Page;
