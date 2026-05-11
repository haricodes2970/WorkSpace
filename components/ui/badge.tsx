import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border transition-colors",
  {
    variants: {
      variant: {
        default:  "bg-[--color-card] border-[--color-border] text-[--color-text-secondary]",
        primary:  "bg-[--color-primary-subtle] border-[--color-primary]/20 text-[--color-primary]",
        accent:   "bg-[--color-accent-subtle] border-[--color-accent]/20 text-[--color-accent]",
        success:  "bg-[--color-success-subtle] border-[--color-success]/20 text-[--color-success]",
        warning:  "bg-[--color-warning-subtle] border-[--color-warning]/20 text-[--color-warning]",
        danger:   "bg-[--color-danger-subtle] border-[--color-danger]/20 text-[--color-danger]",
        outline:  "bg-transparent border-[--color-border] text-[--color-text-muted]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      )}
      {children}
    </span>
  );
}

export { badgeVariants };
