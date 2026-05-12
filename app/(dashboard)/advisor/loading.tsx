export function AdvisorSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-6 w-40 rounded bg-white/10" />
        <div className="h-3 w-28 rounded bg-white/5" />
      </div>
      {/* Tab bar */}
      <div className="h-10 rounded-lg bg-white/5" />
      {/* Cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-white/5" />
      ))}
    </div>
  );
}

export default function AdvisorLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <AdvisorSkeleton />
    </div>
  );
}
