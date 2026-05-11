import type { User } from "@prisma/client";

interface TopbarProps {
  user: User;
  actions?: React.ReactNode;
}

export function Topbar({ user, actions }: TopbarProps) {
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user.email[0]?.toUpperCase() ?? "?");

  return (
    <header className="flex h-12 items-center justify-between border-b border-[--color-border-subtle] bg-[--color-panel] px-5 shrink-0">
      <div className="flex items-center gap-2">
        {actions}
      </div>

      <div className="flex items-center gap-3">
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-[--color-border] bg-[--color-card] px-1.5 py-0.5 text-[11px] text-[--color-text-muted] font-mono">
          ⌘K
        </kbd>
        <span className="hidden sm:block text-[12px] text-[--color-text-muted]">
          {user.email}
        </span>
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full bg-[--color-primary-subtle] text-[11px] font-semibold text-[--color-primary] border border-[--color-primary]/20 shrink-0"
          aria-label={`User: ${user.name ?? user.email}`}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
