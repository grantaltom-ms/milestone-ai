export default function Loading() {
  return (
    <main className="min-h-screen bg-paper">
      <div className="flex min-h-screen animate-pulse">
        <div className="w-[280px] min-h-screen border-r border-ink/12 bg-navy" />
        <div className="flex-1 p-8 space-y-8">
          <div className="h-10 w-48 rounded bg-ink/8" />
          <div className="h-64 rounded-lg bg-ink/8" />
          <div className="h-48 rounded-lg bg-ink/8" />
        </div>
      </div>
    </main>
  );
}
