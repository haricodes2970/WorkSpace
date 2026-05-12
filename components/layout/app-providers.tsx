"use client";

import { useState, useTransition } from "react";
import { CommandPalette }      from "@/components/shared/command-palette";
import { QuickCapture }        from "@/components/shared/quick-capture";
import { OfflineBanner }       from "@/features/reliability/offline-banner";
import { FocusModeProvider }   from "@/features/focus-mode/focus-mode-context";
import { DiagnosticsPanel }    from "@/features/diagnostics/diagnostics-panel";
import { DeepWorkProvider }    from "@/features/deep-work/deep-work-context";
import { DeepWorkOverlay }     from "@/features/deep-work/deep-work-overlay";
import { ContinuityProvider }  from "@/features/continuity/continuity-context";
import { WorkingSetProvider }  from "@/features/working-set/working-set-context";
import { WorkingSetPanel }     from "@/features/working-set/components/working-set-panel";
import { FlowStateProvider }   from "@/features/flow-state/flow-state-context";
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
    <FlowStateProvider>
      <FocusModeProvider>
        <DeepWorkProvider>
          <ContinuityProvider>
            <WorkingSetProvider>
              <OfflineBanner />
              {children}
              <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
              <QuickCapture
                open={captureOpen}
                onOpenChange={setCaptureOpen}
                onSubmit={handleCapture}
              />
              <DiagnosticsPanel />
              <DeepWorkOverlay />
              <WorkingSetPanel />
            </WorkingSetProvider>
          </ContinuityProvider>
        </DeepWorkProvider>
      </FocusModeProvider>
    </FlowStateProvider>
  );
}
