"use client";

import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkingSet } from "@/features/working-set/working-set-context";
import type { WorkingSetEntry } from "@/lib/session-store";

interface PinButtonProps {
  entry:      Omit<WorkingSetEntry, "pinnedAt">;
  className?: string;
}

export function PinButton({ entry, className }: PinButtonProps) {
  const { pin, unpin, isPinned } = useWorkingSet();
  const pinned = isPinned(entry.entityKind, entry.entityId);

  function toggle() {
    if (pinned) unpin(entry.entityKind, entry.entityId);
    else        pin(entry);
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-1.5 rounded px-2 py-1 text-[12px] transition-colors",
        pinned
          ? "bg-[--color-primary-subtle] text-[--color-primary]"
          : "text-[--color-text-muted] hover:bg-[--color-card] hover:text-[--color-text-primary]",
        className
      )}
      aria-label={pinned ? "Remove from working set" : "Add to working set"}
    >
      <Layers className="h-3.5 w-3.5" />
      {pinned ? "Pinned" : "Pin"}
    </button>
  );
}
