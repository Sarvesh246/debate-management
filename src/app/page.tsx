import Link from "next/link";
import { ArrowRight, BrainCircuit, ShieldCheck, Sparkles, Swords } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  "What the round is really about (in plain terms)",
  "Evidence with sources, trust labels, and clear claims",
  "Opponent case, rebuttals, and where you might be weak",
  "Cross-ex questions, speech drafts, live sheet, and judge view",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="surface-grid overflow-hidden border-b border-border/70">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-18 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <FadeIn>
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm text-primary">
                <ShieldCheck className="size-4" />
                Source-backed prep with a built-in fallback
              </div>
              <div className="space-y-5">
                <h1 className="max-w-4xl font-heading text-5xl leading-[1.02] tracking-tight text-balance sm:text-6xl">
                  Cogent is for real debate prep—not a generic chatbot.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  Start from a resolution and both sides. Cogent builds a source-backed plan: what matters in the round, evidence you can cite, your case, counterarguments, speeches, and a simple live sheet for round day.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/debates/new">
                    Start a debate
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <div key={feature} className="rounded-2xl border border-border/70 bg-card/70 px-4 py-4 text-sm text-muted-foreground">
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            </FadeIn>

            <FadeIn delay={0.1} className="lg:pl-6">
              <Card className="overflow-hidden border-border/70 bg-card/80 shadow-2xl shadow-primary/10">
                <CardHeader className="border-b border-border/70 bg-background/50">
                  <CardTitle className="font-heading text-2xl">Sample round</CardTitle>
                  <CardDescription>
                    What is the best source of energy for the future? Natural gas vs Nuclear energy.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 p-6">
                  <Panel
                    icon={<BrainCircuit className="size-4" />}
                    title="What the debate is really about"
                    body="Reliability, affordability, emissions, deployment speed, and long-run risk. The round turns on which criteria the judge values first."
                  />
                  <Panel
                    icon={<Swords className="size-4" />}
                    title="Key clash"
                    body="Natural gas presses affordability and readiness. Nuclear presses reliability and emissions. The decisive move is how the framework orders near-term practicality versus long-run sustainability."
                  />
                  <Panel
                    icon={<Sparkles className="size-4" />}
                    title="Speaking-ready"
                    body="Opening speech, rebuttal bank, cross-ex traps, live sheet, and judge mode all stay synced to the same evidence map."
                  />
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-border/70 bg-card/75">
              <CardHeader>
                <CardTitle>How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>1. Define the resolution, sides, format, audience, and source strictness.</p>
                <p>2. The app analyzes likely criteria, builds research queries, and gathers source-backed evidence.</p>
                <p>3. It assembles arguments, rebuttals, speeches, judge analysis, and live-round materials.</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/75">
              <CardHeader>
                <CardTitle>Trust model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>Factual claims stay linked to evidence cards.</p>
                <p>Weak, stale, indirect, and unsupported points are labeled instead of hidden.</p>
                <p>If providers fail, deterministic mode takes over instead of collapsing the workspace.</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/75">
              <CardHeader>
                <CardTitle>Formats supported</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>Classroom debate, Public Forum, Lincoln-Douglas-inspired rounds, policy-style structures, and short timed debates.</p>
                <p>Each format profile changes framing emphasis, speech output, and practice prompts.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}

function Panel({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <span className="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        {title}
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}
