"use client";

import { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { getNodeExecutionStatus } from "@/features/execution/context/workflow-execution-context";
import { BaseTriggerNode } from "../base-trigger-node";
import { ScheduleTriggerDialog } from "./dialog";
import { ClockIcon } from "lucide-react";

export const ScheduleTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const nodeStatus = getNodeExecutionStatus(props.data);

  const handleOpenSettings = () => setDialogOpen(true);

  return (
    <>
      <ScheduleTriggerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        nodeId={props.id}
      />
      <BaseTriggerNode
        {...props}
        icon={ClockIcon}
        name="Schedule"
        description="Runs on a recurring schedule"
        status={nodeStatus}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

ScheduleTriggerNode.displayName = "ScheduleTriggerNode";
