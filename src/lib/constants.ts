import {
  audienceLevels,
  debateFormats,
  sourcePreferenceModes,
  workspaceSections,
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

export const sectionLabels = Object.fromEntries(
  workspaceSections.map((section) => [
    section,
    section === "cross-ex"
      ? "Cross-Ex"
      : section === "speech-builder"
        ? "Speech Builder"
        : section.charAt(0).toUpperCase() + section.slice(1),
  ]),
) as Record<(typeof workspaceSections)[number], string>;
