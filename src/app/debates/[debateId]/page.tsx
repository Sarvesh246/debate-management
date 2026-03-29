import { redirect } from "next/navigation";

export default async function DebatePage({
  params,
}: {
  params: Promise<{ debateId: string }>;
}) {
  const { debateId } = await params;
  redirect(`/debates/${debateId}/overview`);
}
