import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { getDebateRepository } from "@/server/repositories/debate-repository";
import { createPracticeSessionRecord } from "@/server/services/practice-service";

export async function POST(
  request: Request,
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
    const payload = (await request.json()) as {
      transcript: Array<{ role: "coach" | "opponent" | "user"; text: string }>;
    };
    const record = createPracticeSessionRecord(debate, payload.transcript);
    await repository.savePracticeSession(record);
    return NextResponse.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save practice session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
