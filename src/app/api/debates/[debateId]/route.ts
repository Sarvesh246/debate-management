import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { DEPLOYED_SUPABASE_CONFIG_ERROR } from "@/lib/env";
import { normalizeWorkspaceOverlayForm } from "@/features/debates/validation";
import { getDebateRepository } from "@/server/repositories/debate-repository";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ debateId: string }> },
) {
  try {
    const { debateId } = await params;
    const user = await getCurrentUserContext();
    const repository = await getDebateRepository();
    const removed = await repository.deleteDebate(user.id, debateId);

    if (!removed) {
      return NextResponse.json({ error: "Debate not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not delete the debate.";
    const status =
      message === "AUTH_REQUIRED"
        ? 401
        : message === DEPLOYED_SUPABASE_CONFIG_ERROR
          ? 503
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ debateId: string }> },
) {
  try {
    const { debateId } = await params;
    const user = await getCurrentUserContext();
    const raw = (await request.json()) as { workspaceOverlay?: unknown };
    const workspaceOverlay = normalizeWorkspaceOverlayForm(raw.workspaceOverlay as never);
    const repository = await getDebateRepository();
    const updated = await repository.updateWorkspaceOverlay(
      user.id,
      debateId,
      workspaceOverlay,
    );

    if (!updated) {
      return NextResponse.json({ error: "Debate not found." }, { status: 404 });
    }

    return NextResponse.json({
      debateId: updated.id,
      workspaceOverlay: updated.workspaceOverlay,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update the workspace.";
    const status =
      message === "AUTH_REQUIRED"
        ? 401
        : message === DEPLOYED_SUPABASE_CONFIG_ERROR
          ? 503
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
