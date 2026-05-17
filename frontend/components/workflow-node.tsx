import { NodeToolbar, Position } from "@xyflow/react";
import { ReactNode } from "react";
import { Button } from "./ui/button";
import { SettingsIcon, TrashIcon } from "lucide-react";

interface WorkflowNodeProps {
  children: ReactNode;
  showToolBar?: boolean;
  onDelete?: () => void;
  onSettings?: () => void;
  name?: string;
  description?: string;
}

export function WorkflowNode({
  children,
  showToolBar,
  onDelete,
  onSettings,
  name,
  description,
}: WorkflowNodeProps) {
  const shouldShowToolbar =
    showToolBar ?? Boolean(onDelete || onSettings);

  return (
    <>
      {shouldShowToolbar && (
        <NodeToolbar position={Position.Top} className="flex gap-0.5">
          {onSettings && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onSettings}
              aria-label="Node settings"
            >
              <SettingsIcon className="size-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              aria-label="Delete node"
            >
              <TrashIcon className="size-4" />
            </Button>
          )}
        </NodeToolbar>
      )}
      {children}
      {name && (
        <NodeToolbar
          position={Position.Bottom}
          isVisible
          className="max-w-50 text-center"
        >
          <p className="font-medium">{name}</p>
          {description && (
            <p className="text-muted-foreground truncate text-sm">
              {description}
            </p>
          )}
        </NodeToolbar>
      )}
    </>
  );
}
