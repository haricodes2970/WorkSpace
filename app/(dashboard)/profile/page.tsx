import { Suspense } from "react";
import { requireSession as requireAuthUser } from "@/lib/auth/get-session";
import { getBuilderProfile } from "@/features/builder-profile/builder-profile.service";
import { ProfileSummary }    from "@/features/builder-profile/components/profile-summary";
import { EvolutionTimeline } from "@/features/temporal/components/evolution-timeline";
import { FocusSummary }      from "@/features/attention/components/focus-summary";
import { HealthPanel }       from "@/features/environment/components/health-panel";
import { AlignmentMap }      from "@/features/drift/components/alignment-map";
import { DensityControls }   from "@/features/environment/components/density-controls";
import { User }              from "lucide-react";

async function ProfileContent() {
  const user    = await requireAuthUser();
  const profile = await getBuilderProfile(user.profile.id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-[--color-primary]/10 flex items-center justify-center">
          <User className="h-6 w-6 text-[--color-primary]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[--color-text-primary]">
            {user.profile.name ?? "Builder Profile"}
          </h1>
          <p className="text-sm text-[--color-text-muted] mt-0.5">
            {user.profile.email}
          </p>
        </div>
      </div>

      {/* Stats + traits + execution */}
      <ProfileSummary profile={profile} />

      {/* Active projects summary */}
      {profile.stagingProjects.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[--color-text-muted]">
            In Execution
          </p>
          <div className="flex flex-col gap-1">
            {profile.stagingProjects.map((p) => (
              <a
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center gap-3 rounded-lg border border-[--color-border] bg-[--color-card] px-3 py-2 text-[12px] text-[--color-text-secondary] hover:text-[--color-text-primary] hover:border-[--color-primary]/30 transition-colors"
              >
                <span className="flex-1 truncate">{p.title}</span>
                {p.executionState && (
                  <span className="text-[10px] font-mono text-[--color-text-muted]">
                    {p.executionState.replace("_", " ")}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Intelligence panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[--color-border] bg-[--color-card] p-4">
          <FocusSummary />
        </div>
        <div className="rounded-lg border border-[--color-border] bg-[--color-card] p-4">
          <AlignmentMap />
        </div>
      </div>

      <div className="rounded-lg border border-[--color-border] bg-[--color-card] p-4">
        <EvolutionTimeline />
      </div>

      <div className="rounded-lg border border-[--color-border] bg-[--color-card] p-4">
        <HealthPanel />
      </div>

      {/* Environment preferences */}
      <div className="flex items-center justify-between rounded-lg border border-[--color-border] bg-[--color-card] px-4 py-3">
        <DensityControls />
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-[--color-card]" />
        <div className="space-y-2">
          <div className="h-5 w-36 rounded bg-[--color-card]" />
          <div className="h-3 w-48 rounded bg-[--color-card]" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-[--color-card]" />
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
