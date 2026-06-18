"use client";

import { format, formatDistanceToNow } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  EmptyView,
  EntityContainer,
  EntityHeader,
  EntityItem,
  EntityList,
  EntityPagination,
  EntitySearch,
  ErrorView,
  LoadingView,
} from "@/components/entity-components";
import { Button } from "@/components/ui/button";
import { useEntitySearch } from "@/hooks/use-entity-search";
import { useCalendarParams } from "@/features/calendar/hooks/use-calendar-params";
import {
  useRemoveCalendarEvent,
  useSuspenseCalendarEvents,
} from "@/features/calendar/hooks/use-calendar";
import type { CalendarEvent } from "@/generated/prisma/client";

const FILTERS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "all", label: "All" },
] as const;

export const CalendarSearch = () => {
  const [params, setParams] = useCalendarParams();
  const { searchValue, onSearchChange } = useEntitySearch({ params, setParams });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <EntitySearch
        value={searchValue}
        onChange={onSearchChange}
        placeholder="Search events"
      />
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={params.filter === f.value ? "default" : "outline"}
            onClick={() => setParams({ ...params, filter: f.value, page: 1 })}
          >
            {f.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export const CalendarHeader = () => (
  <EntityHeader
    title="Calendar"
    description="Create events that trigger your workflows"
    newButtonHref="/calendar/new"
    newButtonLabel="New event"
  />
);

export const CalendarPagination = () => {
  const events = useSuspenseCalendarEvents();
  const [params, setParams] = useCalendarParams();

  return (
    <EntityPagination
      disabled={events.isFetching}
      totalPages={events.data.totalPages}
      page={events.data.page}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const CalendarContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <EntityContainer
    header={<CalendarHeader />}
    search={<CalendarSearch />}
    pagination={<CalendarPagination />}
  >
    {children}
  </EntityContainer>
);

export const CalendarLoading = () => <LoadingView message="Loading events..." />;
export const CalendarError = () => <ErrorView message="Error loading events" />;
export const CalendarEmpty = () => (
  <EmptyView message="No events yet. Create your first event to start reminding." />
);

const CalendarItem = ({ data }: { data: CalendarEvent }) => {
  const removeEvent = useRemoveCalendarEvent();

  const when = data.allDay
    ? format(new Date(data.startAt), "PPP")
    : format(new Date(data.startAt), "PPP p");

  return (
    <EntityItem
      href={`/calendar/${data.id}`}
      title={data.title}
      subtitle={
        <>
          {when} &bull;{" "}
          {formatDistanceToNow(new Date(data.startAt), { addSuffix: true })}
        </>
      }
      image={
        <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
          <CalendarIcon className="text-primary size-5" />
        </div>
      }
      onRemove={() => removeEvent.mutate({ id: data.id })}
      isRemoving={removeEvent.isPending}
    />
  );
};

export const CalendarList = () => {
  const events = useSuspenseCalendarEvents();

  return (
    <EntityList
      items={events.data.items}
      getKey={(event) => event.id}
      renderItem={(event) => <CalendarItem data={event} />}
      emptyView={<CalendarEmpty />}
    />
  );
};
