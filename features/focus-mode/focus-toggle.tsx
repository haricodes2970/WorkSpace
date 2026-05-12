"use client";

import { Minimize2, Maximize2 } from "lucide-react";
import { useFocusMode } from "./focus-mode-context";
import { cn } from "@/lib/utils";

interface FocusToggleProps {
  className?: string;
}

export function FocusToggle({ className }: FocusToggleProps) {
  const { focused, toggle } = useFocusMode();

  return (
    <button
      type="button"
      onClick={toggle}
      title={focused ? "Exit focus mode (⌘⇧F)" : "Enter focus mode (⌘⇧F)"}
      aria-pressed={focused}
      aria-label={focused ? "Exit focus mode" : "Enter focus mode"}
      className={cn(
        "flex items-center justify-center h-6 w-6 rounded text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-card] transition-colors",
        className
      )}
    >
      {focused
        ? <Maximize2 className="h-3.5 w-3.5" />
        : <Minimize2 className="h-3.5 w-3.5" />
      }
    </button>
  );
}
