import { connection } from "next/server";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { WorkspaceView } from "@/components/debate/workspace-view";
import { workspaceSections, type WorkspaceSection } from "@/features/debates/types";
import { getDebateForCurrentUser } from "@/server/services/debate-access";

export default async function DebateSectionPage({
  params,
}: {
  params: Promise<{ debateId: string; section: string }>;
}) {
  await connection();
  const { debateId, section } = await params;
  if (!workspaceSections.includes(section as WorkspaceSection)) {
    notFound();
  }

  const debate = await getDebateForCurrentUser(debateId);
  if (!debate) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <WorkspaceView debate={debate} section={section as WorkspaceSection} />
      </main>
    </div>
  );
}
