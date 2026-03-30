import {
  audienceLevels,
  buildModules,
  debateFormats,
  primaryWorkspacePillars,
  sourcePreferenceModes,
  type BuildModule,
  type LegacyWorkspaceSection,
  type WorkspacePillar,
  type WorkspaceTool,
} from "@/features/debates/types";

export const allowedSourceTypeOptions = [
  "government",
  "academic",
  "university",
  "international",
  "institutional",
  "industry",
  "journalism",
];

export const formatLabels = Object.fromEntries(
  debateFormats.map((format) => [format, format.replaceAll("_", " ")]),
) as Record<(typeof debateFormats)[number], string>;

export const audienceLabels = Object.fromEntries(
  audienceLevels.map((audience) => [audience, audience.replaceAll("_", " ")]),
) as Record<(typeof audienceLevels)[number], string>;

export const sourceModeLabels = Object.fromEntries(
  sourcePreferenceModes.map((mode) => [mode, mode.replaceAll("_", " ")]),
) as Record<(typeof sourcePreferenceModes)[number], string>;

export const pillarLabels = Object.fromEntries(
  primaryWorkspacePillars.map((pillar) => [
    pillar,
    pillar.charAt(0).toUpperCase() + pillar.slice(1),
  ]),
) as Record<WorkspacePillar, string>;

export const toolLabels = {
  sources: "Sources",
  judge: "Judge",
  export: "Export",
} satisfies Record<WorkspaceTool, string>;

export const buildModuleLabels = {
  case: "Core case",
  opponent: "Opponent and rebuttals",
  vulnerabilities: "Vulnerabilities",
  cross_ex: "Cross-ex",
  speeches: "Speech drafts",
} satisfies Record<BuildModule, string>;

export const legacySectionTargets = {
  overview: { pillar: "understand" },
  strategy: { pillar: "understand" },
  arguments: { pillar: "build", module: "case" },
  opponent: { pillar: "build", module: "opponent" },
  rebuttals: { pillar: "build", module: "opponent" },
  vulnerabilities: { pillar: "build", module: "vulnerabilities" },
  "cross-ex": { pillar: "build", module: "cross_ex" },
  "speech-builder": { pillar: "build", module: "speeches" },
  practice: { pillar: "practice" },
  live: { pillar: "live" },
  sources: { pillar: "understand", tool: "sources" },
  judge: { pillar: "understand", tool: "judge" },
  export: { pillar: "live", tool: "export" },
} satisfies Record<
  LegacyWorkspaceSection,
  {
    pillar: WorkspacePillar;
    module?: BuildModule;
    tool?: WorkspaceTool;
  }
>;

export const defaultBuildModule: BuildModule = buildModules[0];
