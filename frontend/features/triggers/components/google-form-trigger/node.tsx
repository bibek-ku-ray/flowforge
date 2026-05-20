"use client";

import { NodeProps } from "@xyflow/react";
import { useState } from "react";
import { getNodeExecutionStatus } from "@/features/execution/context/workflow-execution-context";
import { BaseTriggerNode } from "../base-trigger-node";
import { GoogleFromTriggerDialog } from "./dialog";

export function GoogleFormTrigger(props: NodeProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const nodeStatus = getNodeExecutionStatus(props.data);

  const handleOpenSetting = () => setDialogOpen(true);

  return (
    <>
      <GoogleFromTriggerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        nodeId={props.id}
        formId={
          typeof props.data?.formId === "string" ? props.data.formId : undefined
        }
      />

      <BaseTriggerNode
        {...props}
        icon="/logos/googleform.svg"
        name="Google Form"
        description="When form is submitted"
        status={nodeStatus}
        onSettings={handleOpenSetting}
        onDoubleClick={handleOpenSetting}
      />
    </>
  );
}
