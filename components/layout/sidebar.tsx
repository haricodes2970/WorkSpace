"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  FolderKanban,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ideas",     label: "Ideas",     icon: Lightbulb },
  { href: "/projects",  label: "Projects",  icon: FolderKanban },
  { href: "/tasks",     label: "Tasks",     icon: Zap },
] as const;

interface SidebarProps {
  /** Rendered in the footer slot — pass a sign-out form from the server layout */
  signOutSlot: React.ReactNode;
}

export function Sidebar({ signOutSlot }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-52 flex-col border-r border-[--color-border] bg-[--color-panel]">
      {/* Wordmark */}
      <div className="flex h-12 items-center gap-2 px-4 border-b border-[--color-border-subtle]">
        <div className="h-5 w-5 rounded bg-[--color-primary] flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">W</span>
        </div>
        <span className="text-[13px] font-semibold text-[--color-text-primary] tracking-tight">
          WorkSpace
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-1.5" aria-label="Main navigation">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-[--duration-fast]",
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

      {/* Footer slot — sign-out form injected by server layout */}
      <div className="p-1.5 border-t border-[--color-border-subtle]">
        {signOutSlot}
      </div>
    </aside>
  );
}
