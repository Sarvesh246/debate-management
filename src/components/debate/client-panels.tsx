"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2, RefreshCcw, Search, Send } from "lucide-react";
import type {
  CapabilitySnapshot,
  DebateWorkspaceRecord,
  PracticeRound,
  PracticeSessionRecord,
  SourceDocument,
} from "@/features/debates/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

async function getCapabilities() {
  const response = await fetch("/api/capabilities");
  return (await response.json()) as CapabilitySnapshot;
}

export function CapabilityHealthPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["capabilities"],
    queryFn: getCapabilities,
  });

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Checking provider health...
        </CardContent>
      </Card>
    );
  }

  const rows = [
    data.publicRetrieval,
    data.providerDiscovery,
    data.structuredSynthesis,
    data.practiceSimulationDepth,
    data.persistence,
  ];

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Capability health</CardTitle>
        <CardDescription>
          Cogent adapts to the providers and storage you have connected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-2xl border border-border/70 bg-background/60 p-4"
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="font-medium">{row.label}</div>
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {row.status}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{row.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RerunDebateButton({ debateId }: { debateId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        setPending(true);
        await fetch(`/api/debates/${debateId}/rerun`, { method: "POST" });
        setPending(false);
        router.refresh();
      }}
      disabled={pending}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
      Re-run with current providers
    </Button>
  );
}

export function SourceReviewPanel({ sources }: { sources: SourceDocument[] }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredSources = useMemo(() => {
    return sources.filter((source) => {
      const matchesFilter = filter === "all" ? true : source.credibilityLabel === filter;
      const matchesSearch =
        search.length === 0
          ? true
          : `${source.title} ${source.organization} ${source.excerpt}`
              .toLowerCase()
              .includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, search, sources]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            placeholder="Search sources, organizations, or excerpts"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All trust labels</SelectItem>
            <SelectItem value="High trust">High trust</SelectItem>
            <SelectItem value="Moderate trust">Moderate trust</SelectItem>
            <SelectItem value="Limited trust">Limited trust</SelectItem>
            <SelectItem value="Use with caution">Use with caution</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4">
        {filteredSources.length > 0 ? (
          filteredSources.map((source) => (
            <Card key={source.id} className="border-border/70 bg-card/75">
              <CardContent className="grid gap-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{source.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {source.organization} • {source.sourceType}
                    </div>
                  </div>
                  <div className="rounded-full border border-border/70 px-3 py-1 text-xs">
                    {source.credibilityLabel}
                  </div>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{source.excerpt}</p>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open source
                </a>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-dashed border-border/70 bg-card/50">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No sources matched the current filters. Relax the trust filter, widen source types, or import sources manually.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function PracticeModePanel({ debate }: { debate: DebateWorkspaceRecord }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [session, setSession] = useState<PracticeSessionRecord | null>(null);
  const [pending, setPending] = useState(false);
  const rounds = debate.workspaceSnapshot.practicePlan.rounds;
  const activeRound: PracticeRound | undefined = rounds[roundIndex];

  async function submitRound() {
    if (!activeRound || draft.trim().length === 0) return;

    const transcript = [
      { role: "coach" as const, text: "Practice round started." },
      ...rounds.slice(0, roundIndex + 1).flatMap((round, index) => [
        { role: "opponent" as const, text: round.prompt },
        {
          role: "user" as const,
          text: index === roundIndex ? draft : `Completed ${round.phase}.`,
        },
      ]),
    ];

    if (roundIndex < rounds.length - 1) {
      setDraft("");
      setRoundIndex((current) => current + 1);
      return;
    }

    setPending(true);
    const response = await fetch(`/api/debates/${debate.id}/practice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    const payload = (await response.json()) as PracticeSessionRecord;
    setSession(payload);
    setPending(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <Card className="border-border/70 bg-card/75">
        <CardHeader>
          <CardTitle>Round simulator</CardTitle>
          <CardDescription>
            Deterministic practice keeps pressure on framing, source use, and clarity even when no model is available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
            <div className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {activeRound?.phase.replace("_", " ")}
            </div>
            <div className="text-sm leading-6">{activeRound?.prompt}</div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="practice-answer">Your response</Label>
            <Textarea
              id="practice-answer"
              rows={8}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type the answer you would give in the round."
            />
          </div>
          <Button type="button" onClick={submitRound} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {roundIndex < rounds.length - 1 ? "Save and continue" : "Finish practice"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/75">
        <CardHeader>
          <CardTitle>Practice feedback</CardTitle>
          <CardDescription>
            Evidence-backed review appears here after the last round.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(session.score).map(([label, score]) => (
                  <div key={label} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      {label.replace(/([A-Z])/g, " $1")}
                    </div>
                    <div className="mt-2 text-3xl font-heading">{score}/10</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {session.feedback.map((item) => (
                  <div key={item} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm leading-6 text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-6 text-sm text-muted-foreground">
              Finish the practice prompts to generate a scored review.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
