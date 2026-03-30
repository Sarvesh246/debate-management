"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { FolderClock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { DebateWorkspaceRecord } from "@/features/debates/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type DebateRow = Pick<
  DebateWorkspaceRecord,
  "id" | "title" | "resolution" | "format" | "audienceLevel" | "generationMode" | "updatedAt"
>;

export function RecentDebates({
  debates: initialDebates,
}: {
  debates: DebateWorkspaceRecord[] | DebateRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [debates, setDebates] = useState<DebateRow[]>(() =>
    initialDebates.map((d) => ({
      id: d.id,
      title: d.title,
      resolution: d.resolution,
      format: d.format,
      audienceLevel: d.audienceLevel,
      generationMode: d.generationMode,
      updatedAt: d.updatedAt,
    })),
  );
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pendingDebate = useMemo(
    () => debates.find((d) => d.id === pendingDeleteId),
    [debates, pendingDeleteId],
  );

  async function deleteOne(debateId: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/debates/${debateId}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not delete this debate.");
      }
      setDebates((prev) => prev.filter((d) => d.id !== debateId));
      setPendingDeleteId(null);
      toast.success("Debate deleted.");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAll() {
    setBusy(true);
    try {
      const response = await fetch("/api/debates", { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not delete debates.");
      }
      setDebates([]);
      setDeleteAllOpen(false);
      toast.success("All debates deleted.");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <p className="text-sm text-muted-foreground">
          {debates.length > 0 ? "Open a workspace or remove ones you no longer need." : null}
        </p>
        {debates.length > 0 ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={busy}
              onClick={() => setDeleteAllOpen(true)}
            >
              <Trash2 className="size-4" />
              Delete all
            </Button>
            <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all debates?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes every saved workspace for your account. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={busy}
                    onClick={(e) => {
                      e.preventDefault();
                      void deleteAll();
                    }}
                  >
                    Delete all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : null}
      </div>

      {debates.length > 0 ? (
        <div className="grid gap-4">
          {debates.map((debate) => (
            <div
              key={debate.id}
              className="flex flex-wrap items-stretch gap-2 rounded-3xl border border-border/70 bg-background/60 transition hover:border-primary/30"
            >
              <Link
                href={`/debates/${debate.id}/understand`}
                className="min-w-0 flex-1 p-5 transition hover:bg-background"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{debate.title}</div>
                    <div className="text-sm text-muted-foreground">{debate.resolution}</div>
                  </div>
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {debate.generationMode}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{debate.format.replaceAll("_", " ")}</span>
                  <span>&bull;</span>
                  <span>{debate.audienceLevel.replaceAll("_", " ")}</span>
                  <span>&bull;</span>
                  <span>{new Date(debate.updatedAt).toLocaleString()}</span>
                </div>
              </Link>
              <div className="flex items-start border-l border-border/60 p-2 sm:items-center sm:p-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={busy}
                  aria-label={`Delete ${debate.title}`}
                  onClick={() => setPendingDeleteId(debate.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border/70 bg-background/50 p-10 text-center">
          <FolderClock className="mx-auto mb-4 size-10 text-muted-foreground" />
          <div className="text-lg font-medium">Nothing saved yet</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Your first workspace will appear here after generation completes.
          </p>
        </div>
      )}

      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this debate?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDebate ? (
                <>
                  <span className="font-medium text-foreground">{pendingDebate.title}</span> will be removed
                  permanently. This cannot be undone.
                </>
              ) : (
                "This debate will be removed permanently."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy || !pendingDeleteId}
              onClick={(e) => {
                e.preventDefault();
                if (pendingDeleteId) {
                  void deleteOne(pendingDeleteId);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
