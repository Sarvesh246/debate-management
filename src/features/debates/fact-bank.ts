import type {
  CrossExamItem,
  DebateWorkspaceRecord,
  EvidenceCard,
  RebuttalPack,
  SourceDocument,
} from "@/features/debates/types";

const NO_EXCERPT_PREFIX = "No excerpt available";

export interface LinkedFactItem {
  id: string;
  heading: string;
  fact: string;
  note: string;
  sourceTitle: string;
  sourceUrl: string;
  organization: string;
  credibilityLabel: string;
  evidenceCardId: string;
}

export interface RebuttalQuestionItem {
  id: string;
  question: string;
  note: string;
  typeLabel: string;
}

function extractDirectFact(card: EvidenceCard) {
  const factUnit = card.claimUnits.find(
    (unit) => unit.layer === "fact" && !unit.text.startsWith(NO_EXCERPT_PREFIX),
  );

  if (factUnit) {
    return factUnit.text;
  }

  if (card.excerpt && !card.excerpt.startsWith(NO_EXCERPT_PREFIX)) {
    return card.excerpt;
  }

  return null;
}

function buildFactItem({
  card,
  source,
  heading,
  note,
}: {
  card: EvidenceCard;
  source: SourceDocument;
  heading: string;
  note: string;
}): LinkedFactItem | null {
  const fact = extractDirectFact(card);
  if (!fact) {
    return null;
  }

  return {
    id: `${heading}:${card.id}`,
    heading,
    fact,
    note,
    sourceTitle: source.title,
    sourceUrl: source.url,
    organization: source.organization,
    credibilityLabel: card.credibilityLabel,
    evidenceCardId: card.id,
  };
}

function dedupeFacts(items: LinkedFactItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.fact}|${item.sourceUrl}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getSourceMap(record: DebateWorkspaceRecord) {
  return new Map(record.workspaceSnapshot.sourceDocuments.map((source) => [source.id, source] as const));
}

function getEvidenceMap(record: DebateWorkspaceRecord) {
  return new Map(record.workspaceSnapshot.evidenceCards.map((card) => [card.id, card] as const));
}

export function getSupportingFactItems(record: DebateWorkspaceRecord, limit = 4) {
  const sourceById = getSourceMap(record);
  const evidenceById = getEvidenceMap(record);

  const items = record.workspaceSnapshot.myArguments.flatMap((argument) =>
    argument.evidenceCardIds.flatMap((cardId) => {
      const card = evidenceById.get(cardId);
      const source = card ? sourceById.get(card.sourceId) : undefined;
      if (!card || !source) {
        return [];
      }
      const item = buildFactItem({
        card,
        source,
        heading: argument.title,
        note: argument.simpleVersion,
      });
      return item ? [item] : [];
    }),
  );

  return dedupeFacts(items).slice(0, limit);
}

function buildOpponentPressureFact({
  rebuttal,
  card,
  source,
  targetTitle,
}: {
  rebuttal: RebuttalPack;
  card: EvidenceCard;
  source: SourceDocument;
  targetTitle: string;
}) {
  return buildFactItem({
    card,
    source,
    heading: `Against ${targetTitle}`,
    note: rebuttal.shortRebuttal,
  });
}

export function getOpponentPressureFactItems(record: DebateWorkspaceRecord, limit = 4) {
  const sourceById = getSourceMap(record);
  const evidenceById = getEvidenceMap(record);
  const argumentById = new Map(
    record.workspaceSnapshot.opponentArguments.map((argument) => [argument.id, argument] as const),
  );
  const myArguments = record.workspaceSnapshot.myArguments;

  const items = record.workspaceSnapshot.rebuttals.flatMap((rebuttal) => {
    const targetArgument = argumentById.get(rebuttal.targetArgumentId);
    if (!targetArgument) {
      return [];
    }

    const directItems = rebuttal.bestEvidenceIds.flatMap((cardId) => {
      const card = evidenceById.get(cardId);
      const source = card ? sourceById.get(card.sourceId) : undefined;
      if (!card || !source) {
        return [];
      }
      const item = buildOpponentPressureFact({
        rebuttal,
        card,
        source,
        targetTitle: targetArgument.title,
      });
      return item ? [item] : [];
    });

    if (directItems.length > 0) {
      return directItems;
    }

    const targetItems = targetArgument.evidenceCardIds.flatMap((cardId) => {
      const card = evidenceById.get(cardId);
      const source = card ? sourceById.get(card.sourceId) : undefined;
      if (!card || !source) {
        return [];
      }
      const item = buildOpponentPressureFact({
        rebuttal,
        card,
        source,
        targetTitle: targetArgument.title,
      });
      return item ? [item] : [];
    });

    if (targetItems.length > 0) {
      return targetItems;
    }

    const fallbackArgument = myArguments.find((argument) =>
      argument.criterionTags.some((tag) => targetArgument.criterionTags.includes(tag)),
    );

    if (!fallbackArgument) {
      return [];
    }

    return fallbackArgument.evidenceCardIds.flatMap((cardId) => {
      const card = evidenceById.get(cardId);
      const source = card ? sourceById.get(card.sourceId) : undefined;
      if (!card || !source) {
        return [];
      }
      const item = buildOpponentPressureFact({
        rebuttal,
        card,
        source,
        targetTitle: targetArgument.title,
      });
      return item ? [item] : [];
    });
  });

  return dedupeFacts(items).slice(0, limit);
}

export function getRebuttalQuestionItems(record: DebateWorkspaceRecord, limit = 5): RebuttalQuestionItem[] {
  return record.workspaceSnapshot.crossExam
    .filter((item) => item.type === "ask_them" || item.type === "trap")
    .slice(0, limit)
    .map((item: CrossExamItem) => ({
      id: item.id,
      question: item.question,
      note: item.note,
      typeLabel: item.type === "trap" ? "Trap question" : "Cross-ex question",
    }));
}
