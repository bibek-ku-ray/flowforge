"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ScheduleTriggerDialog = ({ open, onOpenChange }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Trigger Configuration</DialogTitle>
          <DialogDescription>
            Configure a cron schedule or interval to run this workflow
            automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Available Variables</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{schedule.executedAt}}"}
                </code>{" "}
                - ISO timestamp of this run
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{schedule.timezone}}"}
                </code>{" "}
                - Schedule timezone
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{schedule.cronExpression}}"}
                </code>{" "}
                - The cron expression
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
