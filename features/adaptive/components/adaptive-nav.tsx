"use client";

// Adaptive nav wrapper — re-orders nav items subtly based on usage weights
// Changes are gradual; items never disappear, just shift priority

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAdaptive } from "@/features/adaptive/adaptive-context";

export interface NavItem {
  href:   string;
  label:  string;
  icon:   React.ReactNode;
  exact?: boolean;
}

interface AdaptiveNavProps {
  items:     NavItem[];
  className?: string;
}

export function AdaptiveNav({ items, className }: AdaptiveNavProps) {
  const pathname = usePathname();
  const { weights, isAdapted } = useAdaptive();

  // Sort by weight only after server weights loaded — avoids layout shift on first render
  const sorted = isAdapted
    ? [...items].sort((a, b) => {
        const wa = weights.navWeights[a.href] ?? 0;
        const wb = weights.navWeights[b.href] ?? 0;
        return wb - wa;
      })
    : items;

  return (
    <ul className={cn("flex flex-col gap-0.5", className)}>
      {sorted.map(({ href, label, icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(href + "/");

        return (
          <li key={href}>
            <Link
              href={href as never}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-[--duration-fast] whitespace-nowrap",
                active
                  ? "bg-[--color-primary-subtle] text-[--color-text-primary] font-medium"
                  : "text-[--color-text-secondary] hover:bg-[--color-card] hover:text-[--color-text-primary]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  active ? "text-[--color-primary]" : "text-[--color-text-muted]"
                )}
                aria-hidden
              >
                {icon}
              </span>
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
