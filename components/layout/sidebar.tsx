"use client";

import {
  Sun,
  LayoutDashboard,
  Lightbulb,
  FolderKanban,
  Zap,
  Brain,
  Sparkles,
  BookOpenText,
  User,
} from "lucide-react";
import { FlowIndicator }     from "@/features/flow-state/components/flow-indicator";
import { PressureIndicator } from "@/features/cognition/components/pressure-indicator";
import { DriftIndicator }    from "@/features/drift/components/drift-indicator";
import { HealthBadge }       from "@/features/environment/components/health-badge";
import { AdaptiveNav }       from "@/features/adaptive/components/adaptive-nav";

const NAV_ITEMS = [
  { href: "/today",     label: "Today",     icon: Sun,           exact: true  },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/ideas",     label: "Ideas",     icon: Lightbulb,     exact: false },
  { href: "/projects",  label: "Projects",  icon: FolderKanban,  exact: false },
  { href: "/tasks",     label: "Tasks",     icon: Zap,           exact: false },
  { href: "/knowledge", label: "Knowledge", icon: Brain,         exact: false },
  { href: "/advisor",   label: "Advisor",   icon: Sparkles,      exact: false },
  { href: "/reviews",   label: "Reviews",   icon: BookOpenText,  exact: false },
  { href: "/profile",   label: "Profile",   icon: User,          exact: true  },
] as const;

interface SidebarProps {
  signOutSlot:   React.ReactNode;
  showDevBadge?: boolean;
}

export function Sidebar({ signOutSlot, showDevBadge = false }: SidebarProps) {
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

      {/* Nav — adaptive ordering */}
      <nav className="flex-1 overflow-y-auto p-1.5" aria-label="Main navigation">
        <AdaptiveNav
          items={NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => ({
            href,
            label,
            exact,
            icon: <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />,
          }))}
        />
      </nav>

      {/* Footer */}
      <div className="p-1.5 border-t border-[--color-border-subtle] shrink-0 flex flex-col gap-1.5">
        {showDevBadge && (
          <div className="px-2.5 py-1 rounded text-[10px] font-mono text-[--color-text-muted] bg-[--color-warning]/10 border border-[--color-warning]/20 tracking-wider select-none">
            DEV AUTH
          </div>
        )}
        {/* Adaptive intelligence indicators */}
        <div className="px-2 flex items-center gap-1.5 flex-wrap">
          <PressureIndicator compact />
          <DriftIndicator    compact />
          <HealthBadge />
          <span className="ml-auto">
            <FlowIndicator showLabel />
          </span>
        </div>
        {signOutSlot}
      </div>
    </aside>
  );
}
