import { nanoid } from "nanoid";
import { buildResearchQueries, buildWorkspaceSnapshot } from "@/features/debates/deterministic-engine";
import {
  getEffectiveLiveArguments,
  getEffectiveLiveRebuttals,
  getEffectiveSpeechContent,
  getEffectiveTrapQuestions,
  normalizeWorkspaceOverlay,
} from "@/features/debates/workspace-overlay";
import { getDegradationReason } from "@/server/capabilities/service";
import { enhanceSnapshotWithModel } from "@/server/providers/model";
import { discoverSources } from "@/server/providers/search";
import type {
  DebateRunRecord,
  DebateSetupInput,
  DebateWorkspaceRecord,
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
    workspaceOverlay: normalizeWorkspaceOverlay(undefined, enhancement.snapshot),
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

export function hydrateExportPacket(record: DebateWorkspaceRecord) {
  const overlay = normalizeWorkspaceOverlay(
    record.workspaceOverlay,
    record.workspaceSnapshot,
  );
  const workingRecord = {
    ...record,
    workspaceOverlay: overlay,
  };

  return {
    overview: workingRecord.workspaceSnapshot.analysis,
    strategy: workingRecord.workspaceSnapshot.framing,
    arguments: workingRecord.workspaceSnapshot.myArguments,
    opponent: workingRecord.workspaceSnapshot.opponentArguments,
    rebuttals: workingRecord.workspaceSnapshot.rebuttals,
    vulnerabilities: workingRecord.workspaceSnapshot.vulnerabilities,
    crossExam: workingRecord.workspaceSnapshot.crossExam,
    speeches: workingRecord.workspaceSnapshot.speechDrafts.map((draft) => ({
      ...draft,
      content: getEffectiveSpeechContent(workingRecord, draft.type),
    })),
    live: {
      ...workingRecord.workspaceSnapshot.liveSheet,
      topArguments: getEffectiveLiveArguments(workingRecord),
      quickestRebuttals: getEffectiveLiveRebuttals(workingRecord),
      trapQuestions: getEffectiveTrapQuestions(workingRecord),
      closingLine:
        workingRecord.workspaceOverlay.selectedWinningPath ??
        workingRecord.workspaceSnapshot.liveSheet.closingLine,
    },
    judge: workingRecord.workspaceSnapshot.judgeSummary,
    sources: workingRecord.workspaceSnapshot.sourceDocuments,
    evidence: workingRecord.workspaceSnapshot.evidenceCards,
  };
}
