import {
  buildModules,
  type DebateWorkspaceRecord,
  type DebateWorkspaceSnapshot,
  type WorkspaceOverlay,
} from "@/features/debates/types";

function createDefaultModuleState() {
  return Object.fromEntries(
    buildModules.map((module) => [module, { collapsed: false, pinned: false }]),
  ) as WorkspaceOverlay["moduleState"];
}

export function createDefaultWorkspaceOverlay(
  snapshot: DebateWorkspaceSnapshot,
): WorkspaceOverlay {
  return {
    pinnedArgumentIds: [],
    pinnedRebuttalIds: [],
    selectedWinningPath: snapshot.framing.winningFramework,
    speechEdits: {},
    notes: {},
    simplifiedPhrasing: {},
    liveSheetOrder: {
      argumentIds: [],
      rebuttalIds: [],
      trapQuestionIds: [],
    },
    moduleState: createDefaultModuleState(),
  };
}

export function normalizeWorkspaceOverlay(
  overlay: Partial<WorkspaceOverlay> | undefined,
  snapshot: DebateWorkspaceSnapshot,
): WorkspaceOverlay {
  const defaults = createDefaultWorkspaceOverlay(snapshot);
  return {
    ...defaults,
    ...overlay,
    speechEdits: {
      ...defaults.speechEdits,
      ...(overlay?.speechEdits ?? {}),
    },
    notes: {
      ...defaults.notes,
      ...(overlay?.notes ?? {}),
    },
    simplifiedPhrasing: {
      ...defaults.simplifiedPhrasing,
      ...(overlay?.simplifiedPhrasing ?? {}),
    },
    liveSheetOrder: {
      ...defaults.liveSheetOrder,
      ...(overlay?.liveSheetOrder ?? {}),
    },
    moduleState: {
      ...defaults.moduleState,
      ...(overlay?.moduleState ?? {}),
    },
  };
}

export function getEffectiveSpeechContent(
  debate: DebateWorkspaceRecord,
  type: keyof WorkspaceOverlay["speechEdits"],
) {
  return (
    debate.workspaceOverlay.speechEdits[type] ??
    debate.workspaceSnapshot.speechDrafts.find((draft) => draft.type === type)?.content ??
    ""
  );
}

export function getEffectiveLiveArguments(debate: DebateWorkspaceRecord) {
  const order = debate.workspaceOverlay.liveSheetOrder.argumentIds;
  const pinned = debate.workspaceOverlay.pinnedArgumentIds;
  const phrases = debate.workspaceOverlay.simplifiedPhrasing;
  const byId = new Map(
    debate.workspaceSnapshot.myArguments.map((argument) => [argument.id, argument] as const),
  );

  const prioritizedIds = [...order, ...pinned].filter(
    (id, index, list) => byId.has(id) && list.indexOf(id) === index,
  );
  const prioritized = prioritizedIds.map((id) => byId.get(id)!);
  const fallback = debate.workspaceSnapshot.myArguments.filter(
    (argument) => !prioritizedIds.includes(argument.id),
  );

  return [...prioritized, ...fallback].slice(0, 3).map(
    (argument) => phrases[argument.id] || argument.speakingShort,
  );
}

export function getEffectiveLiveRebuttals(debate: DebateWorkspaceRecord) {
  const order = debate.workspaceOverlay.liveSheetOrder.rebuttalIds;
  const pinned = debate.workspaceOverlay.pinnedRebuttalIds;
  const byId = new Map(
    debate.workspaceSnapshot.rebuttals.map((rebuttal) => [rebuttal.id, rebuttal] as const),
  );

  const prioritizedIds = [...order, ...pinned].filter(
    (id, index, list) => byId.has(id) && list.indexOf(id) === index,
  );
  const prioritized = prioritizedIds.map((id) => byId.get(id)!);
  const fallback = debate.workspaceSnapshot.rebuttals.filter(
    (rebuttal) => !prioritizedIds.includes(rebuttal.id),
  );

  return [...prioritized, ...fallback].slice(0, 3).map((rebuttal) => rebuttal.shortRebuttal);
}

export function getEffectiveTrapQuestions(debate: DebateWorkspaceRecord) {
  const order = debate.workspaceOverlay.liveSheetOrder.trapQuestionIds;
  const traps = debate.workspaceSnapshot.crossExam.filter((item) => item.type === "trap");
  const byId = new Map(traps.map((item) => [item.id, item] as const));
  const prioritizedIds = order.filter((id, index, list) => byId.has(id) && list.indexOf(id) === index);
  const prioritized = prioritizedIds.map((id) => byId.get(id)!);
  const fallback = traps.filter((item) => !prioritizedIds.includes(item.id));

  return [...prioritized, ...fallback].slice(0, 3).map((item) => item.question);
}

export function hasWorkspaceOverlayCustomizations(overlay: WorkspaceOverlay) {
  return (
    overlay.pinnedArgumentIds.length > 0 ||
    overlay.pinnedRebuttalIds.length > 0 ||
    overlay.liveSheetOrder.argumentIds.length > 0 ||
    overlay.liveSheetOrder.rebuttalIds.length > 0 ||
    overlay.liveSheetOrder.trapQuestionIds.length > 0 ||
    Object.keys(overlay.speechEdits).length > 0 ||
    Object.keys(overlay.notes).length > 0 ||
    Object.keys(overlay.simplifiedPhrasing).length > 0
  );
}
