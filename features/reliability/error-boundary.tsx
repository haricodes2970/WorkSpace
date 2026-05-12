"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  reset = () => this.setState({ error: null });

  override render() {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) {
        return this.props.fallback(error, this.reset);
      }
      return <DefaultFallback error={error} reset={this.reset} />;
    }
    return this.props.children;
  }
}

function DefaultFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <AlertTriangle className="h-8 w-8 text-[--color-danger] opacity-60" />
      <div>
        <p className="text-[14px] font-medium text-[--color-text-primary]">
          Something went wrong
        </p>
        <p className="text-[12px] text-[--color-text-muted] mt-1 max-w-xs">
          {error.message}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="flex items-center gap-1.5 text-[12px] text-[--color-primary] hover:underline mt-1"
      >
        <RotateCcw className="h-3 w-3" />
        Try again
      </button>
    </div>
  );
}

// ─── Inline error display (for non-throwing errors) ──────────────────────────

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[--color-danger]/30 bg-[--color-danger-subtle] px-3 py-2">
      <AlertTriangle className="h-3.5 w-3.5 text-[--color-danger] shrink-0" />
      <p className="text-[12px] text-[--color-danger] flex-1">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 text-[11px] text-[--color-danger] hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}
