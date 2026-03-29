import { DebateSetupWizard } from "@/components/debate/setup-wizard";
import { SiteHeader } from "@/components/layout/site-header";
import { getAppModeLabel } from "@/server/services/debate-access";

export default function NewDebatePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader appModeLabel={getAppModeLabel()} />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.22em] text-primary">New debate</p>
          <h1 className="font-heading text-4xl tracking-tight">Configure the round once, then let the system build the packet.</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Debate Command turns the setup into criteria, evidence retrieval, argument construction, rebuttals, judge analysis, and live-round prep. If provider-backed synthesis is unavailable, the deterministic engine takes over automatically.
          </p>
        </div>
        <DebateSetupWizard />
      </main>
    </div>
  );
}
