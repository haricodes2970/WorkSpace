"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

// Thin client wrapper for providers that require "use client"
// Keeps root layout as a server component

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </ThemeProvider>
  );
}
