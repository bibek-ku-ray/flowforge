"use client";

import { BaseExecutionNode } from "@/components/base-execution-node";
import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { SheetIcon } from "lucide-react";
import { useState } from "react";
import { getNodeExecutionStatus } from "@/features/execution/context/workflow-execution-context";
import { GoogleSheetsDialog, GoogleSheetsFormValues } from "./dialog";

type GoogleSheetsNodeData = {
  variableName?: string;
  credentialId?: string;
  spreadsheetId?: string;
  worksheet?: string;
  [key: string]: unknown;
};

type GoogleSheetsNodeType = Node<GoogleSheetsNodeData>;

export function GoogleSheetsNode(props: NodeProps<GoogleSheetsNodeType>) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const nodeStatus = getNodeExecutionStatus(props.data);

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: GoogleSheetsFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === props.id
          ? { ...node, data: { ...node.data, ...values } }
          : node,
      ),
    );
  };

  const description = props.data?.spreadsheetId
    ? `Sheet: ${props.data.worksheet || "Sheet1"}`
    : "Not Configured";

  return (
    <>
      <GoogleSheetsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={SheetIcon}
        name="Google Sheets"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
}

GoogleSheetsNode.displayName = "GoogleSheetsNode";
