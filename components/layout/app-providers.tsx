"use client";

import { useState } from "react";
import { CommandPalette } from "@/components/shared/command-palette";
import { QuickCapture } from "@/components/shared/quick-capture";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);

  const handleCapture = async (data: { title: string; tags: string[] }) => {
    // Wire to createIdeaAction in Phase 2
    console.log("capture", data);
  };

  return (
    <>
      {children}
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <QuickCapture
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        onSubmit={handleCapture}
      />
    </>
  );
}
