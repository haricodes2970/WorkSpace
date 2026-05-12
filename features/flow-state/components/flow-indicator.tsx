"use client";

import { Flame, Zap, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlowState, type FlowIntensity } from "@/features/flow-state/flow-state-context";

const CONFIG: Record<FlowIntensity, {
  icon:  React.ReactNode;
  label: string;
  cls:   string;
}> = {
  idle: {
    icon:  <Coffee className="h-3 w-3" />,
    label: "Idle",
    cls:   "text-[--color-text-muted]",
  },
  warm: {
    icon:  <Zap className="h-3 w-3" />,
    label: "Warming",
    cls:   "text-[--color-warning]",
  },
  flow: {
    icon:  <Flame className="h-3 w-3" />,
    label: "Flow",
    cls:   "text-[--color-primary]",
  },
  deep: {
    icon:  <Flame className="h-3 w-3" />,
    label: "Deep",
    cls:   "text-[--color-success]",
  },
};

interface FlowIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export function FlowIndicator({ className, showLabel = false }: FlowIndicatorProps) {
  const { intensity } = useFlowState();
  if (intensity === "idle") return null;
  const { icon, label, cls } = CONFIG[intensity];

  return (
    <span className={cn("inline-flex items-center gap-1", cls, className)}>
      {icon}
      {showLabel && (
        <span className="text-[10px] font-medium">{label}</span>
      )}
    </span>
  );
}
