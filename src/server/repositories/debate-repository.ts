import { eq } from "drizzle-orm";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import {
  canUseLocalWorkspaceMode,
  DEPLOYED_SUPABASE_CONFIG_ERROR,
  isSupabaseConfigured,
} from "@/lib/env";
import type {
  DebateRunRecord,
  DebateWorkspaceRecord,
  ExportRecord,
  PracticeSessionRecord,
  WorkspaceOverlay,
} from "@/features/debates/types";
import { normalizeWorkspaceOverlay } from "@/features/debates/workspace-overlay";
import { getDb } from "@/server/db";
import {
  argumentEvidenceLinks,
  argumentsTable,
  crossExamItems,
  debateCriteria,
  debateRuns,
  debateWorkspaces,
  evidenceCards,
  exportRecords,
  liveSheets,
  practiceSessions,
  rebuttals,
  sourceDocuments,
  speechDrafts,
  vulnerabilities,
} from "@/server/db/schema";

interface MockStore {
  debates: DebateWorkspaceRecord[];
  practiceSessions: PracticeSessionRecord[];
  exportRecords: ExportRecord[];
  debateRuns: DebateRunRecord[];
}

const MOCK_STORE_PATH = path.join(process.cwd(), ".data", "mock-store.json");
let mockStoreMutationQueue: Promise<void> = Promise.resolve();

async function ensureMockStore(): Promise<MockStore> {
  await mkdir(path.dirname(MOCK_STORE_PATH), { recursive: true });

  try {
    const contents = await readFile(MOCK_STORE_PATH, "utf8");
    return JSON.parse(contents) as MockStore;
  } catch {
    const emptyStore: MockStore = {
      debates: [],
      practiceSessions: [],
      exportRecords: [],
      debateRuns: [],
    };
    await writeFile(MOCK_STORE_PATH, JSON.stringify(emptyStore, null, 2));
    return emptyStore;
  }
}

async function persistMockStore(store: MockStore) {
  await writeFile(MOCK_STORE_PATH, JSON.stringify(store, null, 2));
}

async function waitForMockStoreIdle() {
  await mockStoreMutationQueue;
}

async function withMockStoreLock<T>(task: () => Promise<T>) {
  const next = mockStoreMutationQueue.then(task, task);
  mockStoreMutationQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export interface DebateRepository {
  listDebates(userId: string): Promise<DebateWorkspaceRecord[]>;
  getDebate(userId: string, debateId: string): Promise<DebateWorkspaceRecord | null>;
  saveDebate(record: DebateWorkspaceRecord, run?: DebateRunRecord): Promise<void>;
  updateWorkspaceOverlay(
    userId: string,
    debateId: string,
    overlay: WorkspaceOverlay,
  ): Promise<DebateWorkspaceRecord | null>;
  savePracticeSession(record: PracticeSessionRecord): Promise<void>;
  listPracticeSessions(debateId: string): Promise<PracticeSessionRecord[]>;
  saveExportRecord(record: ExportRecord): Promise<void>;
}

export function buildDebateScopedRowId(debateId: string, localId: string) {
  return `${debateId}:${localId}`;
}

function withNormalizedOverlay(record: DebateWorkspaceRecord): DebateWorkspaceRecord {
  return {
    ...record,
    workspaceOverlay: normalizeWorkspaceOverlay(
      record.workspaceOverlay,
      record.workspaceSnapshot,
    ),
  };
}

async function createMockRepository(): Promise<DebateRepository> {
  return {
    async listDebates(userId) {
      await waitForMockStoreIdle();
      const store = await ensureMockStore();
      return store.debates
        .filter((debate) => debate.userId === userId)
        .map(withNormalizedOverlay)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async getDebate(userId, debateId) {
      await waitForMockStoreIdle();
      const store = await ensureMockStore();
      return (
        store.debates
          .filter((debate) => debate.id === debateId && debate.userId === userId)
          .map(withNormalizedOverlay)[0] ?? null
      );
    },
    async saveDebate(record, run) {
      await withMockStoreLock(async () => {
        const store = await ensureMockStore();
        const index = store.debates.findIndex((debate) => debate.id === record.id);
        if (index >= 0) {
          store.debates[index] = withNormalizedOverlay(record);
        } else {
          store.debates.push(withNormalizedOverlay(record));
        }
        if (run) {
          store.debateRuns.push(run);
        }
        await persistMockStore(store);
      });
    },
    async updateWorkspaceOverlay(userId, debateId, overlay) {
      return withMockStoreLock(async () => {
        const store = await ensureMockStore();
        const index = store.debates.findIndex(
          (debate) => debate.id === debateId && debate.userId === userId,
        );
        if (index < 0) {
          return null;
        }

        const current = withNormalizedOverlay(store.debates[index]!);
        const next = {
          ...current,
          workspaceOverlay: normalizeWorkspaceOverlay(
            overlay,
            current.workspaceSnapshot,
          ),
          updatedAt: new Date().toISOString(),
        };
        store.debates[index] = next;
        await persistMockStore(store);
        return next;
      });
    },
    async savePracticeSession(record) {
      await withMockStoreLock(async () => {
        const store = await ensureMockStore();
        store.practiceSessions.push(record);
        await persistMockStore(store);
      });
    },
    async listPracticeSessions(debateId) {
      await waitForMockStoreIdle();
      const store = await ensureMockStore();
      return store.practiceSessions.filter((session) => session.debateId === debateId);
    },
    async saveExportRecord(record) {
      await withMockStoreLock(async () => {
        const store = await ensureMockStore();
        store.exportRecords.push(record);
        await persistMockStore(store);
      });
    },
  };
}

async function createDatabaseRepository(): Promise<DebateRepository> {
  const db = getDb();
  if (!db) {
    return createMockRepository();
  }

  function mapRowToRecord(row: typeof debateWorkspaces.$inferSelect): DebateWorkspaceRecord {
    return withNormalizedOverlay({
      id: row.id,
      userId: row.userId,
      title: row.title,
      resolution: row.resolution,
      mySide: row.mySide,
      opponentSide: row.opponentSide,
      format: row.format as DebateWorkspaceRecord["format"],
      audienceLevel: row.audienceLevel as DebateWorkspaceRecord["audienceLevel"],
      timeLimits: row.timeLimits as DebateWorkspaceRecord["timeLimits"],
      sourcePreferences: row.sourcePreferences as DebateWorkspaceRecord["sourcePreferences"],
      trustMode: row.trustMode as DebateWorkspaceRecord["trustMode"],
      regionContext: row.regionContext ?? undefined,
      toneStyle: row.toneStyle,
      objectiveMode: row.objectiveMode as DebateWorkspaceRecord["objectiveMode"],
      status: row.status as DebateWorkspaceRecord["status"],
      generationMode: row.generationMode as DebateWorkspaceRecord["generationMode"],
      providerStatus: row.providerStatus as DebateWorkspaceRecord["providerStatus"],
      degradationReason: row.degradationReason ?? undefined,
      workspaceSnapshot: row.workspaceSnapshot,
      workspaceOverlay: row.workspaceOverlay,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  return {
    async listDebates(userId) {
      const rows = await db
        .select()
        .from(debateWorkspaces)
        .where(eq(debateWorkspaces.userId, userId));

      return rows.map(mapRowToRecord).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async getDebate(userId, debateId) {
      const [row] = await db
        .select()
        .from(debateWorkspaces)
        .where(eq(debateWorkspaces.id, debateId));

      if (!row || row.userId !== userId) {
        return null;
      }

      return mapRowToRecord(row);
    },
    async saveDebate(record, run) {
      await db.transaction(async (tx) => {
        await tx
          .insert(debateWorkspaces)
          .values({
            id: record.id,
            userId: record.userId,
            title: record.title,
            resolution: record.resolution,
            mySide: record.mySide,
            opponentSide: record.opponentSide,
            format: record.format,
            audienceLevel: record.audienceLevel,
            timeLimits: record.timeLimits,
            sourcePreferences: record.sourcePreferences,
            trustMode: record.trustMode,
            regionContext: record.regionContext,
            toneStyle: record.toneStyle,
            objectiveMode: record.objectiveMode,
            status: record.status,
            generationMode: record.generationMode,
            providerStatus: record.providerStatus,
            degradationReason: record.degradationReason,
            workspaceSnapshot: record.workspaceSnapshot,
            workspaceOverlay: normalizeWorkspaceOverlay(
              record.workspaceOverlay,
              record.workspaceSnapshot,
            ),
            createdAt: new Date(record.createdAt),
            updatedAt: new Date(record.updatedAt),
          })
          .onConflictDoUpdate({
            target: debateWorkspaces.id,
            set: {
              title: record.title,
              resolution: record.resolution,
              mySide: record.mySide,
              opponentSide: record.opponentSide,
              format: record.format,
              audienceLevel: record.audienceLevel,
              timeLimits: record.timeLimits,
              sourcePreferences: record.sourcePreferences,
              trustMode: record.trustMode,
              regionContext: record.regionContext,
              toneStyle: record.toneStyle,
              objectiveMode: record.objectiveMode,
              status: record.status,
              generationMode: record.generationMode,
              providerStatus: record.providerStatus,
              degradationReason: record.degradationReason,
              workspaceSnapshot: record.workspaceSnapshot,
              workspaceOverlay: normalizeWorkspaceOverlay(
                record.workspaceOverlay,
                record.workspaceSnapshot,
              ),
              updatedAt: new Date(record.updatedAt),
            },
          });

        await Promise.all([
          tx.delete(debateCriteria).where(eq(debateCriteria.debateId, record.id)),
          tx.delete(sourceDocuments).where(eq(sourceDocuments.debateId, record.id)),
          tx.delete(evidenceCards).where(eq(evidenceCards.debateId, record.id)),
          tx.delete(argumentsTable).where(eq(argumentsTable.debateId, record.id)),
          tx.delete(rebuttals).where(eq(rebuttals.debateId, record.id)),
          tx.delete(vulnerabilities).where(eq(vulnerabilities.debateId, record.id)),
          tx.delete(crossExamItems).where(eq(crossExamItems.debateId, record.id)),
          tx.delete(speechDrafts).where(eq(speechDrafts.debateId, record.id)),
          tx.delete(liveSheets).where(eq(liveSheets.debateId, record.id)),
        ]);

        if (record.workspaceSnapshot.criteria.length > 0) {
          await tx.insert(debateCriteria).values(
            record.workspaceSnapshot.criteria.map((criterion) => ({
              id: buildDebateScopedRowId(record.id, criterion.id),
              debateId: record.id,
              name: criterion.name,
              description: criterion.description,
              favorableTo: criterion.favorableTo,
              importanceScore: criterion.importanceScore,
              explanation: criterion.explanation,
            })),
          );
        }

        if (record.workspaceSnapshot.sourceDocuments.length > 0) {
          await tx.insert(sourceDocuments).values(
            record.workspaceSnapshot.sourceDocuments.map((source) => ({
              id: source.id,
              debateId: record.id,
              url: source.url,
              title: source.title,
              author: source.author,
              organization: source.organization,
              publishedAt: source.publishedAt,
              sourceType: source.sourceType,
              credibilityScore: source.credibilityScore,
              credibilityLabel: source.credibilityLabel,
              directnessScore: source.directnessScore,
              freshnessScore: source.freshnessScore,
              processedText: source.processedText,
              excerpt: source.excerpt,
              metadata: source.metadata,
              queryId: source.queryId,
              sideIntent: source.sideIntent,
              criterionTags: source.criterionTags,
              provenance: "heuristic",
            })),
          );
        }

        if (record.workspaceSnapshot.evidenceCards.length > 0) {
          await tx.insert(evidenceCards).values(
            record.workspaceSnapshot.evidenceCards.map((card) => ({
              id: card.id,
              debateId: record.id,
              sourceId: card.sourceId,
              sideRelevance: card.sideRelevance,
              criterionTags: card.criterionTags,
              supportedClaim: card.supportedClaim,
              excerpt: card.excerpt,
              interpretation: card.interpretation,
              debateSummary: card.debateSummary,
              confidenceLabel: card.confidenceLabel,
              weaknessNote: card.weaknessNote,
              favorite: card.favorite,
              credibilityLabel: card.credibilityLabel,
              whyItMatters: card.whyItMatters,
              plainEnglish: card.plainEnglish,
              possibleWeakness: card.possibleWeakness,
              claimUnits: card.claimUnits,
              provenance: card.provenance,
            })),
          );
        }

        const argumentsToInsert = [
          ...record.workspaceSnapshot.myArguments,
          ...record.workspaceSnapshot.opponentArguments,
        ];
        if (argumentsToInsert.length > 0) {
          await tx.insert(argumentsTable).values(
            argumentsToInsert.map((argument) => ({
              id: argument.id,
              debateId: record.id,
              side: argument.side,
              title: argument.title,
              claim: argument.claim,
              reasoning: argument.reasoning,
              impact: argument.impact,
              confidenceLabel: argument.confidenceLabel,
              vulnerabilityLabel: argument.vulnerabilityLabel,
              rankScore: argument.rankScore,
              speakingShort: argument.speakingShort,
              speakingLong: argument.speakingLong,
              simpleVersion: argument.simpleVersion,
              likelyOpponentAttack: argument.likelyOpponentAttack,
              defense: argument.defense,
              evidenceCardIds: argument.evidenceCardIds,
              criterionTags: argument.criterionTags,
              provenance: argument.provenance,
            })),
          );

          const links = argumentsToInsert.flatMap((argument) =>
            argument.evidenceCardIds.map((evidenceCardId) => ({
              id: nanoid(),
              argumentId: argument.id,
              evidenceCardId,
              supportStrength: 0.8,
            })),
          );
          if (links.length > 0) {
            await tx.insert(argumentEvidenceLinks).values(links);
          }
        }

        if (record.workspaceSnapshot.rebuttals.length > 0) {
          await tx.insert(rebuttals).values(
            record.workspaceSnapshot.rebuttals.map((rebuttal) => ({
              id: rebuttal.id,
              debateId: record.id,
              targetArgumentId: rebuttal.targetArgumentId,
              shortRebuttal: rebuttal.shortRebuttal,
              mediumRebuttal: rebuttal.mediumRebuttal,
              longRebuttal: rebuttal.longRebuttal,
              counterCounter: rebuttal.counterCounter,
              fallbackLine: rebuttal.fallbackLine,
              metadata: {
                bestEvidenceIds: rebuttal.bestEvidenceIds,
                phrasingAdvice: rebuttal.phrasingAdvice,
                classification: rebuttal.classification,
              },
              provenance: rebuttal.provenance,
            })),
          );
        }

        if (record.workspaceSnapshot.vulnerabilities.length > 0) {
          await tx.insert(vulnerabilities).values(
            record.workspaceSnapshot.vulnerabilities.map((item) => ({
              id: item.id,
              debateId: record.id,
              argumentId: item.argumentId,
              severity: item.severity,
              issue: item.issue,
              explanation: item.explanation,
              recommendedFix: item.recommendedFix,
              action: item.action,
              provenance: item.provenance,
            })),
          );
        }

        if (record.workspaceSnapshot.crossExam.length > 0) {
          await tx.insert(crossExamItems).values(
            record.workspaceSnapshot.crossExam.map((item) => ({
              id: item.id,
              debateId: record.id,
              type: item.type,
              question: item.question,
              answerShort: item.answerShort,
              answerLong: item.answerLong,
              note: item.note,
              provenance: item.provenance,
            })),
          );
        }

        if (record.workspaceSnapshot.speechDrafts.length > 0) {
          await tx.insert(speechDrafts).values(
            record.workspaceSnapshot.speechDrafts.map((draft) => ({
              id: draft.id,
              debateId: record.id,
              type: draft.type,
              content: draft.content,
              tone: draft.tone,
              audienceLevel: draft.audienceLevel,
              version: draft.version,
              provenance: draft.provenance,
            })),
          );
        }

        await tx.insert(liveSheets).values({
          id: record.workspaceSnapshot.liveSheet.id,
          debateId: record.id,
          content: record.workspaceSnapshot.liveSheet,
          version: 1,
          provenance: record.workspaceSnapshot.liveSheet.provenance,
        });

        if (run) {
          await tx.insert(debateRuns).values({
            id: run.id,
            debateId: run.debateId,
            generationMode: run.generationMode,
            providerStatus: run.providerStatus,
            degradationReason: run.degradationReason,
            status: run.status,
            startedAt: new Date(run.startedAt),
            completedAt: run.completedAt ? new Date(run.completedAt) : undefined,
          });
        }
      });
    },
    async savePracticeSession(record) {
      await db.insert(practiceSessions).values({
        id: record.id,
        debateId: record.debateId,
        transcript: record.transcript,
        score: record.score,
        feedback: record.feedback,
        createdAt: new Date(record.createdAt),
      });
    },
    async listPracticeSessions(debateId) {
      const rows = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.debateId, debateId));
      return rows.map((row) => ({
        id: row.id,
        debateId: row.debateId,
        transcript: row.transcript,
        score: row.score,
        feedback: row.feedback,
        createdAt: row.createdAt.toISOString(),
      }));
    },
    async saveExportRecord(record) {
      await db.insert(exportRecords).values({
        id: record.id,
        debateId: record.debateId,
        format: record.format,
        fileUrl: record.fileUrl,
        createdAt: new Date(record.createdAt),
      });
    },
    async updateWorkspaceOverlay(userId, debateId, overlay) {
      const [current] = await db
        .select()
        .from(debateWorkspaces)
        .where(eq(debateWorkspaces.id, debateId));

      if (!current || current.userId !== userId) {
        return null;
      }

      const normalized = normalizeWorkspaceOverlay(overlay, current.workspaceSnapshot);
      await db
        .update(debateWorkspaces)
        .set({
          workspaceOverlay: normalized,
          updatedAt: new Date(),
        })
        .where(eq(debateWorkspaces.id, debateId));

      return mapRowToRecord({
        ...current,
        workspaceOverlay: normalized,
        updatedAt: new Date(),
      });
    },
  };
}

export async function getDebateRepository() {
  if (isSupabaseConfigured()) {
    return createDatabaseRepository();
  }

  if (!canUseLocalWorkspaceMode()) {
    throw new Error(DEPLOYED_SUPABASE_CONFIG_ERROR);
  }

  return createMockRepository();
}
