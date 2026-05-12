"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sun,
  LayoutDashboard,
  Lightbulb,
  FolderKanban,
  Zap,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/today",     label: "Today",     icon: Sun,           exact: true  },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/ideas",     label: "Ideas",     icon: Lightbulb,     exact: false },
  { href: "/projects",  label: "Projects",  icon: FolderKanban,  exact: false },
  { href: "/tasks",     label: "Tasks",     icon: Zap,           exact: false },
  { href: "/knowledge", label: "Knowledge", icon: Brain,         exact: false },
] as const;

interface SidebarProps {
  signOutSlot:   React.ReactNode;
  showDevBadge?: boolean;
}

export function Sidebar({ signOutSlot, showDevBadge = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-full w-52 flex-col border-r border-[--color-border] bg-[--color-panel] transition-all duration-300 data-[focus-mode=true]:w-0 data-[focus-mode=true]:overflow-hidden"
      data-sidebar
    >
      {/* Wordmark */}
      <div className="flex h-12 items-center gap-2 px-4 border-b border-[--color-border-subtle] shrink-0">
        <div className="h-5 w-5 rounded bg-[--color-primary] flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-white">W</span>
        </div>
        <span className="text-[13px] font-semibold text-[--color-text-primary] tracking-tight whitespace-nowrap">
          WorkSpace
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-1.5" aria-label="Main navigation">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-[--duration-fast] whitespace-nowrap",
                    active
                      ? "bg-[--color-primary-subtle] text-[--color-text-primary] font-medium"
                      : "text-[--color-text-secondary] hover:bg-[--color-card] hover:text-[--color-text-primary]"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      active ? "text-[--color-primary]" : "text-[--color-text-muted]"
                    )}
                    aria-hidden
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-1.5 border-t border-[--color-border-subtle] shrink-0 flex flex-col gap-1">
        {showDevBadge && (
          <div className="px-2.5 py-1 rounded text-[10px] font-mono text-[--color-text-muted] bg-[--color-warning]/10 border border-[--color-warning]/20 tracking-wider select-none">
            DEV AUTH
          </div>
        )}
        {signOutSlot}
      </div>
    </aside>
  );
}
