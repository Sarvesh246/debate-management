import {
  canUseLocalWorkspaceMode,
  getMissingSupabaseServerEnvNames,
  isGeminiConfigured,
  isSupabaseConfigured,
  isTavilyConfigured,
} from "@/lib/env";
import type { CapabilityDescriptor, CapabilitySnapshot, GenerationMode } from "@/features/debates/types";
import { getPersistenceCapability } from "@/server/db/health";

function createDescriptor(
  label: string,
  status: CapabilityDescriptor["status"],
  detail: string,
): CapabilityDescriptor {
  return { label, status, detail };
}

export async function getCapabilitySnapshot(): Promise<CapabilitySnapshot> {
  const hasSupabase = isSupabaseConfigured();
  const missingSupabaseEnvNames = getMissingSupabaseServerEnvNames();
  const localWorkspaceModeAvailable = canUseLocalWorkspaceMode();
  const hasGemini = isGeminiConfigured();
  const hasTavily = isTavilyConfigured();
  const overallMode: GenerationMode = hasGemini ? "provider" : "deterministic";
  const persistence = await getPersistenceCapability();

  return {
    auth: hasSupabase
      ? createDescriptor("Auth", "ready", "Supabase Auth is active.")
      : localWorkspaceModeAvailable
        ? createDescriptor(
            "Auth",
            "degraded",
            "Supabase is not configured. The app runs in local workspace mode.",
          )
        : createDescriptor(
            "Auth",
            "unavailable",
            `Supabase Auth is required in deployed environments. Missing: ${missingSupabaseEnvNames.join(", ")}.`,
          ),
    persistence,
    publicRetrieval: createDescriptor(
      "Public retrieval",
      "ready",
      "OpenAlex and Crossref discovery remain available without extra keys.",
    ),
    providerDiscovery: hasTavily
      ? createDescriptor("Provider-backed discovery", "ready", "Tavily is configured for broader source discovery.")
      : createDescriptor(
          "Provider-backed discovery",
          "degraded",
          "Broad web discovery is off. Public academic and manual-source flows stay available.",
        ),
    structuredSynthesis: hasGemini
      ? createDescriptor("Structured synthesis", "ready", "Gemini enhancement is available.")
      : createDescriptor(
          "Structured synthesis",
          "degraded",
          "Deterministic engine is active because no model key is configured.",
        ),
    practiceSimulationDepth: hasGemini
      ? createDescriptor("Practice depth", "ready", "Adaptive opponent simulation is enabled.")
      : createDescriptor(
          "Practice depth",
          "degraded",
          "Practice uses scripted round trees with evidence-based feedback.",
        ),
    overallMode,
  };
}

export function getDegradationReason() {
  if (!isGeminiConfigured()) {
    return "No Gemini API key configured. Deterministic debate generation is active.";
  }

  return undefined;
}
