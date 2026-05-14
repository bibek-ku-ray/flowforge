// Fix: 
import { NodeProps, useNodesState } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { MousePointerIcon } from "lucide-react";
import { ManualTriggerDialog } from "./dialog";

export const ManualTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  // FIX: 
  const nodeStatus = useNodesState({
    nodeId: props.id,
    // channel: MANUAL_TRIGGER_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchManualTriggerRealtimeToken,
  })

  const handleOpenSettings = () => setDialogOpen(true)

  return (
    <>
      <ManualTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <BaseTriggerNode
        {...props}
        icon={MousePointerIcon}
        name="When clicking 'Execute workflow'"
        status={nodestatus}
        onSetting={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});
