export default function KnowledgeLoading() {
  return (
    <div className="p-6 max-w-5xl animate-pulse">
      <div className="h-6 w-32 rounded bg-[--color-card] mb-6" />
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-[--color-card]" />
        ))}
      </div>
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-7 w-20 rounded-full bg-[--color-card]" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-[--color-card]" />
        ))}
      </div>
    </div>
  );
}
