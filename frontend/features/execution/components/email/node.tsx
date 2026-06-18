"use client";

import { BaseExecutionNode } from "@/components/base-execution-node";
import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { MailIcon } from "lucide-react";
import { useState } from "react";
import { getNodeExecutionStatus } from "@/features/execution/context/workflow-execution-context";
import { EmailDialog, EmailFormValues } from "./dialog";

type EmailNodeData = {
  variableName?: string;
  credentialId?: string;
  from?: string;
  to?: string;
  subject?: string;
  html?: string;
  [key: string]: unknown;
};

type EmailNodeType = Node<EmailNodeData>;

export function EmailNode(props: NodeProps<EmailNodeType>) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const nodeStatus = getNodeExecutionStatus(props.data);

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: EmailFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === props.id
          ? { ...node, data: { ...node.data, ...values } }
          : node,
      ),
    );
  };

  const description = props.data?.subject || "Not Configured";

  return (
    <>
      <EmailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={MailIcon}
        name="Email"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
}

EmailNode.displayName = "EmailNode";
