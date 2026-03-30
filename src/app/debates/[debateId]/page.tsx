import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { DebateBuildFlow } from "@/components/debate/build-flow";
import { getDebateRepository } from "@/server/repositories/debate-repository";
import { requireAppUser } from "@/server/services/debate-access";

export default async function DebatePage({
  params,
  searchParams,
}: {
  params: Promise<{ debateId: string }>;
  searchParams: Promise<{ intro?: string }>;
}) {
  await connection();
  const { debateId } = await params;
  const { intro } = await searchParams;

  if (intro !== "1") {
    redirect(`/debates/${debateId}/understand`);
  }

  const user = await requireAppUser();
  const repository = await getDebateRepository();
  const debate = await repository.getDebate(user.id, debateId);
  if (!debate) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <DebateBuildFlow debate={debate} />
      </main>
    </div>
  );
}
