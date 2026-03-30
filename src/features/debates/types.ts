export const debateFormats = [
  "classroom",
  "public_forum",
  "lincoln_douglas",
  "policy",
  "panel",
  "short_timed",
] as const;

export const audienceLevels = [
  "middle_school",
  "high_school",
  "college",
  "general_public",
] as const;

export const objectiveModes = ["win", "balanced", "practice", "judge"] as const;
export const trustModes = ["teacher_safe", "balanced", "aggressive"] as const;
export const sourcePreferenceModes = [
  "academic_only",
  "government_only",
  "institutional_only",
  "mixed_reputable",
  "teacher_safe_only",
] as const;

export const primaryWorkspacePillars = [
  "understand",
  "build",
  "practice",
  "live",
] as const;

export const secondaryWorkspaceTools = [
  "sources",
  "judge",
  "export",
] as const;

export const buildModules = [
  "case",
  "opponent",
  "vulnerabilities",
  "cross_ex",
  "speeches",
] as const;

export const legacyWorkspaceSections = [
  "overview",
  "strategy",
  "arguments",
  "opponent",
  "rebuttals",
  "vulnerabilities",
  "cross-ex",
  "speech-builder",
  "practice",
  "live",
  "sources",
  "judge",
  "export",
] as const;

export type DebateFormat = (typeof debateFormats)[number];
export type AudienceLevel = (typeof audienceLevels)[number];
export type ObjectiveMode = (typeof objectiveModes)[number];
export type TrustMode = (typeof trustModes)[number];
export type SourcePreferenceMode = (typeof sourcePreferenceModes)[number];
export type WorkspacePillar = (typeof primaryWorkspacePillars)[number];
export type WorkspaceTool = (typeof secondaryWorkspaceTools)[number];
export type BuildModule = (typeof buildModules)[number];
export type LegacyWorkspaceSection = (typeof legacyWorkspaceSections)[number];

export type ProviderStatus = "ready" | "degraded" | "unavailable";
export type GenerationMode = "provider" | "deterministic";
export type Provenance = "heuristic" | "template" | "provider" | "hybrid";
export type DebateSide = "mine" | "opponent";
export type FavorableTo = DebateSide | "neutral";
export type ConfidenceLabel = "high" | "medium" | "guarded";
export type VulnerabilityLabel = "low" | "medium" | "high";
export type CredibilityLabel =
  | "High trust"
  | "Moderate trust"
  | "Limited trust"
  | "Use with caution";
export type ClaimLayer = "fact" | "interpretation" | "inference" | "impact";

export interface DebateSetupInput {
  resolution: string;
  mySide: string;
  opponentSide: string;
  format: DebateFormat;
  audienceLevel: AudienceLevel;
  speechTimeMinutes: number;
  rebuttalTimeMinutes: number;
  crossExamTimeMinutes: number;
  regionContext?: string;
  classInstructions?: string;
  toneStyle: string;
  objectiveMode: ObjectiveMode;
  trustMode: TrustMode;
  sourcePreferenceMode: SourcePreferenceMode;
  allowedSourceTypes: string[];
  sourceWhitelist: string[];
  sourceBlacklist: string[];
}

export interface CapabilityDescriptor {
  label: string;
  status: ProviderStatus;
  detail: string;
}

export interface CapabilitySnapshot {
  auth: CapabilityDescriptor;
  persistence: CapabilityDescriptor;
  publicRetrieval: CapabilityDescriptor;
  providerDiscovery: CapabilityDescriptor;
  structuredSynthesis: CapabilityDescriptor;
  practiceSimulationDepth: CapabilityDescriptor;
  overallMode: GenerationMode;
}

export interface DebateCriterion {
  id: string;
  name: string;
  description: string;
  favorableTo: FavorableTo;
  importanceScore: number;
  explanation: string;
}

export interface FramingGuide {
  winningFramework: string;
  opponentFramework: string;
  steeringAdvice: string[];
  trapsToAvoid: string[];
  clashPoints: string[];
  provenance: Provenance;
}

export interface ResearchQuery {
  id: string;
  query: string;
  purpose: string;
  side: DebateSide | "neutral";
  criterionTags: string[];
  preferredSourceTypes: string[];
}

export interface SourceDocument {
  id: string;
  url: string;
  title: string;
  author?: string;
  organization: string;
  publishedAt?: string;
  sourceType: string;
  credibilityScore: number;
  credibilityLabel: CredibilityLabel;
  directnessScore: number;
  freshnessScore: number;
  excerpt: string;
  processedText?: string;
  metadata: Record<string, unknown>;
  queryId?: string;
  sideIntent: DebateSide | "neutral";
  criterionTags: string[];
}

export interface ClaimUnit {
  id: string;
  layer: ClaimLayer;
  text: string;
  evidenceCardIds: string[];
}

export interface EvidenceCard {
  id: string;
  sourceId: string;
  sideRelevance: DebateSide | "neutral";
  criterionTags: string[];
  supportedClaim: string;
  excerpt: string;
  interpretation: string;
  debateSummary: string;
  confidenceLabel: ConfidenceLabel;
  weaknessNote: string;
  favorite: boolean;
  credibilityLabel: CredibilityLabel;
  whyItMatters: string;
  plainEnglish: string;
  possibleWeakness: string;
  claimUnits: ClaimUnit[];
  provenance: Provenance;
}

export interface ArgumentBlock {
  id: string;
  side: DebateSide;
  title: string;
  claim: string;
  reasoning: string;
  impact: string;
  confidenceLabel: ConfidenceLabel;
  vulnerabilityLabel: VulnerabilityLabel;
  rankScore: number;
  speakingShort: string;
  speakingLong: string;
  simpleVersion: string;
  likelyOpponentAttack: string;
  defense: string;
  evidenceCardIds: string[];
  criterionTags: string[];
  provenance: Provenance;
}

export interface RebuttalPack {
  id: string;
  targetArgumentId: string;
  shortRebuttal: string;
  mediumRebuttal: string;
  longRebuttal: string;
  counterCounter: string;
  fallbackLine: string;
  bestEvidenceIds: string[];
  phrasingAdvice: string;
  classification:
    | "most_likely"
    | "most_dangerous"
    | "easiest_to_beat"
    | "requires_nuance"
    | "avoid_overclaiming";
  provenance: Provenance;
}

export interface VulnerabilityEntry {
  id: string;
  argumentId?: string;
  severity: "low" | "medium" | "high";
  issue: string;
  explanation: string;
  recommendedFix: string;
  action: "keep" | "revise" | "remove";
  provenance: Provenance;
}

export interface CrossExamItem {
  id: string;
  type: "ask_them" | "they_ask_me" | "trap";
  question: string;
  answerShort: string;
  answerLong: string;
  note: string;
  provenance: Provenance;
}

export interface SpeechDraft {
  id: string;
  type: "opening" | "body" | "rebuttal" | "closing" | "short";
  content: string;
  tone: string;
  audienceLevel: AudienceLevel;
  version: number;
  provenance: Provenance;
}

export interface LiveSheet {
  id: string;
  topArguments: string[];
  topOpponentArguments: string[];
  quickestRebuttals: string[];
  keyStats: string[];
  strongestSources: string[];
  trapQuestions: string[];
  closingLine: string;
  emergencyFallbackLines: string[];
  provenance: Provenance;
}

export interface JudgeSummary {
  winnerLean: "mine" | "opponent" | "too_close_to_call";
  honestAssessment: string;
  decisiveArguments: string[];
  weakestLinks: string[];
  frameworkBreakdown: string[];
  improvementAdvice: string[];
  provenance: Provenance;
}

export interface PracticeRound {
  id: string;
  phase: "opening" | "cross_ex" | "rebuttal" | "closing";
  prompt: string;
  expectedFocus: string[];
}

export interface PracticePlan {
  aggressiveness: "low" | "medium" | "high";
  rounds: PracticeRound[];
  feedbackRubric: string[];
  provenance: Provenance;
}

export interface WorkspaceOverlay {
  pinnedArgumentIds: string[];
  pinnedRebuttalIds: string[];
  selectedWinningPath: string | null;
  speechEdits: Partial<Record<SpeechDraft["type"], string>>;
  notes: Partial<Record<BuildModule | WorkspacePillar, string>>;
  simplifiedPhrasing: Record<string, string>;
  liveSheetOrder: {
    argumentIds: string[];
    rebuttalIds: string[];
    trapQuestionIds: string[];
  };
  moduleState: Partial<Record<BuildModule, { collapsed: boolean; pinned: boolean }>>;
}

export interface DebateAnalysis {
  whatThisDebateIsReallyAbout: string;
  keyTerms: string[];
  implicitAssumptions: string[];
  timeframe: string;
  likelyWinningCriteria: string[];
  criteriaFavorableToMySide: string[];
  criteriaFavorableToOpponent: string[];
  recommendedFraming: string[];
  framingToAvoid: string[];
  keyClashPoints: string[];
  researchPlanSummary: string[];
  provenance: Provenance;
}

export interface DebateWorkspaceSnapshot {
  analysis: DebateAnalysis;
  framing: FramingGuide;
  criteria: DebateCriterion[];
  researchQueries: ResearchQuery[];
  sourceDocuments: SourceDocument[];
  evidenceCards: EvidenceCard[];
  myArguments: ArgumentBlock[];
  opponentArguments: ArgumentBlock[];
  rebuttals: RebuttalPack[];
  vulnerabilities: VulnerabilityEntry[];
  crossExam: CrossExamItem[];
  speechDrafts: SpeechDraft[];
  liveSheet: LiveSheet;
  judgeSummary: JudgeSummary;
  practicePlan: PracticePlan;
}

export interface DebateWorkspaceRecord {
  id: string;
  userId: string;
  title: string;
  resolution: string;
  mySide: string;
  opponentSide: string;
  format: DebateFormat;
  audienceLevel: AudienceLevel;
  timeLimits: {
    speech: number;
    rebuttal: number;
    crossExam: number;
  };
  sourcePreferences: {
    mode: SourcePreferenceMode;
    allowedSourceTypes: string[];
    whitelist: string[];
    blacklist: string[];
  };
  trustMode: TrustMode;
  regionContext?: string;
  toneStyle: string;
  objectiveMode: ObjectiveMode;
  status: "draft" | "generated" | "degraded";
  generationMode: GenerationMode;
  providerStatus: ProviderStatus;
  degradationReason?: string;
  workspaceSnapshot: DebateWorkspaceSnapshot;
  workspaceOverlay: WorkspaceOverlay;
  createdAt: string;
  updatedAt: string;
}

export interface DebateRunRecord {
  id: string;
  debateId: string;
  generationMode: GenerationMode;
  providerStatus: ProviderStatus;
  degradationReason?: string;
  status: "queued" | "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
}

export interface PracticeSessionRecord {
  id: string;
  debateId: string;
  transcript: Array<{ role: "coach" | "opponent" | "user"; text: string }>;
  score: {
    evidenceUse: number;
    framing: number;
    rebuttalPrecision: number;
    composure: number;
  };
  feedback: string[];
  createdAt: string;
}

export interface ExportRecord {
  id: string;
  debateId: string;
  format: "packet" | "speech_only" | "sources_only" | "live_sheet" | "judge_report";
  fileUrl?: string;
  createdAt: string;
}
