"use client";

import { BaseExecutionNode } from "@/components/base-execution-node";
import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { RepeatIcon } from "lucide-react";
import { useState } from "react";
import { getNodeExecutionStatus } from "@/features/execution/context/workflow-execution-context";
import { LoopDialog } from "./dialog";
import type { LoopFormValues } from "./schema";

type LoopNodeData = {
  sourcePath?: string;
  itemVariableName?: string;
  variableName?: string;
  continueOnError?: boolean;
  executionStatus?: "loading" | "success" | "error" | "initial";
  [key: string]: unknown;
};

type LoopNodeType = Node<LoopNodeData>;

export function LoopNode(props: NodeProps<LoopNodeType>) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const nodeStatus = getNodeExecutionStatus(props.data);

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: LoopFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...values,
            },
          };
        }
        return node;
      }),
    );
  };

  const nodeData = props.data;
  const description =
    nodeData?.sourcePath && nodeData?.itemVariableName
      ? `For each ${nodeData.sourcePath} → ${nodeData.itemVariableName}`
      : "Not Configured";

  return (
    <>
      <LoopDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={RepeatIcon}
        name="Loop / For Each"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
}

LoopNode.displayName = "LoopNode";
