export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-background] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[--color-text-primary] tracking-tight">
            WorkSpace
          </h1>
          <p className="mt-1 text-sm text-[--color-text-muted]">
            Your personal execution system
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
