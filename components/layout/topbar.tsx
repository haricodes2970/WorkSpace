import type { User } from "@prisma/client";

interface TopbarProps {
  user: User;
  title?: string;
}

export function Topbar({ user, title }: TopbarProps) {
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0]?.toUpperCase() ?? "?";

  return (
    <header className="flex h-14 items-center justify-between border-b border-[--color-border] bg-[--color-surface] px-6">
      {title && (
        <h1 className="text-sm font-medium text-[--color-text-primary]">
          {title}
        </h1>
      )}
      {!title && <div />}

      <div className="flex items-center gap-3">
        <span className="text-xs text-[--color-text-muted] hidden sm:block">
          {user.email}
        </span>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[--color-accent-subtle] text-xs font-medium text-[--color-accent]"
          aria-label={`User: ${user.name ?? user.email}`}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
