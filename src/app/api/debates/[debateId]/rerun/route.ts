import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { getDebateRepository } from "@/server/repositories/debate-repository";
import { generateDebateWorkspace } from "@/server/services/debate-generator";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ debateId: string }> },
) {
  try {
    const { debateId } = await params;
    const user = await getCurrentUserContext();
    const repository = await getDebateRepository();
    const debate = await repository.getDebate(user.id, debateId);
    if (!debate) {
      return NextResponse.json({ error: "Debate not found." }, { status: 404 });
    }

    const { record, run } = await generateDebateWorkspace(
      {
        resolution: debate.resolution,
        mySide: debate.mySide,
        opponentSide: debate.opponentSide,
        format: debate.format,
        audienceLevel: debate.audienceLevel,
        speechTimeMinutes: debate.timeLimits.speech,
        rebuttalTimeMinutes: debate.timeLimits.rebuttal,
        crossExamTimeMinutes: debate.timeLimits.crossExam,
        regionContext: debate.regionContext,
        classInstructions: "",
        toneStyle: debate.toneStyle,
        objectiveMode: debate.objectiveMode,
        trustMode: debate.trustMode,
        sourcePreferenceMode: debate.sourcePreferences.mode,
        allowedSourceTypes: debate.sourcePreferences.allowedSourceTypes,
        sourceWhitelist: debate.sourcePreferences.whitelist,
        sourceBlacklist: debate.sourcePreferences.blacklist,
      },
      user.id,
    );

    await repository.saveDebate({ ...record, id: debate.id, createdAt: debate.createdAt }, { ...run, debateId: debate.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not rerun the debate.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
