import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rm } from "node:fs/promises";
import path from "node:path";
import { clearEnvCache, DEPLOYED_SUPABASE_CONFIG_ERROR } from "@/lib/env";
import { generateDebateWorkspace } from "@/server/services/debate-generator";
import {
  buildDebateScopedRowId,
  getDebateRepository,
} from "@/server/repositories/debate-repository";
import type { DebateSetupInput } from "@/features/debates/types";

const MOCK_STORE_PATH = path.join(process.cwd(), ".data", "mock-store.json");

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

beforeEach(async () => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
  vi.stubEnv("GEMINI_API_KEY", "");
  vi.stubEnv("DISABLE_NETWORK_RETRIEVAL", "1");
  clearEnvCache();
  await rm(MOCK_STORE_PATH, { force: true });
});

afterEach(async () => {
  vi.unstubAllEnvs();
  clearEnvCache();
  await rm(MOCK_STORE_PATH, { force: true });
});

describe("debate repository", () => {
  it("scopes deterministic row ids to a debate", () => {
    expect(buildDebateScopedRowId("debate-1", "energy-criterion-1")).toBe(
      "debate-1:energy-criterion-1",
    );
    expect(buildDebateScopedRowId("debate-2", "energy-criterion-1")).toBe(
      "debate-2:energy-criterion-1",
    );
  });

  it("preserves concurrent mock saves in local mode", async () => {
    const repository = await getDebateRepository();

    const generated = await Promise.all(
      Array.from({ length: 4 }, (_, index) =>
        generateDebateWorkspace(
          {
            ...baseSetup,
            mySide: `Natural gas ${index + 1}`,
            opponentSide: `Nuclear energy ${index + 1}`,
          },
          "local-user",
        ),
      ),
    );

    await Promise.all(
      generated.map(({ record, run }) => repository.saveDebate(record, run)),
    );

    const debates = await repository.listDebates("local-user");

    expect(debates).toHaveLength(4);
    expect(new Set(debates.map((debate) => debate.id)).size).toBe(4);
  });

  it("blocks mock persistence in production without Supabase", async () => {
    vi.stubEnv("NODE_ENV", "production");
    clearEnvCache();

    await expect(getDebateRepository()).rejects.toThrow(
      DEPLOYED_SUPABASE_CONFIG_ERROR,
    );
  });
});
