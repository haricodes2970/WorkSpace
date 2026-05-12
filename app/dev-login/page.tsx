import { notFound, redirect } from "next/navigation";
import Link from "next/link";

/**
 * Dev-only entry point. Returns 404 in production regardless of query params.
 * In dev-bypass mode, navigating to /today works immediately (middleware is open),
 * so this page is purely a convenience landing screen.
 */
export default function DevLoginPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  if (process.env.DEV_AUTH_BYPASS !== "true") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--color-bg]">
      <div className="flex flex-col items-center gap-6 rounded-xl border border-[--color-warning]/30 bg-[--color-warning]/5 p-10 text-center max-w-sm w-full">
        {/* Badge */}
        <span className="rounded border border-[--color-warning]/40 px-2 py-0.5 font-mono text-[10px] text-[--color-warning] tracking-widest">
          DEV AUTH BYPASS
        </span>

        {/* Wordmark */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-8 w-8 rounded-lg bg-[--color-primary] flex items-center justify-center">
            <span className="text-[14px] font-bold text-white">W</span>
          </div>
          <h1 className="text-[18px] font-semibold text-[--color-text-primary]">
            WorkSpace
          </h1>
          <p className="text-[12px] text-[--color-text-muted]">
            Development environment · No auth required
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/today"
          className="w-full rounded-md bg-[--color-primary] px-4 py-2.5 text-[13px] font-medium text-white text-center transition-opacity hover:opacity-90"
        >
          Enter WorkSpace
        </Link>

        <p className="text-[11px] text-[--color-text-muted] opacity-60">
          Signed in as dev@workspace.local
        </p>
      </div>
    </div>
  );
}
