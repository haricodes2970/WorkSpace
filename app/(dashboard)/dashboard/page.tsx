import type { Metadata } from "next";
import { requireAuthUser } from "@/services/auth.service";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function DashboardStats() {
  const { profile } = await requireAuthUser();

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-semibold text-[--color-text-primary]">
          {profile.name ? `Good to see you, ${profile.name.split(" ")[0]}` : "Welcome back"}
        </h2>
        <p className="mt-1 text-sm text-[--color-text-muted]">
          Here&apos;s what&apos;s on your plate.
        </p>
      </div>

      {/* Stats grid — placeholder until real data wired */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(
          [
            { label: "Active Projects", value: "—" },
            { label: "Open Ideas", value: "—" },
            { label: "Tasks Due", value: "—" },
            { label: "Shipped", value: "—" },
          ] as const
        ).map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-[--color-border] bg-[--color-surface] p-4"
          >
            <p className="text-xs text-[--color-text-muted]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[--color-text-primary]">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent activity placeholder */}
      <div className="rounded-lg border border-[--color-border] bg-[--color-surface] p-6">
        <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
          Recent Activity
        </h3>
        <p className="text-sm text-[--color-text-muted]">
          Start by capturing your first idea.
        </p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-1 h-4 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-lg" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardStats />
    </Suspense>
  );
}
