"use client";

import { BaseExecutionNode } from "@/components/base-execution-node";
import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { GlobeIcon } from "lucide-react";
import { useState } from "react";
import { getNodeExecutionStatus } from "@/features/execution/context/workflow-execution-context";
import { HttpRequestDialog, HttpRequestFormValues } from "./dialog";

type HttpRequestNodeData = {
  variableName?: string;
  endpoint?: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: string;
  executionStatus?: "loading" | "success" | "error" | "initial";
  [key: string]: unknown;
};

type HttpRequestNodeType = Node<HttpRequestNodeData>;

export function HttpRequestNode(props: NodeProps<HttpRequestNodeType>) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const nodeStatus = getNodeExecutionStatus(props.data);

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: HttpRequestFormValues) => {
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
  const description = nodeData?.endpoint
    ? `${nodeData.method || "GET"}: ${nodeData.endpoint}`
    : "Not Configured";

  return (
    <>
      <HttpRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={GlobeIcon}
        name="HTTP Request"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
}

HttpRequestNode.displayName = "HttpRequestNode";
