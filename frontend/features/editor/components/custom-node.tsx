import React from "react";
import { Handle, Node, NodeProps, Position } from "@xyflow/react";

type CustomNodeData = {
  label: string;
};

type CustomNodeType = Node<CustomNodeData>;

export const CustomNode = ({ data }: NodeProps<CustomNodeType>) => {
  return (
    <div className="px-4 py-2 rounded-lg border bg-background text-foreground border-border shadow-sm">
      <Handle
        type="target"
        position={Position.Top}
        className="bg-foreground"
      />
      {data.label}
      <Handle
        type="source"
        position={Position.Bottom}
        className="bg-foreground"
      />
    </div>
  );
};
