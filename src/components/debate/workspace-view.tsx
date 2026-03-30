"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowRight, ExternalLink, FileOutput, Pin } from "lucide-react";
import { toast } from "sonner";
import {
  buildModules,
  primaryWorkspacePillars,
  secondaryWorkspaceTools,
  type BuildModule,
  type DebateWorkspaceRecord,
  type EvidenceCard,
  type WorkspaceOverlay,
  type WorkspacePillar,
  type WorkspaceTool,
} from "@/features/debates/types";
import {
  getOpponentPressureFactItems,
  getRebuttalQuestionItems,
  getSupportingFactItems,
  type LinkedFactItem,
  type RebuttalQuestionItem,
} from "@/features/debates/fact-bank";
import {
  getEffectiveLiveArguments,
  getEffectiveLiveRebuttals,
  getEffectiveSpeechContent,
  getEffectiveTrapQuestions,
  hasWorkspaceOverlayCustomizations,
  normalizeWorkspaceOverlay,
} from "@/features/debates/workspace-overlay";
import {
  audienceLabels,
  buildModuleLabels,
  defaultBuildModule,
  formatLabels,
  pillarLabels,
  toolLabels,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PracticeModePanel, RerunDebateButton, SourceReviewPanel } from "@/components/debate/client-panels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

export function WorkspaceView({
  debate,
  pillar,
}: {
  debate: DebateWorkspaceRecord;
  pillar: WorkspacePillar;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSaving, startTransition] = useTransition();
  const [overlay, setOverlay] = useState(() =>
    normalizeWorkspaceOverlay(debate.workspaceOverlay, debate.workspaceSnapshot),
  );

  const workingDebate = useMemo(
    () => ({ ...debate, workspaceOverlay: overlay }),
    [debate, overlay],
  );
  const activeTool = readTool(searchParams.get("tool"));
  const activeModule = readModule(searchParams.get("module"));
  const evidenceCards = readEvidence(searchParams.get("evidence"), debate.workspaceSnapshot.evidenceCards);
  const drawerOpen = Boolean(activeTool) || evidenceCards.length > 0;
  const winningPath = overlay.selectedWinningPath || debate.workspaceSnapshot.framing.winningFramework;
  const liveArguments = getEffectiveLiveArguments(workingDebate);
  const liveRebuttals = getEffectiveLiveRebuttals(workingDebate);
  const trapQuestions = getEffectiveTrapQuestions(workingDebate);
  const supportingFacts = useMemo(() => getSupportingFactItems(workingDebate), [workingDebate]);
  const opponentPressureFacts = useMemo(() => getOpponentPressureFactItems(workingDebate), [workingDebate]);
  const rebuttalQuestions = useMemo(() => getRebuttalQuestionItems(workingDebate), [workingDebate]);

  function replaceQuery(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  function saveOverlay(next: WorkspaceOverlay, message = "Could not save your changes.") {
    setOverlay(next);
    startTransition(async () => {
      const response = await fetch(`/api/debates/${debate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceOverlay: next }),
      });
      if (!response.ok) {
        toast.error(message);
      }
    });
  }

  const layoutClass = drawerOpen
    ? "xl:grid-cols-[220px_minmax(0,1fr)_360px]"
    : "xl:grid-cols-[220px_minmax(0,1fr)]";

  return (
    <>
      <div className={cn("grid gap-6", layoutClass)}>
        <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
          <Card className="border-border/70 bg-card/75">
            <CardHeader className="space-y-3">
              <div className="text-xs uppercase tracking-[0.22em] text-primary">Command center</div>
              <CardTitle className="font-heading text-2xl">{debate.title}</CardTitle>
              <CardDescription className="text-sm leading-6">{debate.resolution}</CardDescription>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{formatLabels[debate.format]}</Badge>
                <Badge variant="secondary">{audienceLabels[debate.audienceLevel]}</Badge>
                <Badge variant="secondary">
                  {debate.generationMode === "deterministic" ? "Deterministic mode" : "Provider-assisted"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2">
              {primaryWorkspacePillars.map((item) => (
                <Link
                  key={item}
                  href={`/debates/${debate.id}/${item}`}
                  className={cn(
                    "rounded-2xl px-3 py-2.5 text-sm transition",
                    item === pillar
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/60 text-muted-foreground hover:bg-background hover:text-foreground",
                  )}
                >
                  {pillarLabels[item]}
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/65">
            <CardHeader>
              <CardTitle className="text-base">Tools</CardTitle>
              <CardDescription>Open utility panels without leaving this pillar.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {secondaryWorkspaceTools.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={activeTool === item ? "default" : "outline"}
                  className="justify-between"
                  onClick={() => replaceQuery({ tool: activeTool === item ? null : item, evidence: null })}
                >
                  {toolLabels[item]}
                  <ArrowRight className="size-4" />
                </Button>
              ))}
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-6">
          <Card className="border-border/70 bg-card/80 shadow-xl shadow-primary/5">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-[0.22em] text-primary">{pillarLabels[pillar]}</div>
                  <CardTitle className="font-heading text-4xl tracking-tight">
                    {pillar === "understand"
                      ? "See the round clearly."
                      : pillar === "build"
                        ? "Shape the case you will actually use."
                        : pillar === "practice"
                          ? "Pressure-test the working case."
                          : "Run the round from one clean live sheet."}
                  </CardTitle>
                  <CardDescription className="max-w-3xl text-sm leading-6">
                    {winningPath}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                    {isSaving ? "Saving changes" : hasWorkspaceOverlayCustomizations(overlay) ? "Working layer customized" : "Using baseline model"}
                  </div>
                  <RerunDebateButton debateId={debate.id} />
                </div>
              </div>
              {debate.degradationReason ? (
                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
                  <div className="mb-1 font-medium">Deterministic mode is active.</div>
                  {debate.degradationReason}
                </div>
              ) : null}
            </CardHeader>
          </Card>

          {pillar === "understand" ? (
            <div className="grid gap-4">
              <Surface title="Round brief" description={debate.workspaceSnapshot.analysis.whatThisDebateIsReallyAbout}>
                <SimpleList
                  items={[
                    `Winning criteria: ${debate.workspaceSnapshot.analysis.likelyWinningCriteria.slice(0, 3).join(" • ")}`,
                    `Primary clash: ${debate.workspaceSnapshot.analysis.keyClashPoints[0] ?? "No clash detected yet."}`,
                    `Best framing move: ${debate.workspaceSnapshot.framing.winningFramework}`,
                  ]}
                />
              </Surface>
              <div className="grid gap-4 lg:grid-cols-2">
                <Surface title="Criteria stack" description="These are the standards most likely to decide the round.">
                  <SimpleList items={debate.workspaceSnapshot.criteria.slice(0, 5).map((criterion) => `${criterion.name}: ${criterion.explanation}`)} />
                </Surface>
                <Surface title="Recommended actions" description="Use these moves to keep the round focused.">
                  <SimpleList items={debate.workspaceSnapshot.framing.steeringAdvice} />
                </Surface>
              </div>
            </div>
          ) : null}

          {pillar === "build" ? (
            <div className="space-y-6">
              <Surface title="Working strategy layer" description="Edit your speaking layer here while the source-backed baseline stays intact.">
                <Textarea
                  rows={3}
                  value={overlay.selectedWinningPath ?? ""}
                  onChange={(event) =>
                    saveOverlay(
                      { ...overlay, selectedWinningPath: event.target.value },
                      "Could not update the winning path.",
                    )
                  }
                  placeholder="Summarize the path you want to keep returning to in the round."
                />
              </Surface>

              <Surface
                title="Fast facts and rebuttal questions"
                description="Use this section when you need direct, source-linked proof faster than the full evidence library."
              >
                <div className="grid gap-4 xl:grid-cols-3">
                  <FactColumn
                    title={`Support for ${debate.mySide}`}
                    description="Direct facts you can cite in favor of your side."
                    items={supportingFacts}
                    emptyState="No direct fact snippets are available yet. Open Sources and import stronger excerpts if you need cleaner citations."
                    onOpenEvidence={(evidenceCardId) => replaceQuery({ evidence: evidenceCardId, tool: null })}
                  />
                  <FactColumn
                    title={`Pressure points on ${debate.opponentSide}`}
                    description="Facts that help you attack the opponent's case directly."
                    items={opponentPressureFacts}
                    emptyState="No rebuttal-linked fact snippets are available yet. Re-run retrieval or import stronger counter-evidence."
                    onOpenEvidence={(evidenceCardId) => replaceQuery({ evidence: evidenceCardId, tool: null })}
                  />
                  <QuestionColumn
                    title="Rebuttal questions"
                    description="Ask these when you want concessions or force their weakest comparison."
                    items={rebuttalQuestions}
                  />
                </div>
              </Surface>

              <div className="flex flex-wrap gap-2">
                {buildModules.map((module) => (
                  <Button
                    key={module}
                    type="button"
                    variant={module === activeModule ? "default" : "outline"}
                    onClick={() => replaceQuery({ module })}
                  >
                    {buildModuleLabels[module]}
                  </Button>
                ))}
              </div>

              {renderBuildModule({
                debate: workingDebate,
                overlay,
                activeModule,
                onSave: saveOverlay,
                onOpenEvidence: (ids) => replaceQuery({ evidence: ids.join(","), tool: null }),
              })}
            </div>
          ) : null}

          {pillar === "practice" ? (
            <div className="space-y-4">
              <Surface title="Practice focus" description="Use your current winning path and working phrasing before you worry about polish.">
                <SimpleList items={[winningPath, ...liveArguments.slice(0, 2)]} />
              </Surface>
              <PracticeModePanel debate={workingDebate} />
            </div>
          ) : null}

          {pillar === "live" ? (
            <div className="space-y-4">
              <Surface title="Live round brief" description={winningPath}>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => replaceQuery({ tool: "export", evidence: null })}>
                    Open export
                  </Button>
                  <Button type="button" variant="outline" onClick={() => replaceQuery({ tool: "sources", evidence: null })}>
                    Open sources
                  </Button>
                </div>
              </Surface>
              <div className="grid gap-4 lg:grid-cols-2">
                <Surface title="Top arguments" description="Lead with these first.">
                  <SimpleList items={liveArguments} />
                </Surface>
                <Surface title="Quickest rebuttals" description="Keep these short and comparative.">
                  <SimpleList items={liveRebuttals} />
                </Surface>
                <Surface title="Trap questions" description="Use these to force concessions.">
                  <SimpleList items={trapQuestions} />
                </Surface>
                <Surface title="Emergency fallback lines" description="Use these if you get knocked off script.">
                  <SimpleList items={debate.workspaceSnapshot.liveSheet.emergencyFallbackLines} />
                </Surface>
              </div>
            </div>
          ) : null}
        </main>

        {drawerOpen ? (
          <aside className="hidden xl:block xl:sticky xl:top-24 xl:h-[calc(100vh-7rem)]">
            <DrawerCard debate={workingDebate} tool={activeTool} evidenceCards={evidenceCards} />
          </aside>
        ) : null}
      </div>

      <Sheet open={drawerOpen} onOpenChange={(open) => !open && replaceQuery({ tool: null, evidence: null })}>
        <SheetContent side="bottom" className="h-[82vh] gap-0 xl:hidden">
          <SheetHeader>
            <SheetTitle>{activeTool ? toolLabels[activeTool] : "Evidence"}</SheetTitle>
            <SheetDescription>
              {activeTool ? "Utility tools stay here so the main debate flow stays clean." : "Inspect the linked evidence without leaving the current pillar."}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 px-4 pb-4">
            <DrawerBody debate={workingDebate} tool={activeTool} evidenceCards={evidenceCards} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function FactColumn({
  title,
  description,
  items,
  emptyState,
  onOpenEvidence,
}: {
  title: string;
  description: string;
  items: LinkedFactItem[];
  emptyState: string;
  onOpenEvidence: (evidenceCardId: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/55 p-4">
      <div className="mb-4 space-y-1">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm leading-6 text-muted-foreground">{emptyState}</p>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id} className="border-border/70 bg-card/75">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.heading}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {item.credibilityLabel}
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-6 text-foreground">{item.fact}</p>
                <p className="text-sm leading-6 text-muted-foreground">{item.note}</p>
                <div className="rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                  {item.organization} | {item.sourceTitle}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                      Open source
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenEvidence(item.evidenceCardId)}
                  >
                    See evidence
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionColumn({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: RebuttalQuestionItem[];
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/55 p-4">
      <div className="mb-4 space-y-1">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <Card key={item.id} className="border-border/70 bg-card/75">
            <CardContent className="space-y-3 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {item.typeLabel}
              </div>
              <div className="text-sm font-medium leading-6 text-foreground">{item.question}</div>
              <p className="text-sm leading-6 text-muted-foreground">{item.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function renderBuildModule({
  debate,
  overlay,
  activeModule,
  onSave,
  onOpenEvidence,
}: {
  debate: DebateWorkspaceRecord;
  overlay: WorkspaceOverlay;
  activeModule: BuildModule;
  onSave: (overlay: WorkspaceOverlay, message?: string) => void;
  onOpenEvidence: (ids: string[]) => void;
}) {
  if (activeModule === "case") {
    return (
      <Surface title="Core case" description="Pin the arguments and phrasing you actually want to carry into live mode.">
        <div className="grid gap-4">
          {debate.workspaceSnapshot.myArguments.map((argument) => (
            <Card key={argument.id} className="border-border/70 bg-background/60">
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{argument.confidenceLabel}</Badge>
                      <Badge variant="secondary">{argument.vulnerabilityLabel}</Badge>
                    </div>
                    <div className="font-medium">{argument.title}</div>
                    <p className="text-sm leading-6 text-muted-foreground">{argument.claim}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={overlay.pinnedArgumentIds.includes(argument.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        onSave({
                          ...overlay,
                          pinnedArgumentIds: toggleId(overlay.pinnedArgumentIds, argument.id),
                          liveSheetOrder: {
                            ...overlay.liveSheetOrder,
                            argumentIds: dedupe([...overlay.liveSheetOrder.argumentIds, argument.id]),
                          },
                        }, "Could not update pinned arguments.")
                      }
                    >
                      <Pin className="size-4" />
                      Pin
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => onOpenEvidence(argument.evidenceCardIds)}>
                      See evidence
                    </Button>
                  </div>
                </div>
                <Textarea
                  rows={3}
                  value={overlay.simplifiedPhrasing[argument.id] ?? argument.simpleVersion}
                  onChange={(event) =>
                    onSave({
                      ...overlay,
                      simplifiedPhrasing: {
                        ...overlay.simplifiedPhrasing,
                        [argument.id]: event.target.value,
                      },
                      selectedWinningPath: overlay.selectedWinningPath ?? event.target.value,
                    }, "Could not update working phrasing.")
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </Surface>
    );
  }

  if (activeModule === "opponent") {
    return (
      <Surface title="Opponent and rebuttals" description="Keep the opposing case and your answer in one place.">
        <div className="grid gap-4">
          {debate.workspaceSnapshot.opponentArguments.map((argument) => {
            const rebuttal = debate.workspaceSnapshot.rebuttals.find((item) => item.targetArgumentId === argument.id);
            return (
              <Card key={argument.id} className="border-border/70 bg-background/60">
                <CardContent className="space-y-3 p-4">
                  <div className="font-medium">{argument.title}</div>
                  <p className="text-sm leading-6 text-muted-foreground">{argument.claim}</p>
                  {rebuttal ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{rebuttal.classification.replaceAll("_", " ")}</Badge>
                        <Button
                          type="button"
                          variant={overlay.pinnedRebuttalIds.includes(rebuttal.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            onSave({
                              ...overlay,
                              pinnedRebuttalIds: toggleId(overlay.pinnedRebuttalIds, rebuttal.id),
                              liveSheetOrder: {
                                ...overlay.liveSheetOrder,
                                rebuttalIds: dedupe([...overlay.liveSheetOrder.rebuttalIds, rebuttal.id]),
                              },
                            }, "Could not update the rebuttal pin.")
                          }
                        >
                          <Pin className="size-4" />
                          Pin rebuttal
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => onOpenEvidence(rebuttal.bestEvidenceIds)}>
                          See evidence
                        </Button>
                      </div>
                      <p className="text-sm leading-6 text-foreground">{rebuttal.shortRebuttal}</p>
                      <p className="text-sm leading-6 text-muted-foreground">{rebuttal.mediumRebuttal}</p>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Surface>
    );
  }

  if (activeModule === "vulnerabilities") {
    return (
      <Surface title="Vulnerabilities" description="This stays baseline and evidence-grounded, so the warnings remain honest.">
        <SimpleList items={debate.workspaceSnapshot.vulnerabilities.map((item) => `${item.issue} — ${item.recommendedFix}`)} />
      </Surface>
    );
  }

  if (activeModule === "cross_ex") {
    return (
      <Surface title="Cross-ex" description="Promote the best trap questions into live mode.">
        <div className="grid gap-3">
          {debate.workspaceSnapshot.crossExam.map((item) => (
            <Card key={item.id} className="border-border/70 bg-background/60">
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge variant="secondary">{item.type.replaceAll("_", " ")}</Badge>
                  {item.type === "trap" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onSave({
                          ...overlay,
                          liveSheetOrder: {
                            ...overlay.liveSheetOrder,
                            trapQuestionIds: dedupe([...overlay.liveSheetOrder.trapQuestionIds, item.id]),
                          },
                        }, "Could not add the trap question to live mode.")
                      }
                    >
                      Add to live
                    </Button>
                  ) : null}
                </div>
                <div className="font-medium">{item.question}</div>
                <p className="text-sm leading-6 text-muted-foreground">{item.answerShort}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Surface>
    );
  }

  return (
    <Surface title="Speech drafts" description="Edit the speaking layer here. The baseline draft remains preserved behind it.">
      <div className="grid gap-4">
        {debate.workspaceSnapshot.speechDrafts.map((draft) => (
          <Card key={draft.id} className="border-border/70 bg-background/60">
            <CardHeader>
              <CardTitle className="text-base capitalize">{draft.type}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={10}
                value={getEffectiveSpeechContent(debate, draft.type)}
                onChange={(event) =>
                  onSave({
                    ...overlay,
                    speechEdits: {
                      ...overlay.speechEdits,
                      [draft.type]: event.target.value,
                    },
                  }, "Could not save the speech draft.")
                }
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </Surface>
  );
}

function DrawerCard({
  debate,
  tool,
  evidenceCards,
}: {
  debate: DebateWorkspaceRecord;
  tool: WorkspaceTool | null;
  evidenceCards: EvidenceCard[];
}) {
  return (
    <Card className="flex h-full flex-col border-border/70 bg-card/75">
      <CardHeader>
        <CardTitle>{tool ? toolLabels[tool] : "Evidence"}</CardTitle>
        <CardDescription>
          {tool ? "Open the utility without leaving the main workflow." : "Inspect the linked evidence for the current claim."}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        <DrawerBody debate={debate} tool={tool} evidenceCards={evidenceCards} />
      </CardContent>
    </Card>
  );
}

function DrawerBody({
  debate,
  tool,
  evidenceCards,
}: {
  debate: DebateWorkspaceRecord;
  tool: WorkspaceTool | null;
  evidenceCards: EvidenceCard[];
}) {
  if (tool === "sources") {
    return <ScrollArea className="h-full"><SourceReviewPanel sources={debate.workspaceSnapshot.sourceDocuments} /></ScrollArea>;
  }
  if (tool === "judge") {
    return (
      <ScrollArea className="h-full pr-2">
        <div className="space-y-4">
          {hasWorkspaceOverlayCustomizations(debate.workspaceOverlay) ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
              Judge mode stays grounded in the baseline evidence-backed model, even when the working layer has custom edits.
            </div>
          ) : null}
          <Surface title="Current lean" description={debate.workspaceSnapshot.judgeSummary.honestAssessment}>
            <Badge>{debate.workspaceSnapshot.judgeSummary.winnerLean.replaceAll("_", " ")}</Badge>
          </Surface>
          <Surface title="Framework breakdown" description="How a fair judge is likely to weigh the round.">
            <SimpleList items={debate.workspaceSnapshot.judgeSummary.frameworkBreakdown} />
          </Surface>
        </div>
      </ScrollArea>
    );
  }
  if (tool === "export") {
    return (
      <div className="grid gap-3">
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
      </div>
    );
  }

  if (evidenceCards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-background/50 p-6 text-sm text-muted-foreground">
        Open a “See evidence” action from the command center to inspect source-backed claims here.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full pr-2">
      <div className="space-y-4">
        {evidenceCards.map((card) => (
          <Card key={card.id} className="border-border/70 bg-background/60">
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap gap-2">
                <Badge>{card.credibilityLabel}</Badge>
                <Badge variant="secondary">{card.confidenceLabel}</Badge>
              </div>
              <div className="font-medium">{card.supportedClaim}</div>
              {card.claimUnits.map((unit) => (
                <div key={unit.id}>
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{unit.layer}</div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{unit.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

function Surface({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-sm leading-6">{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SimpleList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
      {items.map((item) => (
        <div key={item} className="flex gap-2">
          <span className="mt-1 text-primary">•</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function readTool(value: string | null): WorkspaceTool | null {
  return secondaryWorkspaceTools.includes(value as WorkspaceTool) ? (value as WorkspaceTool) : null;
}

function readModule(value: string | null): BuildModule {
  return buildModules.includes(value as BuildModule) ? (value as BuildModule) : defaultBuildModule;
}

function readEvidence(value: string | null, cards: EvidenceCard[]) {
  if (!value) return [];
  const ids = value.split(",").filter(Boolean);
  return cards.filter((card) => ids.includes(card.id));
}

function toggleId(values: string[], id: string) {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
}

function dedupe(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}
