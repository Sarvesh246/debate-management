import Link from "next/link";
import { AlertTriangle, ArrowUpRight, FileOutput, ShieldAlert, Swords, Zap } from "lucide-react";
import type { DebateWorkspaceRecord, WorkspaceSection } from "@/features/debates/types";
import { sectionLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PracticeModePanel, RerunDebateButton, SourceReviewPanel } from "@/components/debate/client-panels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function WorkspaceView({
  debate,
  section,
}: {
  debate: DebateWorkspaceRecord;
  section: WorkspaceSection;
}) {
  const snapshot = debate.workspaceSnapshot;

  return (
    <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
      <aside className="space-y-3 xl:sticky xl:top-24 xl:h-fit">
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Workspace</CardTitle>
            <CardDescription>{debate.title}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {(
              Object.keys(sectionLabels) as WorkspaceSection[]
            ).map((item) => (
              <Link
                key={item}
                href={`/debates/${debate.id}/${item}`}
                className={cn(
                  "rounded-2xl px-3 py-2 text-sm transition",
                  item === section
                    ? "bg-primary text-primary-foreground"
                    : "bg-background/60 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {sectionLabels[item]}
              </Link>
            ))}
          </CardContent>
        </Card>
      </aside>

      <main className="space-y-6">
        <Card className="border-border/70 bg-card/80 shadow-xl shadow-primary/5">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{debate.format.replaceAll("_", " ")}</Badge>
                  <Badge variant="secondary">{debate.audienceLevel.replaceAll("_", " ")}</Badge>
                  <Badge variant="secondary">
                    {debate.generationMode === "deterministic" ? "Deterministic mode" : "Provider-assisted"}
                  </Badge>
                </div>
                <div>
                  <CardTitle className="font-heading text-3xl">
                    {sectionLabels[section]}
                  </CardTitle>
                  <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
                    {debate.resolution}
                  </CardDescription>
                </div>
              </div>
              <RerunDebateButton debateId={debate.id} />
            </div>
            {debate.degradationReason ? (
              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
                <div className="mb-1 font-medium">Deterministic mode is active.</div>
                {debate.degradationReason}
              </div>
            ) : null}
          </CardHeader>
        </Card>

        {section === "overview" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <SummaryCard
              title="What this debate is really about"
              description={snapshot.analysis.whatThisDebateIsReallyAbout}
              icon={<Swords className="size-4" />}
            />
            <SummaryCard
              title="Top winning path"
              description={snapshot.framing.winningFramework}
              icon={<Zap className="size-4" />}
            />
            <SummaryCard
              title="Biggest risk"
              description={snapshot.vulnerabilities[0]?.issue ?? "No major weakness flagged yet."}
              icon={<ShieldAlert className="size-4" />}
            />
            <SummaryCard
              title="Primary clash"
              description={snapshot.analysis.keyClashPoints[0] ?? "No clash point detected yet."}
              icon={<AlertTriangle className="size-4" />}
            />
          </div>
        ) : null}

        {section === "strategy" ? (
          <div className="grid gap-6">
            <InfoCard title="Winning framework" body={snapshot.framing.winningFramework} />
            <InfoCard title="Opponent framework" body={snapshot.framing.opponentFramework} />
            <Card className="border-border/70 bg-card/75">
              <CardHeader>
                <CardTitle>Criteria ranking</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {snapshot.criteria.map((criterion) => (
                  <div key={criterion.id} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{criterion.name}</div>
                      <Badge variant="secondary">{criterion.favorableTo}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{criterion.explanation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {section === "arguments" ? <ArgumentGrid title="Your case" items={snapshot.myArguments} /> : null}
        {section === "opponent" ? <ArgumentGrid title="Likely opponent case" items={snapshot.opponentArguments} /> : null}

        {section === "rebuttals" ? (
          <Card className="border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>Rebuttal bank</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {snapshot.rebuttals.map((rebuttal) => (
                <div key={rebuttal.id} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge>{rebuttal.classification.replaceAll("_", " ")}</Badge>
                    <Badge variant="secondary">{rebuttal.bestEvidenceIds.length} evidence links</Badge>
                  </div>
                  <div className="grid gap-3 text-sm leading-6">
                    <strong>{rebuttal.shortRebuttal}</strong>
                    <p className="text-muted-foreground">{rebuttal.mediumRebuttal}</p>
                    <p className="text-muted-foreground">{rebuttal.longRebuttal}</p>
                    <Separator />
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Counter-counter:</span> {rebuttal.counterCounter}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {section === "vulnerabilities" ? (
          <Card className="border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>Vulnerability scan</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {snapshot.vulnerabilities.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="font-medium">{item.issue}</div>
                    <Badge variant={item.severity === "high" ? "destructive" : "secondary"}>
                      {item.severity}
                    </Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{item.explanation}</p>
                  <p className="mt-3 text-sm">
                    <span className="font-medium">Safer wording:</span> {item.recommendedFix}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {section === "cross-ex" ? (
          <Card className="border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>Cross-examination prep</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {snapshot.crossExam.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge>{item.type.replaceAll("_", " ")}</Badge>
                  </div>
                  <div className="space-y-2 text-sm leading-6">
                    <p className="font-medium">{item.question}</p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Short:</span> {item.answerShort}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Long:</span> {item.answerLong}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Note:</span> {item.note}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {section === "speech-builder" ? (
          <Card className="border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>Speech builder</CardTitle>
              <CardDescription>Speaking-ready drafts tied to the current evidence map.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {snapshot.speechDrafts.map((draft) => (
                <div key={draft.id} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="font-medium">{draft.type}</div>
                    <Badge variant="secondary">{draft.provenance}</Badge>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {draft.content}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {section === "live" ? (
          <Card className="border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>Live mode</CardTitle>
              <CardDescription>Condensed round-use view for mobile and time pressure.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <LiveBlock title="Top 3 arguments" items={snapshot.liveSheet.topArguments} />
              <LiveBlock title="Their top 3 likely arguments" items={snapshot.liveSheet.topOpponentArguments} />
              <LiveBlock title="Quickest rebuttals" items={snapshot.liveSheet.quickestRebuttals} />
              <LiveBlock title="Trap questions" items={snapshot.liveSheet.trapQuestions} />
              <LiveBlock title="Emergency fallback lines" items={snapshot.liveSheet.emergencyFallbackLines} />
            </CardContent>
          </Card>
        ) : null}

        {section === "sources" ? <SourceReviewPanel sources={snapshot.sourceDocuments} /> : null}

        {section === "judge" ? (
          <Card className="border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>Judge mode</CardTitle>
              <CardDescription>Balanced scoring instead of blind confirmation.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <SummaryCard title="Current lean" description={snapshot.judgeSummary.winnerLean} icon={<ArrowUpRight className="size-4" />} />
              <InfoCard title="Honest assessment" body={snapshot.judgeSummary.honestAssessment} />
              <LiveBlock title="Framework breakdown" items={snapshot.judgeSummary.frameworkBreakdown} />
              <LiveBlock title="Improvement advice" items={snapshot.judgeSummary.improvementAdvice} />
            </CardContent>
          </Card>
        ) : null}

        {section === "practice" ? <PracticeModePanel debate={debate} /> : null}

        {section === "export" ? (
          <Card className="border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>Export and print</CardTitle>
              <CardDescription>Generate clean packet views with the same structured debate data.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {[
                ["packet", "Full debate packet"],
                ["speech_only", "Speech-only export"],
                ["sources_only", "Sources and citations"],
                ["live_sheet", "Live cheat sheet"],
                ["judge_report", "Judge comparison report"],
              ].map(([kind, label]) => (
                <Button key={kind} asChild variant="outline" className="justify-between">
                  <Link href={`/debates/${debate.id}/print?kind=${kind}`}>
                    {label}
                    <FileOutput className="size-4" />
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </main>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
        <Card className="border-border/70 bg-card/75">
          <CardHeader>
            <CardTitle className="text-base">Source inspector</CardTitle>
            <CardDescription>Highest-trust documents attached to this workspace.</CardDescription>
          </CardHeader>
            <CardContent className="grid gap-3">
            {snapshot.sourceDocuments.length > 0 ? (
              snapshot.sourceDocuments.slice(0, 5).map((source) => (
                <div key={source.id} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="line-clamp-2 text-sm font-medium">{source.title}</div>
                    <Badge variant="secondary">{source.credibilityLabel}</Badge>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {source.organization} • {source.sourceType}
                  </p>
                  <p className="mt-2 line-clamp-4 text-sm leading-6 text-muted-foreground">
                    {source.excerpt}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
                No verified sources yet. Re-run with broader discovery or import sources directly.
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function SummaryCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 bg-card/75">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary/12 text-primary">
            {icon}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <Card className="border-border/70 bg-card/75">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function ArgumentGrid({
  title,
  items,
}: {
  title: string;
  items: DebateWorkspaceRecord["workspaceSnapshot"]["myArguments"];
}) {
  return (
      <Card className="border-border/70 bg-card/75">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {items.length > 0 ? (
            items.map((argument) => (
              <div key={argument.id} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge>{argument.confidenceLabel}</Badge>
                  <Badge variant="secondary">{argument.vulnerabilityLabel}</Badge>
                </div>
                <div className="mb-2 font-medium">{argument.title}</div>
                <p className="text-sm leading-6 text-muted-foreground">{argument.claim}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{argument.reasoning}</p>
                <Separator className="my-3" />
                <div className="grid gap-2 text-sm leading-6">
                  <p>
                    <span className="font-medium">Impact:</span> {argument.impact}
                  </p>
                  <p>
                    <span className="font-medium">Likely attack:</span> {argument.likelyOpponentAttack}
                  </p>
                  <p>
                    <span className="font-medium">Defense:</span> {argument.defense}
                  </p>
                  <p>
                    <span className="font-medium">Speaking version:</span> {argument.speakingShort}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-background/50 p-6 text-sm text-muted-foreground">
              No verified arguments are ready yet. Tighten source filters, import trusted sources, or rerun retrieval to build the argument bank.
            </div>
          )}
        </CardContent>
      </Card>
  );
}

function LiveBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="mb-2 font-medium">{title}</div>
      <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <div key={item}>• {item}</div>
        ))}
      </div>
    </div>
  );
}
