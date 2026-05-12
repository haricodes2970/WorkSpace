export default function ProjectLoading() {
  return (
    <div className="flex h-full animate-pulse">
      {/* Main panel skeleton */}
      <div className="flex flex-col flex-1 p-6 gap-4 border-r border-[--color-border-subtle]">
        <div className="h-7 w-48 rounded bg-[--color-card]" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-20 rounded-full bg-[--color-card]" />
          ))}
        </div>
        <div className="flex flex-col gap-3 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-[--color-card]" />
          ))}
        </div>
      </div>
      {/* Right panel skeleton */}
      <div className="flex flex-col w-72 p-4 gap-4">
        <div className="h-28 rounded-lg bg-[--color-card]" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-md bg-[--color-card]" />
          ))}
        </div>
      </div>
    </div>
  );
}
