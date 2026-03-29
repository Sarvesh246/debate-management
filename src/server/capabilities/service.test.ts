import { afterEach, describe, expect, it, vi } from "vitest";
import { clearEnvCache } from "@/lib/env";
import { getCapabilitySnapshot } from "@/server/capabilities/service";

afterEach(() => {
  vi.unstubAllEnvs();
  clearEnvCache();
});

describe("capability service", () => {
  it("reports deterministic fallback when provider keys are missing", () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("TAVILY_API_KEY", "");

    const snapshot = getCapabilitySnapshot();

    expect(snapshot.overallMode).toBe("deterministic");
    expect(snapshot.structuredSynthesis.status).toBe("degraded");
    expect(snapshot.publicRetrieval.status).toBe("ready");
  });
});
