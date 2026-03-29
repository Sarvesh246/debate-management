import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type {
  DebateWorkspaceSnapshot,
  LiveSheet,
  PracticeSessionRecord,
} from "@/features/debates/types";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  preferences: jsonb("preferences").$type<Record<string, unknown>>().notNull().default({}),
});

export const debateWorkspaces = pgTable(
  "debate_workspaces",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    resolution: text("resolution").notNull(),
    mySide: text("my_side").notNull(),
    opponentSide: text("opponent_side").notNull(),
    format: text("format").notNull(),
    audienceLevel: text("audience_level").notNull(),
    timeLimits: jsonb("time_limits")
      .$type<{ speech: number; rebuttal: number; crossExam: number }>()
      .notNull(),
    sourcePreferences: jsonb("source_preferences")
      .$type<{
        mode: string;
        allowedSourceTypes: string[];
        whitelist: string[];
        blacklist: string[];
      }>()
      .notNull(),
    trustMode: text("trust_mode").notNull(),
    regionContext: text("region_context"),
    toneStyle: text("tone_style").notNull(),
    objectiveMode: text("objective_mode").notNull(),
    status: text("status").notNull(),
    generationMode: text("generation_mode").notNull(),
    providerStatus: text("provider_status").notNull(),
    degradationReason: text("degradation_reason"),
    workspaceSnapshot: jsonb("workspace_snapshot").$type<DebateWorkspaceSnapshot>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userUpdatedIdx: index("debate_workspaces_user_updated_idx").on(table.userId, table.updatedAt),
  }),
);

export const debateCriteria = pgTable(
  "debate_criteria",
  {
    id: text("id").primaryKey(),
    debateId: text("debate_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    favorableTo: text("favorable_to").notNull(),
    importanceScore: real("importance_score").notNull(),
    explanation: text("explanation").notNull(),
  },
  (table) => ({
    debateIdx: index("debate_criteria_debate_idx").on(table.debateId),
  }),
);

export const sourceDocuments = pgTable(
  "source_documents",
  {
    id: text("id").primaryKey(),
    debateId: text("debate_id").notNull(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    author: text("author"),
    organization: text("organization").notNull(),
    publishedAt: text("published_at"),
    sourceType: text("source_type").notNull(),
    credibilityScore: real("credibility_score").notNull(),
    credibilityLabel: text("credibility_label").notNull(),
    directnessScore: real("directness_score").notNull(),
    freshnessScore: real("freshness_score").notNull(),
    contentHash: text("content_hash"),
    processedText: text("processed_text"),
    excerpt: text("excerpt").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    queryId: text("query_id"),
    sideIntent: text("side_intent").notNull(),
    criterionTags: jsonb("criterion_tags").$type<string[]>().notNull().default([]),
    provenance: text("provenance").notNull().default("heuristic"),
  },
  (table) => ({
    debateIdx: index("source_documents_debate_idx").on(table.debateId),
    trustIdx: index("source_documents_trust_idx").on(table.credibilityLabel),
  }),
);

export const evidenceCards = pgTable(
  "evidence_cards",
  {
    id: text("id").primaryKey(),
    debateId: text("debate_id").notNull(),
    sourceId: text("source_id").notNull(),
    sideRelevance: text("side_relevance").notNull(),
    criterionTags: jsonb("criterion_tags").$type<string[]>().notNull().default([]),
    supportedClaim: text("supported_claim").notNull(),
    excerpt: text("excerpt").notNull(),
    interpretation: text("interpretation").notNull(),
    debateSummary: text("debate_summary").notNull(),
    confidenceLabel: text("confidence_label").notNull(),
    weaknessNote: text("weakness_note").notNull(),
    favorite: boolean("favorite").notNull().default(false),
    credibilityLabel: text("credibility_label").notNull(),
    whyItMatters: text("why_it_matters").notNull(),
    plainEnglish: text("plain_english").notNull(),
    possibleWeakness: text("possible_weakness").notNull(),
    claimUnits: jsonb("claim_units").$type<Array<{ id: string; layer: string; text: string; evidenceCardIds: string[] }>>().notNull(),
    provenance: text("provenance").notNull(),
  },
  (table) => ({
    debateIdx: index("evidence_cards_debate_idx").on(table.debateId),
  }),
);

export const argumentsTable = pgTable(
  "arguments",
  {
    id: text("id").primaryKey(),
    debateId: text("debate_id").notNull(),
    side: text("side").notNull(),
    title: text("title").notNull(),
    claim: text("claim").notNull(),
    reasoning: text("reasoning").notNull(),
    impact: text("impact").notNull(),
    confidenceLabel: text("confidence_label").notNull(),
    vulnerabilityLabel: text("vulnerability_label").notNull(),
    rankScore: real("rank_score").notNull(),
    speakingShort: text("speaking_short").notNull(),
    speakingLong: text("speaking_long").notNull(),
    simpleVersion: text("simple_version").notNull(),
    likelyOpponentAttack: text("likely_opponent_attack").notNull(),
    defense: text("defense").notNull(),
    evidenceCardIds: jsonb("evidence_card_ids").$type<string[]>().notNull().default([]),
    criterionTags: jsonb("criterion_tags").$type<string[]>().notNull().default([]),
    provenance: text("provenance").notNull(),
  },
  (table) => ({
    debateIdx: index("arguments_debate_idx").on(table.debateId),
    rankIdx: index("arguments_rank_idx").on(table.rankScore),
  }),
);

export const argumentEvidenceLinks = pgTable(
  "argument_evidence_links",
  {
    id: text("id").primaryKey(),
    argumentId: text("argument_id").notNull(),
    evidenceCardId: text("evidence_card_id").notNull(),
    supportStrength: real("support_strength").notNull(),
  },
  (table) => ({
    argumentIdx: index("argument_evidence_links_argument_idx").on(table.argumentId),
  }),
);

export const rebuttals = pgTable(
  "rebuttals",
  {
    id: text("id").primaryKey(),
    debateId: text("debate_id").notNull(),
    targetArgumentId: text("target_argument_id").notNull(),
    shortRebuttal: text("short_rebuttal").notNull(),
    mediumRebuttal: text("medium_rebuttal").notNull(),
    longRebuttal: text("long_rebuttal").notNull(),
    counterCounter: text("counter_counter").notNull(),
    fallbackLine: text("fallback_line").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    provenance: text("provenance").notNull(),
  },
  (table) => ({
    debateIdx: index("rebuttals_debate_idx").on(table.debateId),
  }),
);

export const vulnerabilities = pgTable(
  "vulnerabilities",
  {
    id: text("id").primaryKey(),
    debateId: text("debate_id").notNull(),
    argumentId: text("argument_id"),
    severity: text("severity").notNull(),
    issue: text("issue").notNull(),
    explanation: text("explanation").notNull(),
    recommendedFix: text("recommended_fix").notNull(),
    action: text("action").notNull(),
    provenance: text("provenance").notNull(),
  },
  (table) => ({
    debateIdx: index("vulnerabilities_debate_idx").on(table.debateId),
  }),
);

export const crossExamItems = pgTable(
  "cross_exam_items",
  {
    id: text("id").primaryKey(),
    debateId: text("debate_id").notNull(),
    type: text("type").notNull(),
    question: text("question").notNull(),
    answerShort: text("answer_short").notNull(),
    answerLong: text("answer_long").notNull(),
    note: text("note").notNull(),
    provenance: text("provenance").notNull(),
  },
  (table) => ({
    debateIdx: index("cross_exam_items_debate_idx").on(table.debateId),
  }),
);

export const speechDrafts = pgTable(
  "speech_drafts",
  {
    id: text("id").primaryKey(),
    debateId: text("debate_id").notNull(),
    type: text("type").notNull(),
    content: text("content").notNull(),
    tone: text("tone").notNull(),
    audienceLevel: text("audience_level").notNull(),
    version: integer("version").notNull(),
    provenance: text("provenance").notNull(),
  },
  (table) => ({
    debateIdx: index("speech_drafts_debate_idx").on(table.debateId),
  }),
);

export const liveSheets = pgTable("live_sheets", {
  id: text("id").primaryKey(),
  debateId: text("debate_id").notNull(),
  content: jsonb("content").$type<LiveSheet>().notNull(),
  version: integer("version").notNull(),
  provenance: text("provenance").notNull(),
});

export const debateRuns = pgTable("debate_runs", {
  id: text("id").primaryKey(),
  debateId: text("debate_id").notNull(),
  generationMode: text("generation_mode").notNull(),
  providerStatus: text("provider_status").notNull(),
  degradationReason: text("degradation_reason"),
  status: text("status").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const practiceSessions = pgTable("practice_sessions", {
  id: text("id").primaryKey(),
  debateId: text("debate_id").notNull(),
  transcript: jsonb("transcript").$type<PracticeSessionRecord["transcript"]>().notNull(),
  score: jsonb("score").$type<PracticeSessionRecord["score"]>().notNull(),
  feedback: jsonb("feedback").$type<PracticeSessionRecord["feedback"]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const exportRecords = pgTable("export_records", {
  id: text("id").primaryKey(),
  debateId: text("debate_id").notNull(),
  format: text("format").notNull(),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SourceDocumentRow = typeof sourceDocuments.$inferSelect;
export type EvidenceCardRow = typeof evidenceCards.$inferSelect;
export type DebateWorkspaceRow = typeof debateWorkspaces.$inferSelect;
export type DebateCriterionRow = typeof debateCriteria.$inferSelect;
