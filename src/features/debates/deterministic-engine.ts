import { nanoid } from "nanoid";
import { createPackCriteria, inferDomainPack } from "@/features/debates/domain-packs";
import type {
  ArgumentBlock,
  CrossExamItem,
  DebateAnalysis,
  DebateCriterion,
  DebateSetupInput,
  DebateWorkspaceSnapshot,
  DebateSide,
  EvidenceCard,
  FramingGuide,
  JudgeSummary,
  LiveSheet,
  PracticePlan,
  ResearchQuery,
  RebuttalPack,
  SourceDocument,
  SpeechDraft,
  VulnerabilityEntry,
} from "@/features/debates/types";

const stopWords = new Set([
  "the",
  "and",
  "that",
  "with",
  "from",
  "what",
  "should",
  "would",
  "could",
  "this",
  "their",
  "about",
  "into",
  "your",
  "than",
  "have",
  "will",
  "best",
  "source",
  "future",
]);

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function extractKeywords(...parts: string[]) {
  const counts = new Map<string, number>();
  for (const token of parts.join(" ").toLowerCase().match(/[a-z][a-z-]{2,}/g) ?? []) {
    if (stopWords.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([token]) => token);
}

function inferTimeframe(resolution: string) {
  const lower = resolution.toLowerCase();
  if (lower.includes("future") || lower.includes("long-term")) {
    return "Long-term planning with near-term proof matters most.";
  }
  if (lower.includes("immediately") || lower.includes("now")) {
    return "Short-term effectiveness and implementation speed are central.";
  }
  if (lower.includes("should")) {
    return "The debate focuses on practical standards and comparative outcomes.";
  }
  return "The timeframe is mixed, so both immediate and durable impacts matter.";
}

function sideCriterionAffinity(
  side: string,
  criterionName: string,
  pack = inferDomainPack(side, side, ""),
) {
  const lowerSide = side.toLowerCase();
  let score = 0;
  for (const [keyword, profile] of Object.entries(pack.sideKeywordProfiles)) {
    if (lowerSide.includes(keyword)) {
      if (profile.strengths.includes(criterionName)) score += 2;
      if (profile.weaknesses.includes(criterionName)) score -= 2;
    }
  }
  return score;
}

function buildCriteria(setup: DebateSetupInput) {
  const pack = inferDomainPack(setup.resolution, setup.mySide, setup.opponentSide);
  return createPackCriteria(pack, (criterion) => {
    const myScore = sideCriterionAffinity(setup.mySide, criterion, pack);
    const opponentScore = sideCriterionAffinity(setup.opponentSide, criterion, pack);
    if (myScore === opponentScore) return "neutral";
    return myScore > opponentScore ? "mine" : "opponent";
  }).sort((a, b) => b.importanceScore - a.importanceScore);
}

export function buildResearchQueries(
  setup: DebateSetupInput,
  criteria: DebateCriterion[],
) {
  return criteria.slice(0, 5).flatMap((criterion) => {
    const criterionSlug = criterion.name.toLowerCase();
    const common = `debate ${setup.resolution} ${criterionSlug}`;
    return [
      {
        id: nanoid(),
        query: `${setup.mySide} ${criterionSlug} evidence ${setup.regionContext ?? ""}`.trim(),
        purpose: `Find evidence that supports ${setup.mySide} on ${criterion.name.toLowerCase()}.`,
        side: "mine" as const,
        criterionTags: [criterion.name],
        preferredSourceTypes: setup.allowedSourceTypes,
      },
      {
        id: nanoid(),
        query: `${setup.opponentSide} ${criterionSlug} evidence ${setup.regionContext ?? ""}`.trim(),
        purpose: `Find the strongest likely case for ${setup.opponentSide}.`,
        side: "opponent" as const,
        criterionTags: [criterion.name],
        preferredSourceTypes: setup.allowedSourceTypes,
      },
      {
        id: nanoid(),
        query: `${common} trusted source data`,
        purpose: `Audit the criterion and find neutral evidence on ${criterion.name.toLowerCase()}.`,
        side: "neutral" as const,
        criterionTags: [criterion.name],
        preferredSourceTypes: setup.allowedSourceTypes,
      },
    ] satisfies ResearchQuery[];
  });
}

function confidenceFromSource(source: SourceDocument) {
  if (source.credibilityScore >= 0.88 && source.directnessScore >= 0.7) return "high" as const;
  if (source.credibilityScore >= 0.72) return "medium" as const;
  return "guarded" as const;
}

function findSnippet(source: SourceDocument) {
  const pool = source.processedText || source.excerpt;
  const sentences = pool.split(/(?<=[.!?])\s+/).filter(Boolean);
  return (
    sentences.find((sentence) =>
      /\d|percent|increase|decrease|emissions|cost|reliability/i.test(sentence),
    ) ??
    sentences[0] ??
    source.excerpt
  );
}

export function buildEvidenceCards(
  sources: SourceDocument[],
  criteria: DebateCriterion[],
) {
  return sources.map((source) => {
    const primaryCriterion =
      source.criterionTags[0] ??
      criteria.find((criterion) =>
        source.excerpt.toLowerCase().includes(criterion.name.toLowerCase().split(" ")[0]),
      )?.name ??
      criteria[0]?.name ??
      "Decision quality";

    const excerpt = findSnippet(source);
    const confidenceLabel = confidenceFromSource(source);
    const weakness =
      source.freshnessScore < 0.55
        ? "This source may be stale relative to fast-changing topics."
        : source.directnessScore < 0.6
          ? "This evidence is useful but somewhat indirect for the claim."
          : "The main weakness is that the opponent can contest interpretation rather than source quality.";

    const supportedClaim = `${sentenceCase(primaryCriterion)} is a live decision standard in this round, and this source supports a comparison relevant to that standard.`;
    return {
      id: nanoid(),
      sourceId: source.id,
      sideRelevance: source.sideIntent,
      criterionTags: [primaryCriterion],
      supportedClaim,
      excerpt,
      interpretation: `${source.organization} provides evidence that can be read to support a ${primaryCriterion.toLowerCase()} comparison.`,
      debateSummary: `Use this card when you want a concise, source-backed point on ${primaryCriterion.toLowerCase()}.`,
      confidenceLabel,
      weaknessNote: weakness,
      favorite: source.credibilityScore >= 0.88,
      credibilityLabel: source.credibilityLabel,
      whyItMatters: `${primaryCriterion} is decisive when judges care about comparative outcomes instead of slogans.`,
      plainEnglish: `In plain English: this source helps explain ${primaryCriterion.toLowerCase()} in a way a judge can follow quickly.`,
      possibleWeakness: weakness,
      claimUnits: [
        { id: nanoid(), layer: "fact", text: excerpt, evidenceCardIds: [] },
        {
          id: nanoid(),
          layer: "interpretation",
          text: `${source.organization} is relevant because it speaks directly to ${primaryCriterion.toLowerCase()}.`,
          evidenceCardIds: [],
        },
        {
          id: nanoid(),
          layer: "inference",
          text: `This suggests the side that performs better on ${primaryCriterion.toLowerCase()} gains an important edge.`,
          evidenceCardIds: [],
        },
        {
          id: nanoid(),
          layer: "impact",
          text: `${primaryCriterion} changes who looks more credible under judge pressure.`,
          evidenceCardIds: [],
        },
      ],
      provenance: "heuristic" as const,
    } satisfies EvidenceCard;
  });
}

function rankArguments(
  cards: EvidenceCard[],
  criteria: DebateCriterion[],
  side: DebateSide,
  sideName: string,
  opponentName: string,
) {
  const grouped = new Map<string, EvidenceCard[]>();
  for (const card of cards) {
    if (card.sideRelevance !== side && card.sideRelevance !== "neutral") continue;
    const key = card.criterionTags[0] ?? "Decision quality";
    grouped.set(key, [...(grouped.get(key) ?? []), card]);
  }

  const ranked: ArgumentBlock[] = [];
  for (const criterion of criteria) {
    const matching = grouped.get(criterion.name) ?? [];
    const leadCard = matching[0];
    if (!leadCard) continue;
    const vulnerabilityLabel: ArgumentBlock["vulnerabilityLabel"] = matching.some(
      (card) =>
        card.credibilityLabel === "Limited trust" ||
        card.credibilityLabel === "Use with caution",
    )
      ? "medium"
      : "low";

    ranked.push({
      id: nanoid(),
      side,
      title: `${sideName} on ${criterion.name}`,
      claim: `${sideName} is better positioned than ${opponentName} on ${criterion.name.toLowerCase()} because verified evidence supports that comparison.`,
      reasoning: `${leadCard.interpretation} Tie that evidence directly to ${criterion.name.toLowerCase()} and explain why that standard decides the round.`,
      impact: `If the judge prioritizes ${criterion.name.toLowerCase()}, this argument gives ${sideName} a credible path to win the round.`,
      confidenceLabel: leadCard.confidenceLabel,
      vulnerabilityLabel,
      rankScore:
        criterion.importanceScore +
        matching.length * 0.08 +
        (leadCard.credibilityLabel === "High trust" ? 0.1 : 0.04),
      speakingShort: `${sideName} wins ${criterion.name.toLowerCase()} because ${leadCard.plainEnglish.toLowerCase()}`,
      speakingLong: `${sideName} should frame the round around ${criterion.name.toLowerCase()}. ${leadCard.plainEnglish} ${leadCard.whyItMatters}`,
      simpleVersion: `On ${criterion.name.toLowerCase()}, ${sideName} has better proof.`,
      likelyOpponentAttack: `The opponent will argue the evidence is incomplete or that ${criterion.name.toLowerCase()} should not decide the round.`,
      defense: `Keep the standard tight: explain why ${criterion.name.toLowerCase()} is practical, comparative, and directly supported by your evidence.`,
      evidenceCardIds: matching.slice(0, 2).map((card) => card.id),
      criterionTags: [criterion.name],
      provenance: "template",
    });
  }

  return ranked.sort((a, b) => b.rankScore - a.rankScore).slice(0, 5);
}

function buildRebuttalPacks(
  myArguments: ArgumentBlock[],
  opponentArguments: ArgumentBlock[],
) {
  return opponentArguments.slice(0, 5).map((argument, index) => {
    const answer = myArguments.find((item) =>
      item.criterionTags.some((tag) => argument.criterionTags.includes(tag)),
    );
    const criterion = argument.criterionTags[0]?.toLowerCase() ?? "the judge's standard";
    return {
      id: nanoid(),
      targetArgumentId: argument.id,
      shortRebuttal: answer
        ? `Even on ${criterion}, ${answer.title.toLowerCase()} has stronger verified support.`
        : `They are overclaiming ${criterion} without enough decisive proof.`,
      mediumRebuttal: answer
        ? `Answer by conceding the criterion matters, then flipping it: ${answer.reasoning}`
        : `Press them on directness, recency, and whether their evidence actually proves comparative advantage.`,
      longRebuttal: answer
        ? `${answer.reasoning} Then explain why their version of ${criterion} relies on weaker assumptions or thinner evidence.`
        : `Use a two-step response: first challenge whether their evidence directly proves their claim, then argue that the round should be decided on standards where your side has stronger proof.`,
      counterCounter: "If they say you ignored their best point, return to the exact standard and force a direct comparison.",
      fallbackLine: `Their claim sounds good, but the verified evidence is not enough to carry ${criterion}.`,
      bestEvidenceIds: answer?.evidenceCardIds ?? [],
      phrasingAdvice: "Stay comparative. Do not merely deny; show why your standard and evidence are sturdier.",
      classification:
        index === 0
          ? "most_dangerous"
          : index === 1
            ? "most_likely"
            : index === 2
              ? "requires_nuance"
              : "easiest_to_beat",
      provenance: "template" as const,
    } satisfies RebuttalPack;
  });
}

function buildVulnerabilities(myArguments: ArgumentBlock[], evidenceCards: EvidenceCard[]) {
  const vulnerabilities: VulnerabilityEntry[] = myArguments.map((argument) => {
    const linkedCards = evidenceCards.filter((card) => argument.evidenceCardIds.includes(card.id));
    if (linkedCards.length === 0) {
      return {
        id: nanoid(),
        argumentId: argument.id,
        severity: "high",
        issue: `No verified evidence is linked to ${argument.title}.`,
        explanation: "This argument is strategically promising but too exposed without evidence cards attached.",
        recommendedFix: "Add at least one high-trust source or demote the claim to a framing point instead of a factual contention.",
        action: "revise",
        provenance: "heuristic",
      };
    }

    const weakestCard = linkedCards.find(
      (card) => card.credibilityLabel === "Use with caution",
    );
    return {
      id: nanoid(),
      argumentId: argument.id,
      severity:
        weakestCard?.credibilityLabel === "Use with caution"
          ? "high"
          : linkedCards.length === 1
            ? "medium"
            : "low",
      issue:
        weakestCard?.credibilityLabel === "Use with caution"
          ? `${argument.title} depends on weak or indirect sourcing.`
          : linkedCards.length === 1
            ? `${argument.title} is only supported by one card.`
            : `${argument.title} is relatively stable but still punishable if overstated.`,
      explanation:
        weakestCard?.credibilityLabel === "Use with caution"
          ? weakestCard.possibleWeakness
          : "Single-source dependence makes cross-examination easier for the opponent.",
      recommendedFix:
        weakestCard?.credibilityLabel === "Use with caution"
          ? "Use more careful wording and add a higher-trust supporting source."
          : "Add a second supporting card or narrow the claim.",
      action:
        weakestCard?.credibilityLabel === "Use with caution"
          ? "revise"
          : linkedCards.length === 1
            ? "revise"
            : "keep",
      provenance: "heuristic",
    };
  });

  if (evidenceCards.filter((card) => card.credibilityLabel === "High trust").length < 3) {
    vulnerabilities.push({
      id: nanoid(),
      severity: "high",
      issue: "The case relies on too few high-trust sources overall.",
      explanation: "Even strong strategy gets shaky if the source base is thin.",
      recommendedFix: "Prioritize more government, academic, or institutional cards before the round.",
      action: "revise",
      provenance: "heuristic",
    });
  }

  return vulnerabilities;
}

function buildCrossEx(
  myArguments: ArgumentBlock[],
  opponentArguments: ArgumentBlock[],
  vulnerabilities: VulnerabilityEntry[],
): CrossExamItem[] {
  const askThem = opponentArguments.slice(0, 3).map((argument) => ({
    id: nanoid(),
    type: "ask_them" as const,
    question: `What is your best verified evidence that ${argument.claim.toLowerCase()}?`,
    answerShort: "Use this to force them into source quality and directness.",
    answerLong: `Follow up by asking why ${argument.criterionTags[0]?.toLowerCase() ?? "their standard"} should outweigh competing standards if their proof is thin.`,
    note: "Trap them into either admitting uncertainty or overclaiming evidence quality.",
    provenance: "template" as const,
  }));

  const theyAskMe = myArguments.slice(0, 3).map((argument) => {
    const vulnerability = vulnerabilities.find((item) => item.argumentId === argument.id);
    return {
      id: nanoid(),
      type: "they_ask_me" as const,
      question: "Why should the judge trust your case more than the opponent's?",
      answerShort: `Because our case has a cleaner standard and more direct evidence on ${argument.criterionTags[0]?.toLowerCase() ?? "the key criterion"}.`,
      answerLong: vulnerability
        ? `Answer directly, then hedge the vulnerable edge: ${argument.defense} Also acknowledge limits and explain why the round still leans your way.`
        : `${argument.defense} Keep the answer comparative and tied to evidence, not just assertion.`,
      note: vulnerability ? `Do not answer like this: "${vulnerability.issue}"` : "Do not drift into vague values without returning to evidence.",
      provenance: "template" as const,
    };
  });

  const traps = myArguments.slice(0, 2).map((argument) => ({
    id: nanoid(),
    type: "trap" as const,
    question: `Would you agree that ${argument.criterionTags[0]?.toLowerCase() ?? "the deciding standard"} matters if the resolution is about practical outcomes?`,
    answerShort: "If they say yes, pin them to the standard. If they say no, they look evasive.",
    answerLong: "Use this to lock the judge into a standard that matches your evidence map.",
    note: "Ask cleanly and stop once you get the concession.",
    provenance: "template" as const,
  }));

  return [...askThem, ...theyAskMe, ...traps];
}

function buildSpeechDrafts(
  setup: DebateSetupInput,
  analysis: DebateAnalysis,
  myArguments: ArgumentBlock[],
  rebuttals: RebuttalPack[],
) {
  const topArguments = myArguments.slice(0, 3);
  const intro = `Today this debate is really about ${analysis.whatThisDebateIsReallyAbout.toLowerCase()}`;
  const evidenceAnchor = topArguments
    .map((argument) => `${argument.title}: ${argument.simpleVersion}`)
    .join(" ");

  return [
    {
      id: nanoid(),
      type: "opening",
      content: `${intro}. Our side wins because ${evidenceAnchor} The right framework is ${analysis.recommendedFraming[0]?.toLowerCase() ?? "comparative proof and practical outcomes"}.`,
      tone: setup.toneStyle,
      audienceLevel: setup.audienceLevel,
      version: 1,
      provenance: "template" as const,
    },
    {
      id: nanoid(),
      type: "body",
      content: topArguments.map((argument, index) => `${index + 1}. ${argument.speakingLong}`).join("\n\n"),
      tone: setup.toneStyle,
      audienceLevel: setup.audienceLevel,
      version: 1,
      provenance: "template" as const,
    },
    {
      id: nanoid(),
      type: "rebuttal",
      content: rebuttals
        .slice(0, 3)
        .map((rebuttal) => rebuttal.mediumRebuttal)
        .join(" "),
      tone: setup.toneStyle,
      audienceLevel: setup.audienceLevel,
      version: 1,
      provenance: "template" as const,
    },
    {
      id: nanoid(),
      type: "closing",
      content: `The clearest path to vote for our side is this: prioritize ${analysis.likelyWinningCriteria.slice(0, 2).join(" and ").toLowerCase()}, compare who actually proved those standards, and reward the side with the cleaner evidence map.`,
      tone: setup.toneStyle,
      audienceLevel: setup.audienceLevel,
      version: 1,
      provenance: "template" as const,
    },
    {
      id: nanoid(),
      type: "short",
      content: `${setup.mySide} wins on ${analysis.likelyWinningCriteria[0]?.toLowerCase() ?? "the main standard"} because our proof is more direct and more practical.`,
      tone: setup.toneStyle,
      audienceLevel: setup.audienceLevel,
      version: 1,
      provenance: "template" as const,
    },
  ] satisfies SpeechDraft[];
}

function buildLiveSheet(
  myArguments: ArgumentBlock[],
  opponentArguments: ArgumentBlock[],
  rebuttals: RebuttalPack[],
  sources: SourceDocument[],
): LiveSheet {
  return {
    id: nanoid(),
    topArguments: myArguments.slice(0, 3).map((argument) => argument.speakingShort),
    topOpponentArguments: opponentArguments.slice(0, 3).map((argument) => argument.speakingShort),
    quickestRebuttals: rebuttals.slice(0, 3).map((item) => item.shortRebuttal),
    keyStats: sources
      .slice(0, 3)
      .map((source) => `${source.organization}: ${source.excerpt.slice(0, 110)}...`),
    strongestSources: sources.slice(0, 4).map((source) => `${source.organization} | ${source.title}`),
    trapQuestions: rebuttals.slice(0, 3).map((item) => item.fallbackLine),
    closingLine: myArguments[0]?.simpleVersion ?? "Return to the clearest standard and the strongest verified source.",
    emergencyFallbackLines: [
      "Even if the judge rejects our strongest claim, the opponent still fails the practical standard.",
      "Do not concede their framework if it ignores real-world implementation.",
      "If time is short, anchor on your cleanest evidence card and your simplest comparison.",
    ],
    provenance: "template",
  };
}

function buildJudgeSummary(
  myArguments: ArgumentBlock[],
  opponentArguments: ArgumentBlock[],
  criteria: DebateCriterion[],
): JudgeSummary {
  const myScore = myArguments.reduce((sum, item) => sum + item.rankScore, 0);
  const opponentScore = opponentArguments.reduce((sum, item) => sum + item.rankScore, 0);
  const winnerLean =
    Math.abs(myScore - opponentScore) < 0.3
      ? "too_close_to_call"
      : myScore > opponentScore
        ? "mine"
        : "opponent";

  return {
    winnerLean,
    honestAssessment:
      winnerLean === "too_close_to_call"
        ? "The round currently looks close. Framework discipline and cleaner source use will matter more than raw volume."
        : winnerLean === "mine"
          ? "Your side currently has the stronger evidence map, but it still needs disciplined framing."
          : "The opponent looks stronger under the current evidence map unless you tighten the round around your best standards.",
    decisiveArguments: [...myArguments.slice(0, 2), ...opponentArguments.slice(0, 2)].map((argument) => argument.title),
    weakestLinks: [
      ...myArguments
        .filter((argument) => argument.vulnerabilityLabel !== "low")
        .slice(0, 2)
        .map((argument) => `${argument.title} needs tighter support.`),
      ...opponentArguments
        .filter((argument) => argument.vulnerabilityLabel !== "low")
        .slice(0, 1)
        .map((argument) => `${argument.title} is exposed if challenged directly.`),
    ],
    frameworkBreakdown: criteria.slice(0, 3).map((criterion) => {
      if (criterion.favorableTo === "mine") {
        return `${criterion.name}: your side benefits if the judge prioritizes practical comparison here.`;
      }
      if (criterion.favorableTo === "opponent") {
        return `${criterion.name}: the opponent benefits unless you narrow the standard or challenge their proof.`;
      }
      return `${criterion.name}: this criterion is live for both sides and likely becomes a clash point.`;
    }),
    improvementAdvice: [
      "Keep returning to the same two winning standards.",
      "Use short evidence summaries instead of general claims under pressure.",
      "Do not spend equal time on side issues if the clash is clearly narrower.",
    ],
    provenance: "heuristic",
  };
}

function buildPracticePlan(
  myArguments: ArgumentBlock[],
  rebuttals: RebuttalPack[],
): PracticePlan {
  return {
    aggressiveness: "medium",
    rounds: [
      {
        id: nanoid(),
        phase: "opening",
        prompt: `Deliver a 60-second opening anchored on ${myArguments[0]?.title ?? "your best argument"}.`,
        expectedFocus: ["framework", "top argument", "clear standard"],
      },
      {
        id: nanoid(),
        phase: "cross_ex",
        prompt: `Answer a hostile cross-ex question about ${myArguments[0]?.criterionTags[0] ?? "your main standard"}.`,
        expectedFocus: ["evidence quality", "comparison", "no overclaiming"],
      },
      {
        id: nanoid(),
        phase: "rebuttal",
        prompt: `Give a rebuttal using: ${rebuttals[0]?.shortRebuttal ?? "a short comparative answer"}`,
        expectedFocus: ["direct clash", "brevity", "comparative weighing"],
      },
      {
        id: nanoid(),
        phase: "closing",
        prompt: "Close the round in under 30 seconds without introducing new material.",
        expectedFocus: ["weighing", "clarity", "confidence"],
      },
    ],
    feedbackRubric: [
      "Use direct evidence instead of vague claims.",
      "Keep the framework consistent from start to finish.",
      "Answer the question you were asked before pivoting.",
      "Avoid overstating certainty when evidence is mixed.",
    ],
    provenance: "template",
  };
}

export function buildAnalysis(
  setup: DebateSetupInput,
  criteria: DebateCriterion[],
): DebateAnalysis {
  const keywords = extractKeywords(setup.resolution, setup.mySide, setup.opponentSide);
  const favorableToMine = criteria.filter((criterion) => criterion.favorableTo === "mine");
  const favorableToOpponent = criteria.filter((criterion) => criterion.favorableTo === "opponent");

  return {
    whatThisDebateIsReallyAbout: `which side better satisfies the most practical decision standards for ${setup.resolution.toLowerCase()}`,
    keyTerms: keywords,
    implicitAssumptions: [
      "The resolution should be judged comparatively, not in isolation.",
      "Winning depends on the criteria the judge adopts, not just the number of arguments.",
      "Evidence quality matters more than unverified breadth.",
    ],
    timeframe: inferTimeframe(setup.resolution),
    likelyWinningCriteria: criteria.slice(0, 5).map((criterion) => criterion.name),
    criteriaFavorableToMySide: favorableToMine.map((criterion) => criterion.name),
    criteriaFavorableToOpponent: favorableToOpponent.map((criterion) => criterion.name),
    recommendedFraming: [
      `Anchor the round on ${criteria.slice(0, 2).map((criterion) => criterion.name.toLowerCase()).join(" and ")} because they are practical and judge-friendly.`,
      "Keep standards comparative: which side solves more with fewer exposed tradeoffs?",
    ],
    framingToAvoid: [
      "Do not let the round drift into values with no measurable comparison.",
      "Do not promise certainty the evidence cannot sustain.",
    ],
    keyClashPoints: criteria.slice(0, 4).map(
      (criterion) => `${criterion.name}: both sides need to prove why this standard favors them.`,
    ),
    researchPlanSummary: criteria.slice(0, 4).map(
      (criterion) => `Pull two high-trust sources on ${criterion.name.toLowerCase()} for each side before final speeches.`,
    ),
    provenance: "heuristic",
  };
}

export function buildFramingGuide(
  setup: DebateSetupInput,
  criteria: DebateCriterion[],
  analysis: DebateAnalysis,
): FramingGuide {
  const bestMine = criteria.find((criterion) => criterion.favorableTo === "mine") ?? criteria[0];
  const bestOpponent = criteria.find((criterion) => criterion.favorableTo === "opponent") ?? criteria[1] ?? criteria[0];
  return {
    winningFramework: `${setup.mySide} should frame the round around ${bestMine.name.toLowerCase()} and comparative practicality.`,
    opponentFramework: `${setup.opponentSide} will likely frame around ${bestOpponent.name.toLowerCase()} unless forced into your standards.`,
    steeringAdvice: [
      `Open by defining ${bestMine.name.toLowerCase()} as the judge's cleanest standard.`,
      "Use the same standards in opening, rebuttal, and closing to avoid drift.",
      "Cut side issues fast if they do not decide the criteria stack.",
    ],
    trapsToAvoid: analysis.framingToAvoid,
    clashPoints: analysis.keyClashPoints,
    provenance: "heuristic",
  };
}

export function buildWorkspaceSnapshot(
  setup: DebateSetupInput,
  sources: SourceDocument[],
): DebateWorkspaceSnapshot {
  const criteria = buildCriteria(setup);
  const analysis = buildAnalysis(setup, criteria);
  const framing = buildFramingGuide(setup, criteria, analysis);
  const researchQueries = buildResearchQueries(setup, criteria);
  const evidenceCards = buildEvidenceCards(sources, criteria);
  const myArguments = rankArguments(evidenceCards, criteria, "mine", setup.mySide, setup.opponentSide);
  const opponentArguments = rankArguments(
    evidenceCards,
    criteria,
    "opponent",
    setup.opponentSide,
    setup.mySide,
  );
  const rebuttals = buildRebuttalPacks(myArguments, opponentArguments);
  const vulnerabilities = buildVulnerabilities(myArguments, evidenceCards);
  const crossExam = buildCrossEx(myArguments, opponentArguments, vulnerabilities);
  const speechDrafts = buildSpeechDrafts(setup, analysis, myArguments, rebuttals);
  const liveSheet = buildLiveSheet(myArguments, opponentArguments, rebuttals, sources);
  const judgeSummary = buildJudgeSummary(myArguments, opponentArguments, criteria);
  const practicePlan = buildPracticePlan(myArguments, rebuttals);

  return {
    analysis,
    framing,
    criteria,
    researchQueries,
    sourceDocuments: sources,
    evidenceCards,
    myArguments,
    opponentArguments,
    rebuttals,
    vulnerabilities,
    crossExam,
    speechDrafts,
    liveSheet,
    judgeSummary,
    practicePlan,
  };
}
