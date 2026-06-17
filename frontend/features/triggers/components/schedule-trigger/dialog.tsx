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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  isValidCron,
  isValidTimezone,
  SIMPLE_INTERVALS,
  type SimpleInterval,
} from "@/lib/schedule/cron";
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

type Mode = "SIMPLE" | "ADVANCED";

type ScheduleStatus = {
  mode: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  lastRunAt: Date | string | null;
  nextRunAt: Date | string | null;
} | null;

const SIMPLE_LABELS: Record<SimpleInterval, string> = {
  "5m": "Every 5 minutes",
  "15m": "Every 15 minutes",
  "30m": "Every 30 minutes",
  "1h": "Every hour",
  "1d": "Every day",
};

const formatRunTime = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "PPpp");
};

const matchInterval = (cron: string | undefined): SimpleInterval => {
  if (!cron) return "15m";
  const matched = (
    Object.entries(SIMPLE_INTERVALS) as Array<[SimpleInterval, string]>
  ).find(([, value]) => value === cron);
  return matched ? matched[0] : "15m";
};

export const ScheduleTriggerDialog = ({
  open,
  onOpenChange,
  nodeId,
}: Props) => {
  const trpc = useTRPC();
  const statusQueryOptions = trpc.workflows.getScheduleStatus.queryOptions({
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
          <DialogTitle>Schedule Trigger Configuration</DialogTitle>
          <DialogDescription>
            Run this workflow automatically on a recurring schedule.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          // Remount when the persisted status finishes loading so the form
          // initializes from it via useState initializers (no effect needed).
          <ScheduleForm
            key={isFetched ? "ready" : "loading"}
            nodeId={nodeId}
            status={(status as ScheduleStatus) ?? null}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const ScheduleForm = ({
  nodeId,
  status,
}: {
  nodeId: string;
  status: ScheduleStatus;
}) => {
  const params = useParams();
  const workflowId = params.workflowId as string;
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>(
    status?.mode === "ADVANCED" ? "ADVANCED" : "SIMPLE",
  );
  const [interval, setInterval] = useState<SimpleInterval>(
    matchInterval(status?.cronExpression),
  );
  const [cronExpression, setCronExpression] = useState(
    status?.cronExpression ?? "*/15 * * * *",
  );
  const [timezone, setTimezone] = useState(status?.timezone ?? "UTC");

  const effectiveCron =
    mode === "SIMPLE" ? SIMPLE_INTERVALS[interval] : cronExpression;

  const cronValid = isValidCron(effectiveCron);
  const timezoneValid = mode === "SIMPLE" ? true : isValidTimezone(timezone);
  const canSave = cronValid && timezoneValid;

  const statusQueryOptions = trpc.workflows.getScheduleStatus.queryOptions({
    nodeId,
  });

  const save = useMutation(
    trpc.workflows.updateScheduleTrigger.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(
            trpc.workflows.getOne.queryOptions({ id: workflowId }),
          ),
          queryClient.invalidateQueries(statusQueryOptions),
        ]);
        toast.success("Schedule saved — this workflow will run automatically");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save schedule");
      },
    }),
  );

  const handleSave = () => {
    save.mutate({
      workflowId,
      nodeId,
      mode,
      cronExpression:
        mode === "SIMPLE" ? SIMPLE_INTERVALS[interval] : cronExpression,
      timezone: mode === "SIMPLE" ? "UTC" : timezone,
    });
  };

  const lastRun = formatRunTime(status?.lastRunAt);
  const nextRun = formatRunTime(status?.nextRunAt);

  return (
    <div className="space-y-4">
      <Tabs
        value={mode}
        onValueChange={(value) => setMode(value as Mode)}
        className="w-full"
      >
        <TabsList className="w-full">
          <TabsTrigger value="SIMPLE">Simple</TabsTrigger>
          <TabsTrigger value="ADVANCED">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="SIMPLE" className="space-y-2 pt-2">
          <Label htmlFor="schedule-interval">Interval</Label>
          <Select
            value={interval}
            onValueChange={(value) => setInterval(value as SimpleInterval)}
          >
            <SelectTrigger id="schedule-interval" className="w-full">
              <SelectValue placeholder="Select an interval" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SIMPLE_INTERVALS) as SimpleInterval[]).map(
                (key) => (
                  <SelectItem key={key} value={key}>
                    {SIMPLE_LABELS[key]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Simple schedules run in UTC.
          </p>
        </TabsContent>

        <TabsContent value="ADVANCED" className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="schedule-cron">Cron expression</Label>
            <Input
              id="schedule-cron"
              value={cronExpression}
              onChange={(event) => setCronExpression(event.target.value)}
              placeholder="0 9 * * *"
              className="font-mono text-sm"
              aria-invalid={!cronValid}
            />
            {!cronValid ? (
              <p className="text-xs text-destructive">
                Enter a valid 5-field cron expression (e.g. 0 9 * * *).
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Standard 5-field cron: minute hour day month weekday.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-timezone">Timezone</Label>
            <Input
              id="schedule-timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              placeholder="UTC"
              className="font-mono text-sm"
              aria-invalid={!timezoneValid}
            />
            {!timezoneValid ? (
              <p className="text-xs text-destructive">
                Enter a valid IANA timezone (e.g. UTC, Asia/Kathmandu).
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                IANA timezone identifier, e.g. Asia/Kathmandu.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="rounded-lg border bg-muted p-4 space-y-2">
        <h4 className="font-medium text-sm">Schedule Status</h4>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last Run</span>
          <span className="font-mono text-xs">{lastRun ?? "Never"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Next Run</span>
          <span className="font-mono text-xs">{nextRun ?? "—"}</span>
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
