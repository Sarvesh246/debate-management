import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { WorkspaceView } from "@/components/debate/workspace-view";
import { legacySectionTargets } from "@/lib/constants";
import {
  legacyWorkspaceSections,
  primaryWorkspacePillars,
  type LegacyWorkspaceSection,
  type WorkspacePillar,
} from "@/features/debates/types";
import { getDebateForCurrentUser } from "@/server/services/debate-access";

export default async function DebateSectionPage({
  params,
}: {
  params: Promise<{ debateId: string; section: string }>;
}) {
  await connection();
  const { debateId, section } = await params;
  if (primaryWorkspacePillars.includes(section as WorkspacePillar)) {
    const debate = await getDebateForCurrentUser(debateId);
    if (!debate) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <WorkspaceView debate={debate} pillar={section as WorkspacePillar} />
        </main>
      </div>
    );
  }

  if (!legacyWorkspaceSections.includes(section as LegacyWorkspaceSection)) {
    notFound();
  }
  const target = legacySectionTargets[section as LegacyWorkspaceSection];

  const query = new URLSearchParams();
  if ("tool" in target && target.tool) {
    query.set("tool", target.tool);
  }
  if ("module" in target && target.module) {
    query.set("module", target.module);
  }
  redirect(`/debates/${debateId}/${target.pillar}${query.size > 0 ? `?${query.toString()}` : ""}`);
}
