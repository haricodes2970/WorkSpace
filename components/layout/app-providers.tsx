"use client";

import { useState, useTransition } from "react";
import { CommandPalette }    from "@/components/shared/command-palette";
import { QuickCapture }      from "@/components/shared/quick-capture";
import { OfflineBanner }     from "@/features/reliability/offline-banner";
import { FocusModeProvider } from "@/features/focus-mode/focus-mode-context";
import { DiagnosticsPanel }  from "@/features/diagnostics/diagnostics-panel";
interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [cmdOpen, setCmdOpen]         = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  // startTransition reserved for future capture action wiring
  const [, startTransition]           = useTransition();

  const handleCapture = (_data: { title: string; tags: string[] }) => {
    startTransition(async () => {
      // TODO: wire to createIdeaAction once available
    });
  };

  return (
    <FocusModeProvider>
      <OfflineBanner />
      {children}
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <QuickCapture
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        onSubmit={handleCapture}
      />
      <DiagnosticsPanel />
    </FocusModeProvider>
  );
}
