"use client";

import { Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AutosaveStatus } from "./use-autosave";

interface AutosaveStatusProps {
  status:    AutosaveStatus;
  className?: string;
}

export function AutosaveStatusIndicator({ status, className }: AutosaveStatusProps) {
  if (status === "idle") return null;

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-[11px] transition-all duration-200",
        status === "saving"  && "text-[--color-text-muted]",
        status === "saved"   && "text-[--color-success]",
        status === "error"   && "text-[--color-danger]",
        className
      )}
      aria-live="polite"
    >
      {status === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === "saved"  && <Check   className="h-3 w-3" />}
      {status === "error"  && <AlertCircle className="h-3 w-3" />}
      {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Error saving"}
    </span>
  );
}
