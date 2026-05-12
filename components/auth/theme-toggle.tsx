"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={cn("h-8 w-8", className)} />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        "text-white/30 hover:text-white/60 hover:bg-white/5",
        "dark:text-white/30 dark:hover:text-white/60",
        "light:text-black/25 light:hover:text-black/50 light:hover:bg-black/5",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark
        ? <Sun  className="h-4 w-4" />
        : <Moon className="h-4 w-4" />
      }
    </button>
  );
}
