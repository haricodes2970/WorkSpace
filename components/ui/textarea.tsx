import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, autoResize, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
      }
      onChange?.(e);
    };

    return (
      <div className="flex flex-col gap-1.5">
        <textarea
          className={cn(
            "flex w-full rounded-md border bg-[--color-card] px-3 py-2 text-[13px]",
            "text-[--color-text-primary] placeholder:text-[--color-text-muted]",
            "border-[--color-border] focus:border-[--color-primary]/50 focus:outline-none focus:ring-1 focus:ring-[--color-primary]/30",
            "transition-colors duration-[--duration-fast] resize-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[--color-danger]/50 focus:border-[--color-danger] focus:ring-[--color-danger]/20",
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          onChange={handleChange}
          {...props}
        />
        {error && (
          <p className="text-[11px] text-[--color-danger]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
