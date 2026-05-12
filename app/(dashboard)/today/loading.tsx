export default function TodayLoading() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-end justify-between px-6 pt-6 pb-4 border-b border-[--color-border-subtle]">
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-28 rounded bg-[--color-card]" />
          <div className="h-5 w-16 rounded bg-[--color-card]" />
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col gap-1 items-end">
            <div className="h-2 w-20 rounded bg-[--color-card]" />
            <div className="h-7 w-10 rounded bg-[--color-card]" />
          </div>
        </div>
      </div>

      {/* Body skeleton */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col gap-6 p-6 flex-1 border-r border-[--color-border-subtle]">
          {/* Section heading */}
          <div className="flex flex-col gap-2">
            <div className="h-2.5 w-24 rounded bg-[--color-card]" />
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-[--color-card]" />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-2.5 w-20 rounded bg-[--color-card]" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 rounded-md bg-[--color-card]" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 p-5 w-[280px]">
          <div className="flex flex-col gap-2">
            <div className="h-2.5 w-16 rounded bg-[--color-card]" />
            {[1, 2].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-[--color-card]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
