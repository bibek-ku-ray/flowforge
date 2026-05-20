import { type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type NodeStatus = "loading" | "success" | "error" | "initial";

export type NodeStatusVariant = "overlay" | "border";

export type NodeStatusIndicatorProps = {
  status?: NodeStatus;
  variant?: NodeStatusVariant;
  children: ReactNode;
  className?: string;
};

export const SpinnerLoadingIndicator = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <div className="relative">
      <StatusBorder className="border-blue-500/80">{children}</StatusBorder>

      <div className="absolute inset-0 z-50 rounded-[9px] bg-background/50 backdrop-blur-xs" />
      <div className="pointer-events-none absolute inset-0 z-50">
        <span className="absolute top-[calc(50%-1.25rem)] left-[calc(50%-1.25rem)] inline-block h-10 w-10 animate-ping rounded-full bg-blue-500/20" />
        <LoaderCircle className="absolute top-[calc(50%-0.75rem)] left-[calc(50%-0.75rem)] size-6 animate-spin text-blue-500" />
      </div>
    </div>
  );
};

export const BorderLoadingIndicator = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-[3px]">
        <style>
          {`
        @keyframes node-status-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .node-status-spinner {
          animation: node-status-spin 2s linear infinite;
          position: absolute;
          left: 50%;
          top: 50%;
          width: 140%;
          aspect-ratio: 1;
          transform-origin: center;
        }
      `}
        </style>
        <div
          className={cn(
            "absolute inset-0 overflow-hidden rounded-[9px]",
            className,
          )}
        >
          <div className="node-status-spinner rounded-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(59,130,246,0.15)_0deg,rgba(59,130,246,0.9)_360deg)]" />
        </div>
      </div>
      {children}
    </div>
  );
};

const StatusBorder = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className="relative">
      <div
        className={cn(
          "pointer-events-none absolute -inset-[3px] rounded-md border-[3px]",
          className,
        )}
      />
      {children}
    </div>
  );
};

export const NodeStatusIndicator = ({
  status,
  variant = "border",
  children,
  className,
}: NodeStatusIndicatorProps) => {
  switch (status) {
    case "loading":
      switch (variant) {
        case "overlay":
          return <SpinnerLoadingIndicator>{children}</SpinnerLoadingIndicator>;
        case "border":
          return (
            <BorderLoadingIndicator className={className}>
              {children}
            </BorderLoadingIndicator>
          );
        default:
          return <>{children}</>;
      }
    case "success":
      return (
        <StatusBorder className={cn("border-emerald-500", className)}>
          {children}
        </StatusBorder>
      );
    case "error":
      return (
        <StatusBorder className={cn("border-red-500", className)}>
          {children}
        </StatusBorder>
      );
    default:
      return <>{children}</>;
  }
};
