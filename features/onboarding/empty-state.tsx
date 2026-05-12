"use client";

import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label:   string;
  href?:   Route;
  onClick?: () => void;
  primary?: boolean;
}

interface EmptyStateProps {
  icon:        React.ReactNode;
  title:       string;
  description?: string;
  actions?:    EmptyStateAction[];
  hint?:       string;
  compact?:    boolean;
  className?:  string;
}

export function EmptyState({
  icon,
  title,
  description,
  actions,
  hint,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-16 px-6",
        className
      )}
    >
      <div className={cn(
        "text-[--color-text-muted] opacity-30 mb-3",
        compact ? "[&_svg]:h-8 [&_svg]:w-8" : "[&_svg]:h-12 [&_svg]:w-12"
      )}>
        {icon}
      </div>
      <p className={cn(
        "font-medium text-[--color-text-secondary]",
        compact ? "text-[13px]" : "text-[15px]"
      )}>
        {title}
      </p>
      {description && (
        <p className={cn(
          "text-[--color-text-muted] mt-1 max-w-xs",
          compact ? "text-[11px]" : "text-[13px]"
        )}>
          {description}
        </p>
      )}
      {hint && (
        <p className="text-[11px] text-[--color-text-muted] mt-2 opacity-60 italic">
          {hint}
        </p>
      )}
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-3 mt-4 flex-wrap justify-center">
          {actions.map((action, i) => {
            const base = cn(
              "text-[12px] transition-colors",
              action.primary
                ? "text-[--color-primary] hover:underline font-medium"
                : "text-[--color-text-muted] hover:text-[--color-text-secondary]"
            );
            if (action.href) {
              return (
                <Link key={i} href={action.href} className={base}>
                  {action.label}
                </Link>
              );
            }
            return (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                className={base}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
