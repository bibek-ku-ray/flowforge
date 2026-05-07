import React from "react";
import { Handle, Position } from "@xyflow/react";

export const CustomNode = ({ data }: any) => {
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
