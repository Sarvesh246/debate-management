import { describe, expect, it } from "vitest";
import { normalizeDebateSetupForm } from "@/features/debates/validation";

describe("debate setup validation", () => {
  it("accepts a valid setup form", () => {
    const result = normalizeDebateSetupForm({
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
      toneStyle: "Clear",
      objectiveMode: "win",
      trustMode: "teacher_safe",
      sourcePreferenceMode: "mixed_reputable",
      allowedSourceTypes: ["government", "academic"],
      sourceWhitelistText: "eia.gov",
      sourceBlacklistText: "example.com",
    });

    expect(result.sourceWhitelist).toEqual(["eia.gov"]);
    expect(result.sourceBlacklist).toEqual(["example.com"]);
  });

  it("rejects identical sides", () => {
    expect(() =>
      normalizeDebateSetupForm({
        resolution: "Should schools use AI tutors?",
        mySide: "Yes",
        opponentSide: "Yes",
        format: "classroom",
        audienceLevel: "high_school",
        speechTimeMinutes: 3,
        rebuttalTimeMinutes: 2,
        crossExamTimeMinutes: 2,
        regionContext: "United States",
        classInstructions: "",
        toneStyle: "Clear",
        objectiveMode: "win",
        trustMode: "teacher_safe",
        sourcePreferenceMode: "mixed_reputable",
        allowedSourceTypes: ["government", "academic"],
        sourceWhitelistText: "",
        sourceBlacklistText: "",
      }),
    ).toThrow("Sides must be different");
  });
});
