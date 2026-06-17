"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReminderDirection, ReminderUnit } from "@/generated/prisma/enums";
import { useCalendarEventOptions } from "@/features/calendar/hooks/use-calendar";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
}

type EventTriggerStatus = {
  eventId: string;
  offsetValue: number;
  offsetUnit: ReminderUnit;
  direction: ReminderDirection;
  fireAt: Date | string | null;
  triggeredAt: Date | string | null;
} | null;

const UNIT_LABELS: Record<ReminderUnit, string> = {
  [ReminderUnit.MINUTES]: "Minutes",
  [ReminderUnit.HOURS]: "Hours",
  [ReminderUnit.DAYS]: "Days",
};

const DIRECTION_LABELS: Record<ReminderDirection, string> = {
  [ReminderDirection.BEFORE]: "Before",
  [ReminderDirection.AFTER]: "After",
};

const formatRunTime = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "PPpp");
};

export const EventTriggerDialog = ({ open, onOpenChange, nodeId }: Props) => {
  const trpc = useTRPC();
  const statusQueryOptions = trpc.workflows.getEventTriggerStatus.queryOptions({
    nodeId,
  });
  const { data: status, isFetched } = useQuery({
    ...statusQueryOptions,
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Event Reminder Configuration</DialogTitle>
          <DialogDescription>
            Fire this workflow relative to a calendar event.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <EventTriggerForm
            key={isFetched ? "ready" : "loading"}
            nodeId={nodeId}
            status={(status as EventTriggerStatus) ?? null}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const EventTriggerForm = ({
  nodeId,
  status,
}: {
  nodeId: string;
  status: EventTriggerStatus;
}) => {
  const params = useParams();
  const workflowId = params.workflowId as string;
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const events = useCalendarEventOptions();

  const [eventId, setEventId] = useState(status?.eventId ?? "");
  const [offsetValue, setOffsetValue] = useState(
    String(status?.offsetValue ?? 1),
  );
  const [offsetUnit, setOffsetUnit] = useState<ReminderUnit>(
    status?.offsetUnit ?? ReminderUnit.DAYS,
  );
  const [direction, setDirection] = useState<ReminderDirection>(
    status?.direction ?? ReminderDirection.BEFORE,
  );

  const numericOffset = Number(offsetValue);
  const canSave =
    eventId.length > 0 &&
    Number.isInteger(numericOffset) &&
    numericOffset >= 0;

  const save = useMutation(
    trpc.workflows.updateEventTrigger.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(
            trpc.workflows.getOne.queryOptions({ id: workflowId }),
          ),
          queryClient.invalidateQueries(
            trpc.workflows.getEventTriggerStatus.queryOptions({ nodeId }),
          ),
        ]);
        toast.success("Reminder saved — this workflow will run automatically");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save reminder");
      },
    }),
  );

  const handleSave = () => {
    save.mutate({
      workflowId,
      nodeId,
      eventId,
      offsetValue: numericOffset,
      offsetUnit,
      direction,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="event-select">Event</Label>
        <Select value={eventId} onValueChange={setEventId}>
          <SelectTrigger id="event-select" className="w-full">
            <SelectValue placeholder="Select an event" />
          </SelectTrigger>
          <SelectContent>
            {(events.data?.items ?? []).map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.title} — {format(new Date(event.startAt), "PP")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {events.data && events.data.items.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No events yet. Create one in the Calendar first.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-2">
          <Label htmlFor="offset-value">Offset</Label>
          <Input
            id="offset-value"
            type="number"
            min={0}
            value={offsetValue}
            onChange={(e) => setOffsetValue(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="offset-unit">Unit</Label>
          <Select
            value={offsetUnit}
            onValueChange={(v) => setOffsetUnit(v as ReminderUnit)}
          >
            <SelectTrigger id="offset-unit" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ReminderUnit).map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {UNIT_LABELS[unit]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="direction">When</Label>
          <Select
            value={direction}
            onValueChange={(v) => setDirection(v as ReminderDirection)}
          >
            <SelectTrigger id="direction" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ReminderDirection).map((d) => (
                <SelectItem key={d} value={d}>
                  {DIRECTION_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-muted space-y-2 rounded-lg border p-4">
        <h4 className="text-sm font-medium">Reminder Status</h4>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Fires At</span>
          <span className="font-mono text-xs">
            {formatRunTime(status?.fireAt) ?? "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Triggered</span>
          <span className="font-mono text-xs">
            {formatRunTime(status?.triggeredAt) ?? "Not yet"}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={!canSave || save.isPending}
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
    </div>
  );
};
