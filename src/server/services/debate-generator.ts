import { nanoid } from "nanoid";
import { buildResearchQueries, buildWorkspaceSnapshot } from "@/features/debates/deterministic-engine";
import { getDegradationReason } from "@/server/capabilities/service";
import { enhanceSnapshotWithModel } from "@/server/providers/model";
import { discoverSources } from "@/server/providers/search";
import type {
  DebateRunRecord,
  DebateSetupInput,
  DebateWorkspaceRecord,
  DebateWorkspaceSnapshot,
} from "@/features/debates/types";

function createTitle(input: DebateSetupInput) {
  return `${input.mySide} vs ${input.opponentSide}`;
}

export async function generateDebateWorkspace(
  input: DebateSetupInput,
  userId: string,
) {
  const now = new Date().toISOString();
  const baselineSnapshot = buildWorkspaceSnapshot(input, []);
  const queries = buildResearchQueries(input, baselineSnapshot.criteria);
  const sources = await discoverSources(queries, input);
  const deterministicSnapshot = buildWorkspaceSnapshot(input, sources);
  const enhancement = await enhanceSnapshotWithModel(input, deterministicSnapshot);

  const record: DebateWorkspaceRecord = {
    id: nanoid(),
    userId,
    title: createTitle(input),
    resolution: input.resolution,
    mySide: input.mySide,
    opponentSide: input.opponentSide,
    format: input.format,
    audienceLevel: input.audienceLevel,
    timeLimits: {
      speech: input.speechTimeMinutes,
      rebuttal: input.rebuttalTimeMinutes,
      crossExam: input.crossExamTimeMinutes,
    },
    sourcePreferences: {
      mode: input.sourcePreferenceMode,
      allowedSourceTypes: input.allowedSourceTypes,
      whitelist: input.sourceWhitelist,
      blacklist: input.sourceBlacklist,
    },
    trustMode: input.trustMode,
    regionContext: input.regionContext,
    toneStyle: input.toneStyle,
    objectiveMode: input.objectiveMode,
    status: enhancement.providerStatus === "degraded" ? "degraded" : "generated",
    generationMode: enhancement.generationMode,
    providerStatus: enhancement.providerStatus,
    degradationReason: enhancement.degradationReason ?? getDegradationReason(),
    workspaceSnapshot: enhancement.snapshot,
    createdAt: now,
    updatedAt: now,
  };

  const run: DebateRunRecord = {
    id: nanoid(),
    debateId: record.id,
    generationMode: record.generationMode,
    providerStatus: record.providerStatus,
    degradationReason: record.degradationReason,
    status: "completed",
    startedAt: now,
    completedAt: now,
  };

  return { record, run };
}

export function hydrateExportPacket(snapshot: DebateWorkspaceSnapshot) {
  return {
    overview: snapshot.analysis,
    strategy: snapshot.framing,
    arguments: snapshot.myArguments,
    opponent: snapshot.opponentArguments,
    rebuttals: snapshot.rebuttals,
    vulnerabilities: snapshot.vulnerabilities,
    crossExam: snapshot.crossExam,
    speeches: snapshot.speechDrafts,
    live: snapshot.liveSheet,
    judge: snapshot.judgeSummary,
    sources: snapshot.sourceDocuments,
    evidence: snapshot.evidenceCards,
  };
}
