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
            Schedule configuration is coming soon. You will be able to run this
            workflow on a recurring cron or interval schedule.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
