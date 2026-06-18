"use client";

import { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { CalendarClockIcon } from "lucide-react";
import { getNodeExecutionStatus } from "@/features/execution/context/workflow-execution-context";
import { BaseTriggerNode } from "../base-trigger-node";
import { EventTriggerDialog } from "./dialog";

export const EventTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const nodeStatus = getNodeExecutionStatus(props.data);

  const handleOpenSettings = () => setDialogOpen(true);

  return (
    <>
      <EventTriggerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        nodeId={props.id}
      />
      <BaseTriggerNode
        {...props}
        icon={CalendarClockIcon}
        name="Event Reminder"
        description="Fires relative to a calendar event"
        status={nodeStatus}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

EventTriggerNode.displayName = "EventTriggerNode";
