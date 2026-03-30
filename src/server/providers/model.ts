import { z } from "zod";
import { getEnv, isGeminiConfigured } from "@/lib/env";
import type {
  DebateSetupInput,
  DebateWorkspaceSnapshot,
  GenerationMode,
  Provenance,
  ProviderStatus,
} from "@/features/debates/types";

const speechEnhancementSchema = z.object({
  opening: z.string(),
  rebuttal: z.string(),
  closing: z.string(),
  steeringAdvice: z.array(z.string()).min(2).max(5),
  coachingNotes: z.array(z.string()).min(2).max(5),
});

export interface ModelEnhancementResult {
  snapshot: DebateWorkspaceSnapshot;
  generationMode: GenerationMode;
  providerStatus: ProviderStatus;
  degradationReason?: string;
}

function formatModelEnhancementFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const statusMatch = message.match(/\bfailed with (\d+)\b/);
  const status = statusMatch ? Number(statusMatch[1]) : NaN;

  if (status === 429) {
    return "Google Gemini rate-limited this request (HTTP 429). Wait a few minutes, confirm your quota or billing, then use Regenerate to try provider enhancement again.";
  }
  if (status === 401 || status === 403) {
    return "Gemini rejected the request (HTTP 401/403). Check that GEMINI_API_KEY is valid and has access to the Generative Language API.";
  }
  if (status >= 500 && status < 600) {
    return "Gemini returned a server error. Your workspace is complete with deterministic content; retry later with Regenerate if you want model polish.";
  }
  if (message) {
    return message;
  }
  return "Provider enhancement failed before returning structured output.";
}

async function callGeminiStructured(prompt: string) {
  const env = getEnv();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no structured payload.");
  }

  return speechEnhancementSchema.parse(JSON.parse(text));
}

function updateProvenance(value: Provenance): Provenance {
  return value === "provider" ? value : "hybrid";
}

export async function enhanceSnapshotWithModel(
  setup: DebateSetupInput,
  snapshot: DebateWorkspaceSnapshot,
): Promise<ModelEnhancementResult> {
  if (!isGeminiConfigured()) {
    return {
      snapshot,
      generationMode: "deterministic",
      providerStatus: "degraded",
      degradationReason: "No Gemini API key is configured; this workspace uses the deterministic engine only.",
    };
  }

  try {
    const enhancement = await callGeminiStructured(`
You are improving a debate workspace. Do not invent facts, evidence, or citations.
Only improve phrasing and speaking flow using the verified material below.

Resolution: ${setup.resolution}
My side: ${setup.mySide}
Opponent side: ${setup.opponentSide}
Audience: ${setup.audienceLevel}
Tone: ${setup.toneStyle}

Top criteria: ${snapshot.analysis.likelyWinningCriteria.join(", ")}
Top my arguments:
${snapshot.myArguments.map((argument) => `- ${argument.title}: ${argument.claim}`).join("\n")}

Top rebuttals:
${snapshot.rebuttals.slice(0, 3).map((item) => `- ${item.shortRebuttal}`).join("\n")}
`);

    return {
      snapshot: {
        ...snapshot,
        framing: {
          ...snapshot.framing,
          steeringAdvice: enhancement.steeringAdvice,
          provenance: updateProvenance(snapshot.framing.provenance),
        },
        practicePlan: {
          ...snapshot.practicePlan,
          feedbackRubric: enhancement.coachingNotes,
          provenance: updateProvenance(snapshot.practicePlan.provenance),
        },
        speechDrafts: snapshot.speechDrafts.map((draft) => {
          if (draft.type === "opening") {
            return {
              ...draft,
              content: enhancement.opening,
              provenance: updateProvenance(draft.provenance),
            };
          }
          if (draft.type === "rebuttal") {
            return {
              ...draft,
              content: enhancement.rebuttal,
              provenance: updateProvenance(draft.provenance),
            };
          }
          if (draft.type === "closing") {
            return {
              ...draft,
              content: enhancement.closing,
              provenance: updateProvenance(draft.provenance),
            };
          }
          return draft;
        }),
      },
      generationMode: "provider",
      providerStatus: "ready",
    };
  } catch (error) {
    return {
      snapshot,
      generationMode: "deterministic",
      providerStatus: "degraded",
      degradationReason: formatModelEnhancementFailure(error),
    };
  }
}
