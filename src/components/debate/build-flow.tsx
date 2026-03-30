"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, Layers3, Sparkles, Swords, Zap } from "lucide-react";
import type { DebateWorkspaceRecord } from "@/features/debates/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StaggerItem } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";

const stageDelayMs = 450;

export function DebateBuildFlow({
  debate,
  initialReveal = true,
}: {
  debate: DebateWorkspaceRecord;
  initialReveal?: boolean;
}) {
  const [visibleStages, setVisibleStages] = useState(initialReveal ? 1 : 5);
  const stages = useMemo(
    () => [
      {
        title: "Round brief and criteria",
        summary:
          debate.workspaceSnapshot.analysis.whatThisDebateIsReallyAbout,
        details: debate.workspaceSnapshot.analysis.likelyWinningCriteria
          .slice(0, 3)
          .join(" • "),
        icon: <Layers3 className="size-4" />,
      },
      {
        title: "Evidence retrieval and trust status",
        summary:
          debate.workspaceSnapshot.sourceDocuments.length > 0
            ? `${debate.workspaceSnapshot.sourceDocuments.length} sources attached with visible trust labels.`
            : "No source documents landed; deterministic analysis is still available.",
        details:
          debate.workspaceSnapshot.sourceDocuments[0]?.organization ??
          "Broaden source preferences or import sources manually if needed.",
        icon: <Sparkles className="size-4" />,
      },
      {
        title: "Argument construction",
        summary:
          debate.workspaceSnapshot.myArguments[0]?.title ??
          "Core arguments are ready to review.",
        details:
          debate.workspaceSnapshot.myArguments[0]?.simpleVersion ??
          "Use the build workspace to refine the case.",
        icon: <Swords className="size-4" />,
      },
      {
        title: "Rebuttals and vulnerabilities",
        summary:
          debate.workspaceSnapshot.rebuttals[0]?.shortRebuttal ??
          "Rebuttal and risk analysis is ready.",
        details:
          debate.workspaceSnapshot.vulnerabilities[0]?.issue ??
          "No major vulnerability is flagged yet.",
        icon: <Zap className="size-4" />,
      },
      {
        title: "Live packet readiness",
        summary:
          debate.workspaceSnapshot.liveSheet.closingLine,
        details:
          debate.generationMode === "deterministic"
            ? "Built-in mode is active. Your full workspace is still available."
            : "Provider-assisted polish is active. Review and adjust the working overlay as needed.",
        icon: <CheckCircle2 className="size-4" />,
      },
    ],
    [debate],
  );

  useEffect(() => {
    if (!initialReveal || visibleStages >= stages.length) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setVisibleStages((current) => Math.min(stages.length, current + 1));
    }, stageDelayMs);

    return () => window.clearTimeout(timeout);
  }, [initialReveal, stages.length, visibleStages]);

  const progress = (visibleStages / stages.length) * 100;
  const complete = visibleStages >= stages.length;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{debate.format.replaceAll("_", " ")}</Badge>
          <Badge variant="secondary">{debate.audienceLevel.replaceAll("_", " ")}</Badge>
          <Badge variant="secondary">
            {debate.generationMode === "deterministic" ? "Deterministic mode" : "Provider-assisted"}
          </Badge>
        </div>
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.22em] text-primary">Build flow</p>
          <h1 className="font-heading text-4xl tracking-tight">Getting your workspace ready</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Your debate workspace is prepared. This screen walks through the brief, sources, your case, rebuttals, and round-day prep in a sensible order.
          </p>
        </div>
      </div>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="font-heading text-2xl">{debate.title}</CardTitle>
              <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
                {debate.resolution}
              </CardDescription>
            </div>
            <div className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
              {complete ? "Ready to use" : "Revealing debate packet"}
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={progress} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{visibleStages} of {stages.length} stages visible</span>
              <span>{complete ? "Workspace ready" : "Preparing the next stage"}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {stages.map((stage, index) => {
          const isVisible = index < visibleStages;
          const isNext = index === visibleStages;

          return (
            <StaggerItem key={stage.title} index={index}>
            <Card
              className={`border-border/70 transition-colors ${
                isVisible
                  ? "bg-card/80"
                  : "bg-card/40 text-muted-foreground"
              }`}
            >
              <CardContent className="flex items-start gap-4 p-5">
                <div
                  className={`mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl ${
                    isVisible ? "bg-primary/12 text-primary" : "bg-background/80 text-muted-foreground"
                  }`}
                >
                  {isVisible ? stage.icon : <Clock3 className="size-4" />}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium text-foreground">{stage.title}</div>
                    <Badge variant={isVisible ? "secondary" : "outline"}>
                      {isVisible ? "Ready" : isNext ? "Next" : "Queued"}
                    </Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {isVisible ? stage.summary : "This stage will open automatically."}
                  </p>
                  {isVisible ? (
                    <p className="text-sm leading-6 text-foreground/80">{stage.details}</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
            </StaggerItem>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href={`/debates/${debate.id}/understand`}>
            Open workspace
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href={`/debates/${debate.id}/build?module=case`}>
            Go straight to build mode
          </Link>
        </Button>
      </div>
    </div>
  );
}
