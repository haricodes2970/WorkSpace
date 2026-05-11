import { cn } from "@/lib/utils";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center rounded border border-[--color-border] bg-[--color-card]",
        "px-1.5 py-0.5 font-mono text-[11px] text-[--color-text-muted]",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
