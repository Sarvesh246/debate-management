import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearEnvCache } from "@/lib/env";
import { generateDebateWorkspace } from "@/server/services/debate-generator";
import type { DebateSetupInput } from "@/features/debates/types";

const setup: DebateSetupInput = {
  resolution: "Should schools use AI tutors?",
  mySide: "Yes",
  opponentSide: "No",
  format: "classroom",
  audienceLevel: "high_school",
  speechTimeMinutes: 3,
  rebuttalTimeMinutes: 2,
  crossExamTimeMinutes: 1,
  regionContext: "United States",
  classInstructions: "",
  toneStyle: "Clear",
  objectiveMode: "win",
  trustMode: "teacher_safe",
  sourcePreferenceMode: "mixed_reputable",
  allowedSourceTypes: ["government", "academic", "institutional", "international"],
  sourceWhitelist: [],
  sourceBlacklist: [],
};

beforeEach(() => {
  vi.stubEnv("DISABLE_NETWORK_RETRIEVAL", "1");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  clearEnvCache();
});

describe("debate generator", () => {
  it("boots and generates deterministically with no model key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const result = await generateDebateWorkspace(setup, "local-user");

    expect(result.record.generationMode).toBe("deterministic");
    expect(result.record.workspaceSnapshot.analysis.likelyWinningCriteria.length).toBeGreaterThan(0);
  });

  it("falls back gracefully when provider enhancement fails", async () => {
    vi.stubEnv("GEMINI_API_KEY", "bad-key");
    clearEnvCache();
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => {
      if (String(input).includes("googleapis")) {
        return new Response("failure", { status: 500 });
      }
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    }) as typeof fetch);

    const result = await generateDebateWorkspace(setup, "local-user");

    expect(result.record.generationMode).toBe("deterministic");
    expect(result.record.degradationReason).toMatch(/Gemini|server error|retry/i);
  });

  it("maps Gemini 429 to a rate-limit explanation", async () => {
    vi.stubEnv("GEMINI_API_KEY", "key");
    clearEnvCache();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        if (String(input).includes("googleapis")) {
          return new Response("{}", { status: 429 });
        }
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }) as typeof fetch,
    );

    const result = await generateDebateWorkspace(setup, "local-user");

    expect(result.record.generationMode).toBe("deterministic");
    expect(result.record.degradationReason).toMatch(/429/);
    expect(result.record.degradationReason).toMatch(/rate-limited|quota/i);
  });
});
