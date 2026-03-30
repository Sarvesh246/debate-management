import { describe, expect, it } from "vitest";
import { buildWorkspaceSnapshot } from "@/features/debates/deterministic-engine";
import {
  createDefaultWorkspaceOverlay,
  getEffectiveLiveArguments,
  getEffectiveSpeechContent,
  hasWorkspaceOverlayCustomizations,
  normalizeWorkspaceOverlay,
} from "@/features/debates/workspace-overlay";
import type { DebateSetupInput, DebateWorkspaceRecord, SourceDocument } from "@/features/debates/types";

const baseSetup: DebateSetupInput = {
  resolution: "What is the best source of energy for the future?",
  mySide: "Natural gas",
  opponentSide: "Nuclear energy",
  format: "classroom",
  audienceLevel: "high_school",
  speechTimeMinutes: 3,
  rebuttalTimeMinutes: 2,
  crossExamTimeMinutes: 2,
  regionContext: "United States",
  classInstructions: "",
  toneStyle: "Clear, confident, evidence-first",
  objectiveMode: "win",
  trustMode: "teacher_safe",
  sourcePreferenceMode: "mixed_reputable",
  allowedSourceTypes: ["government", "academic", "international", "institutional"],
  sourceWhitelist: [],
  sourceBlacklist: [],
};

const sources: SourceDocument[] = [
  {
    id: "source-mine",
    url: "https://example.org/natural-gas",
    title: "Natural gas reliability outlook",
    organization: "Energy Reliability Institute",
    publishedAt: "2025-01-15",
    sourceType: "institutional",
    credibilityScore: 0.88,
    credibilityLabel: "High trust",
    directnessScore: 0.84,
    freshnessScore: 0.8,
    excerpt: "Natural gas infrastructure can respond to near-term demand spikes with existing grid support.",
    metadata: {},
    sideIntent: "mine",
    criterionTags: ["Reliability", "Infrastructure readiness", "Deployment speed"],
  },
  {
    id: "source-opponent",
    url: "https://example.org/nuclear",
    title: "Nuclear long-term scalability",
    organization: "Energy Futures Council",
    publishedAt: "2025-02-20",
    sourceType: "institutional",
    credibilityScore: 0.86,
    credibilityLabel: "High trust",
    directnessScore: 0.82,
    freshnessScore: 0.82,
    excerpt: "Nuclear generation remains attractive when the debate prioritizes long-run scale and low emissions.",
    metadata: {},
    sideIntent: "opponent",
    criterionTags: ["Scalability", "Emissions"],
  },
];

function createRecord(): DebateWorkspaceRecord {
  const snapshot = buildWorkspaceSnapshot(baseSetup, sources);
  return {
    id: "debate-1",
    userId: "local-user",
    title: "Natural gas vs Nuclear energy",
    resolution: baseSetup.resolution,
    mySide: baseSetup.mySide,
    opponentSide: baseSetup.opponentSide,
    format: baseSetup.format,
    audienceLevel: baseSetup.audienceLevel,
    timeLimits: {
      speech: baseSetup.speechTimeMinutes,
      rebuttal: baseSetup.rebuttalTimeMinutes,
      crossExam: baseSetup.crossExamTimeMinutes,
    },
    sourcePreferences: {
      mode: baseSetup.sourcePreferenceMode,
      allowedSourceTypes: baseSetup.allowedSourceTypes,
      whitelist: [],
      blacklist: [],
    },
    trustMode: baseSetup.trustMode,
    regionContext: baseSetup.regionContext,
    toneStyle: baseSetup.toneStyle,
    objectiveMode: baseSetup.objectiveMode,
    status: "generated",
    generationMode: "deterministic",
    providerStatus: "degraded",
    degradationReason: "Test fixture",
    workspaceSnapshot: snapshot,
    workspaceOverlay: createDefaultWorkspaceOverlay(snapshot),
    createdAt: "2026-03-29T00:00:00.000Z",
    updatedAt: "2026-03-29T00:00:00.000Z",
  };
}

describe("workspace overlay helpers", () => {
  it("merges sparse overlays into the baseline shape", () => {
    const record = createRecord();
    const firstArgument = record.workspaceSnapshot.myArguments[0]!;

    const overlay = normalizeWorkspaceOverlay(
      {
        pinnedArgumentIds: [firstArgument.id],
      },
      record.workspaceSnapshot,
    );

    expect(overlay.selectedWinningPath).toBe(record.workspaceSnapshot.framing.winningFramework);
    expect(overlay.pinnedArgumentIds).toEqual([firstArgument.id]);
    expect(overlay.liveSheetOrder.argumentIds).toEqual([]);
    expect(overlay.moduleState.case).toEqual({ collapsed: false, pinned: false });
  });

  it("prefers overlay content for speech and live outputs", () => {
    const record = createRecord();
    const firstArgument = record.workspaceSnapshot.myArguments[0]!;

    const workingRecord = {
      ...record,
      workspaceOverlay: normalizeWorkspaceOverlay(
        {
          pinnedArgumentIds: [firstArgument.id],
          simplifiedPhrasing: {
            [firstArgument.id]: "Lead with reliability and deployment speed.",
          },
          speechEdits: {
            opening: "Custom opening built from the working layer.",
          },
        },
        record.workspaceSnapshot,
      ),
    };

    expect(getEffectiveLiveArguments(workingRecord)[0]).toBe("Lead with reliability and deployment speed.");
    expect(getEffectiveSpeechContent(workingRecord, "opening")).toBe("Custom opening built from the working layer.");
    expect(hasWorkspaceOverlayCustomizations(workingRecord.workspaceOverlay)).toBe(true);
  });
});
