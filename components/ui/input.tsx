import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border bg-[--color-surface-2] px-3 py-2 text-sm text-[--color-text-primary] placeholder:text-[--color-text-muted]",
            "border-[--color-border] focus:border-[--color-accent] focus:outline-none focus:ring-1 focus:ring-[--color-accent]",
            "transition-colors duration-150",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[--color-danger] focus:border-[--color-danger] focus:ring-[--color-danger]",
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p className="text-xs text-[--color-danger]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
