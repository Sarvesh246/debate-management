import { connection } from "next/server";
import { notFound } from "next/navigation";
import { nanoid } from "nanoid";
import { getDebateRepository } from "@/server/repositories/debate-repository";
import { hydrateExportPacket } from "@/server/services/debate-generator";
import { requireAppUser } from "@/server/services/debate-access";

export default async function DebatePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ debateId: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  await connection();
  const { debateId } = await params;
  const { kind = "packet" } = await searchParams;
  const user = await requireAppUser();
  const repository = await getDebateRepository();
  const debate = await repository.getDebate(user.id, debateId);
  if (!debate) {
    notFound();
  }

  await repository.saveExportRecord({
    id: nanoid(),
    debateId: debate.id,
    format: kind as never,
    createdAt: new Date().toISOString(),
  });

  const packet = hydrateExportPacket(debate);

  return (
    <main className="mx-auto max-w-4xl space-y-10 px-6 py-10 print:max-w-none print:px-0">
      <header className="border-b border-border pb-6">
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">{kind.replaceAll("_", " ")}</div>
        <h1 className="mt-2 font-heading text-4xl tracking-tight">{debate.title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{debate.resolution}</p>
      </header>

      {(kind === "packet" || kind === "speech_only") && (
        <section className="space-y-4">
          <h2 className="font-heading text-2xl">Speeches</h2>
          {packet.speeches.map((draft) => (
            <div key={draft.id}>
              <h3 className="font-medium">{draft.type}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{draft.content}</p>
            </div>
          ))}
        </section>
      )}

      {(kind === "packet" || kind === "sources_only") && (
        <section className="space-y-4">
          <h2 className="font-heading text-2xl">Sources</h2>
          {packet.sources.map((source) => (
            <div key={source.id}>
              <h3 className="font-medium">{source.title}</h3>
              <p className="text-sm text-muted-foreground">
                {source.organization} | {source.sourceType} | {source.url}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{source.excerpt}</p>
            </div>
          ))}
        </section>
      )}

      {(kind === "packet" || kind === "live_sheet") && (
        <section className="space-y-4">
          <h2 className="font-heading text-2xl">Live sheet</h2>
          <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
            {packet.live.topArguments.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>
      )}

      {(kind === "packet" || kind === "judge_report") && (
        <section className="space-y-4">
          <h2 className="font-heading text-2xl">Judge report</h2>
          <p className="text-sm leading-6 text-muted-foreground">{packet.judge.honestAssessment}</p>
          <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
            {packet.judge.frameworkBreakdown.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
