import { describe, expect, it } from "vitest";
import {
  buildAnalysis,
  buildEvidenceCards,
  buildResearchQueries,
  buildWorkspaceSnapshot,
} from "@/features/debates/deterministic-engine";
import type { DebateSetupInput, SourceDocument } from "@/features/debates/types";

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
    id: "src-1",
    url: "https://www.eia.gov/example",
    title: "Natural gas generation stays highly dispatchable",
    organization: "U.S. Energy Information Administration",
    publishedAt: "2024-01-01",
    sourceType: "government",
    credibilityScore: 0.94,
    credibilityLabel: "High trust",
    directnessScore: 0.82,
    freshnessScore: 0.92,
    excerpt: "Natural gas plants can ramp quickly and support grid reliability during demand spikes.",
    processedText:
      "Natural gas plants can ramp quickly and support grid reliability during demand spikes.",
    metadata: {},
    queryId: "q-1",
    sideIntent: "mine",
    criterionTags: ["Reliability"],
  },
  {
    id: "src-2",
    url: "https://www.iea.org/example",
    title: "Nuclear power offers low operational emissions",
    organization: "International Energy Agency",
    publishedAt: "2024-01-01",
    sourceType: "international",
    credibilityScore: 0.91,
    credibilityLabel: "High trust",
    directnessScore: 0.8,
    freshnessScore: 0.93,
    excerpt: "Nuclear energy produces low direct emissions while providing stable baseload power.",
    processedText:
      "Nuclear energy produces low direct emissions while providing stable baseload power.",
    metadata: {},
    queryId: "q-2",
    sideIntent: "opponent",
    criterionTags: ["Emissions"],
  },
];

describe("deterministic engine", () => {
  it("builds research queries from top criteria", () => {
    const snapshot = buildWorkspaceSnapshot(setup, []);
    const queries = buildResearchQueries(setup, snapshot.criteria);

    expect(queries.length).toBeGreaterThan(5);
    expect(queries[0].query).toContain("Natural gas");
  });

  it("creates evidence cards and structured snapshot output", () => {
    const snapshot = buildWorkspaceSnapshot(setup, sources);

    expect(snapshot.analysis.likelyWinningCriteria.length).toBeGreaterThan(2);
    expect(snapshot.evidenceCards.length).toBe(2);
    expect(snapshot.myArguments.length).toBeGreaterThan(0);
    expect(snapshot.opponentArguments.length).toBeGreaterThan(0);
    expect(snapshot.rebuttals.length).toBeGreaterThan(0);
    expect(snapshot.liveSheet.provenance).toBe("template");
  });

  it("keeps factual claim units separated from inference", () => {
    const cards = buildEvidenceCards(sources, buildWorkspaceSnapshot(setup, []).criteria);
    const factLayer = cards[0]?.claimUnits.find((unit) => unit.layer === "fact");
    const inferenceLayer = cards[0]?.claimUnits.find((unit) => unit.layer === "inference");

    expect(factLayer?.text).toContain("Natural gas");
    expect(inferenceLayer?.text).toContain("suggests");
  });

  it("identifies the debate as framework-driven", () => {
    const snapshot = buildWorkspaceSnapshot(setup, []);
    const analysis = buildAnalysis(setup, snapshot.criteria);

    expect(analysis.whatThisDebateIsReallyAbout).toContain("practical decision standards");
    expect(analysis.provenance).toBe("heuristic");
  });
});
