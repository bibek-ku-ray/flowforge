import { NodeProps } from "@xyflow/react";
import { useState } from "react";
import { getNodeExecutionStatus } from "@/features/execution/context/workflow-execution-context";
import { BaseTriggerNode } from "../base-trigger-node";
import { MousePointerIcon } from "lucide-react";
import { ManualTriggerDialog } from "./dialog";

export function ManualTriggerNode(props: NodeProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const nodeStatus = getNodeExecutionStatus(props.data);

  const handleOpenSettings = () => setDialogOpen(true);

  return (
    <>
      <ManualTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <BaseTriggerNode
        {...props}
        icon={MousePointerIcon}
        name="When clicking 'Execute workflow'"
        status={nodeStatus}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
}

ManualTriggerNode.displayName = "ManualTriggerNode";
