import { nanoid } from "nanoid";
import type { DebateWorkspaceRecord, PracticeSessionRecord } from "@/features/debates/types";

export function buildPracticeFeedback(
  debate: DebateWorkspaceRecord,
  transcript: Array<{ role: "coach" | "opponent" | "user"; text: string }>,
) {
  const userMessages = transcript.filter((entry) => entry.role === "user");
  const joined = userMessages.map((entry) => entry.text.toLowerCase()).join(" ");
  const evidenceMentions = debate.workspaceSnapshot.sourceDocuments.filter((source) =>
    joined.includes(source.organization.toLowerCase()),
  ).length;
  const criterionMentions = debate.workspaceSnapshot.analysis.likelyWinningCriteria.filter((criterion) =>
    joined.includes(criterion.toLowerCase()),
  ).length;
  const rebuttalMentions = debate.workspaceSnapshot.rebuttals.filter((rebuttal) =>
    joined.includes(rebuttal.shortRebuttal.split(" ").slice(0, 3).join(" ").toLowerCase()),
  ).length;

  const score = {
    evidenceUse: Math.min(10, evidenceMentions * 3 + 2),
    framing: Math.min(10, criterionMentions * 3 + 2),
    rebuttalPrecision: Math.min(10, rebuttalMentions * 3 + 2),
    composure: userMessages.every((message) => message.text.length > 25) ? 8 : 6,
  };

  const feedback = [
    evidenceMentions > 0
      ? "You referenced at least one concrete source, which keeps the round grounded."
      : "Name the source organization out loud when possible so your evidence sounds anchored and trustworthy.",
    criterionMentions >= 2
      ? "You kept returning to the decision standards, which helps judge control."
      : "Re-center your answers around one or two criteria instead of drifting into generic defense.",
    rebuttalMentions > 0
      ? "You used at least one prepared rebuttal line effectively."
      : "Use your prepared rebuttal bank more directly in timed responses.",
  ];

  return { score, feedback };
}

export function createPracticeSessionRecord(
  debate: DebateWorkspaceRecord,
  transcript: Array<{ role: "coach" | "opponent" | "user"; text: string }>,
): PracticeSessionRecord {
  const { score, feedback } = buildPracticeFeedback(debate, transcript);
  return {
    id: nanoid(),
    debateId: debate.id,
    transcript,
    score,
    feedback,
    createdAt: new Date().toISOString(),
  };
}
