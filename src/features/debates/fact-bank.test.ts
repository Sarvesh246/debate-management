import { describe, expect, it } from "vitest";
import { buildWorkspaceSnapshot } from "@/features/debates/deterministic-engine";
import {
  getOpponentPressureFactItems,
  getRebuttalQuestionItems,
  getSupportingFactItems,
} from "@/features/debates/fact-bank";
import { createDefaultWorkspaceOverlay } from "@/features/debates/workspace-overlay";
import type { DebateSetupInput, DebateWorkspaceRecord, SourceDocument } from "@/features/debates/types";

const setup: DebateSetupInput = {
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
    title: "Natural gas grid support",
    organization: "Energy Reliability Institute",
    publishedAt: "2025-01-15",
    sourceType: "institutional",
    credibilityScore: 0.92,
    credibilityLabel: "High trust",
    directnessScore: 0.88,
    freshnessScore: 0.84,
    excerpt: "Natural gas infrastructure can respond to near-term demand spikes with existing grid support.",
    metadata: {},
    sideIntent: "mine",
    criterionTags: ["Reliability", "Deployment speed"],
  },
  {
    id: "source-opponent",
    url: "https://example.org/nuclear",
    title: "Nuclear scale outlook",
    organization: "Energy Futures Council",
    publishedAt: "2025-02-20",
    sourceType: "institutional",
    credibilityScore: 0.89,
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
  const snapshot = buildWorkspaceSnapshot(setup, sources);
  return {
    id: "debate-1",
    userId: "local-user",
    title: "Natural gas vs Nuclear energy",
    resolution: setup.resolution,
    mySide: setup.mySide,
    opponentSide: setup.opponentSide,
    format: setup.format,
    audienceLevel: setup.audienceLevel,
    timeLimits: {
      speech: setup.speechTimeMinutes,
      rebuttal: setup.rebuttalTimeMinutes,
      crossExam: setup.crossExamTimeMinutes,
    },
    sourcePreferences: {
      mode: setup.sourcePreferenceMode,
      allowedSourceTypes: setup.allowedSourceTypes,
      whitelist: [],
      blacklist: [],
    },
    trustMode: setup.trustMode,
    regionContext: setup.regionContext,
    toneStyle: setup.toneStyle,
    objectiveMode: setup.objectiveMode,
    status: "generated",
    generationMode: "deterministic",
    providerStatus: "degraded",
    degradationReason: "Test fixture",
    workspaceSnapshot: snapshot,
    workspaceOverlay: createDefaultWorkspaceOverlay(snapshot),
    createdAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:00:00.000Z",
  };
}

describe("fact bank helpers", () => {
  it("returns source-linked supporting facts for the user's side", () => {
    const record = createRecord();

    const items = getSupportingFactItems(record);

    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.sourceUrl).toBe("https://example.org/natural-gas");
    expect(items[0]?.fact).toContain("Natural gas infrastructure");
    expect(items[0]?.supportedClaim.length).toBeGreaterThan(10);
    expect(items[0]?.sourceExcerpt).toContain("Natural gas");
    expect(items[0]?.plainEnglish.length).toBeGreaterThan(10);
  });

  it("returns source-linked opponent pressure facts and rebuttal questions", () => {
    const record = createRecord();

    const pressureFacts = getOpponentPressureFactItems(record);
    const questions = getRebuttalQuestionItems(record);

    expect(pressureFacts.length).toBeGreaterThan(0);
    expect(pressureFacts[0]?.heading).toMatch(/Against/);
    expect(pressureFacts[0]?.sourceUrl).toMatch(/^https:\/\/example\.org\//);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0]?.typeLabel).toMatch(/question/i);
  });
});
