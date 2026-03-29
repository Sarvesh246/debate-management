import { SiteHeader } from "@/components/layout/site-header";
import { CapabilityHealthPanel } from "@/components/debate/client-panels";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppModeLabel } from "@/server/services/debate-access";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader appModeLabel={getAppModeLabel()} />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.22em] text-primary">Settings</p>
          <h1 className="font-heading text-4xl tracking-tight">Provider health and workspace defaults</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Review which capabilities are active, confirm the current operating mode, and adjust local display preferences.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <CapabilityHealthPanel />
          <Card className="border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>Display</CardTitle>
              <CardDescription>Theme and local environment status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <ThemeToggle />
              <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                Debate Command automatically degrades from provider-assisted generation to deterministic generation if provider calls fail or keys are missing.
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
