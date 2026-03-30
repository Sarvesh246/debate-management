export default function DebateLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-28 rounded-full bg-muted" />
        <div className="h-12 w-full max-w-2xl rounded-3xl bg-muted/70" />
        <div className="h-5 w-full max-w-3xl rounded-full bg-muted/60" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <div className="h-64 rounded-3xl border border-border/70 bg-card/60" />
        <div className="space-y-4">
          <div className="h-56 rounded-3xl border border-border/70 bg-card/60" />
          <div className="h-64 rounded-3xl border border-border/70 bg-card/60" />
        </div>
      </div>
    </div>
  );
}
