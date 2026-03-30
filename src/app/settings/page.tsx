import { ShieldAlert } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { CapabilityHealthPanel } from "@/components/debate/client-panels";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  canUseLocalWorkspaceMode,
  DEPLOYED_SUPABASE_CONFIG_ERROR,
  getMissingSupabaseServerEnvNames,
  isSupabaseConfigured,
} from "@/lib/env";
import {
  getDatabaseSetupGuidance,
  type DatabaseFailureKind,
} from "@/server/db/errors";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; kind?: string }>;
}) {
  const params = await searchParams;
  const needsSupabaseSetup =
    !isSupabaseConfigured() && !canUseLocalWorkspaceMode();
  const missingSupabaseEnvNames = getMissingSupabaseServerEnvNames();
  const databaseSetupKind = (params.kind ?? "unknown") as DatabaseFailureKind;
  const needsDatabaseSetup = params.setup === "database";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.22em] text-primary">Settings</p>
          <h1 className="font-heading text-4xl tracking-tight">Provider health and workspace defaults</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Review which capabilities are active, confirm the current operating mode, and adjust local display preferences.
          </p>
        </div>

        {needsSupabaseSetup ? (
          <Card className="border-amber-500/25 bg-amber-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-950 dark:text-amber-100">
                <ShieldAlert className="size-5" />
                Deployment setup required
              </CardTitle>
              <CardDescription className="text-amber-900/80 dark:text-amber-200/90">
                {DEPLOYED_SUPABASE_CONFIG_ERROR}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-amber-950 dark:text-amber-100">
              <p>
                The deployment still cannot see these variables:
              </p>
              <div className="rounded-2xl border border-amber-500/20 bg-background/70 p-4 font-mono text-xs leading-6 text-foreground">
                {missingSupabaseEnvNames.map((name) => (
                  <div key={name}>{name}</div>
                ))}
              </div>
              <p>Add them to this Vercel project, not just the team store, then redeploy.</p>
            </CardContent>
          </Card>
        ) : null}

        {needsDatabaseSetup ? (
          <Card className="border-amber-500/25 bg-amber-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-950 dark:text-amber-100">
                <ShieldAlert className="size-5" />
                Database setup issue
              </CardTitle>
              <CardDescription className="text-amber-900/80 dark:text-amber-200/90">
                The deployment can see your environment variables, but the first database query failed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-amber-950 dark:text-amber-100">
              <p>{getDatabaseSetupGuidance(databaseSetupKind)}</p>
              {databaseSetupKind === "schema" ? (
                <div className="rounded-2xl border border-amber-500/20 bg-background/70 p-4 font-mono text-xs leading-6 text-foreground">
                  npm run db:push
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

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
