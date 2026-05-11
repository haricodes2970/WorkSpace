"use client";

import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignOutButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function SignOutButton({ className, ...props }: SignOutButtonProps) {
  return (
    <button
      type="submit"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px]",
        "text-[--color-text-muted] transition-colors duration-[--duration-fast]",
        "hover:bg-[--color-danger-subtle] hover:text-[--color-danger]",
        className
      )}
      {...props}
    >
      <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Sign out
    </button>
  );
}
