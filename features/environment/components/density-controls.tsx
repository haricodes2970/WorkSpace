"use client";

import { cn } from "@/lib/utils";
import { usePersonalization } from "@/features/environment/personalization-context";

const OPTIONS = [
  { value: "compact"     as const, label: "Compact"     },
  { value: "comfortable" as const, label: "Normal"      },
  { value: "spacious"    as const, label: "Spacious"    },
] as const;

export function DensityControls({ className }: { className?: string }) {
  const { density, setDensity } = usePersonalization();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="text-[11px] text-[--color-text-muted] mr-1">Density</span>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => setDensity(o.value)}
          className={cn(
            "rounded px-2 py-0.5 text-[11px] transition-colors",
            density === o.value
              ? "bg-[--color-primary-subtle] text-[--color-primary] font-medium"
              : "text-[--color-text-muted] hover:text-[--color-text-primary] hover:bg-[--color-card]"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
