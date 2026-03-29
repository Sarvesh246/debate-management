import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { DEPLOYED_SUPABASE_CONFIG_ERROR } from "@/lib/env";
import { normalizeDebateSetupForm } from "@/features/debates/validation";
import { generateDebateWorkspace } from "@/server/services/debate-generator";
import { getDebateRepository } from "@/server/repositories/debate-repository";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserContext();
    const raw = (await request.json()) as Record<string, unknown>;
    const input = normalizeDebateSetupForm(raw as never);
    const { record, run } = await generateDebateWorkspace(input, user.id);
    const repository = await getDebateRepository();
    await repository.saveDebate(record, run);
    return NextResponse.json({ debateId: record.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create the debate workspace.";
    const status =
      message === "AUTH_REQUIRED"
        ? 401
        : message === DEPLOYED_SUPABASE_CONFIG_ERROR
          ? 503
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
