import { describe, expect, it } from "vitest";
import { scoreQueryRelevance } from "@/server/providers/search";
import type { DebateSetupInput, ResearchQuery } from "@/features/debates/types";

const setup: DebateSetupInput = {
  resolution: "Should cities ban smartphones in classrooms by default?",
  mySide: "Yes, ban them by default",
  opponentSide: "No, allow classroom discretion",
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

const query: ResearchQuery = {
  id: "query-1",
  query: "smartphone classroom learning outcomes evidence United States",
  purpose: "Find evidence that supports the ban on learning outcomes.",
  side: "mine",
  criterionTags: ["Learning outcomes"],
  preferredSourceTypes: setup.allowedSourceTypes,
};

describe("scoreQueryRelevance", () => {
  it("scores directly relevant education sources above irrelevant but high-trust results", () => {
    const relevant = scoreQueryRelevance(
      {
        url: "https://example.edu/smartphone-ban-study",
        title: "Classroom smartphone bans and student learning outcomes",
        organization: "Example University",
        excerpt:
          "Students in secondary school classrooms improved focus and learning outcomes after smartphone restrictions.",
      },
      query,
      setup,
    );

    const irrelevant = scoreQueryRelevance(
      {
        url: "https://example.org/abortion-ban-labor-study",
        title: "Effect of Abortion Ban on Women's Labor Market Outcomes in the United States",
        organization: "Elsevier BV",
        excerpt:
          "The paper studies labor market outcomes in the post-Dobbs period across multiple states.",
      },
      query,
      setup,
    );

    expect(relevant.score).toBeGreaterThan(irrelevant.score);
    expect(relevant.score).toBeGreaterThanOrEqual(0.34);
    expect(irrelevant.score).toBeLessThan(0.34);
  });

  it("keeps broadly relevant education sources that match the domain and criterion", () => {
    const educationReport = scoreQueryRelevance(
      {
        url: "https://example.org/education-report",
        title: "Learning to Realize Education's Promise",
        organization: "World Bank",
        excerpt:
          "The report focuses on learning, student outcomes, and practical classroom interventions at scale.",
      },
      query,
      setup,
    );

    expect(educationReport.criterionHits).toBeGreaterThanOrEqual(1);
    expect(educationReport.debateHits).toBeGreaterThanOrEqual(1);
    expect(educationReport.score).toBeGreaterThanOrEqual(0.34);
  });
});
