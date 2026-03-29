import { z } from "zod";
import {
  audienceLevels,
  debateFormats,
  objectiveModes,
  sourcePreferenceModes,
  trustModes,
} from "@/features/debates/types";

const stringList = z
  .string()
  .transform((value) =>
    value
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );

export const debateSetupSchema = z
  .object({
    resolution: z.string().trim().min(10, "Resolution is required."),
    mySide: z.string().trim().min(2, "Your side is required."),
    opponentSide: z.string().trim().min(2, "Opponent side is required."),
    format: z.enum(debateFormats),
    audienceLevel: z.enum(audienceLevels),
    speechTimeMinutes: z.coerce.number().min(1).max(30),
    rebuttalTimeMinutes: z.coerce.number().min(1).max(20),
    crossExamTimeMinutes: z.coerce.number().min(0).max(20),
    regionContext: z.string().trim().optional(),
    classInstructions: z.string().trim().optional(),
    toneStyle: z.string().trim().min(2),
    objectiveMode: z.enum(objectiveModes),
    trustMode: z.enum(trustModes),
    sourcePreferenceMode: z.enum(sourcePreferenceModes),
    allowedSourceTypes: z.array(z.string()).min(1),
    sourceWhitelist: z.array(z.string()).default([]),
    sourceBlacklist: z.array(z.string()).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.mySide.toLowerCase() === value.opponentSide.toLowerCase()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sides must be different.",
        path: ["opponentSide"],
      });
    }
  });

export const debateSetupFormSchema = z.object({
  resolution: z.string(),
  mySide: z.string(),
  opponentSide: z.string(),
  format: z.enum(debateFormats),
  audienceLevel: z.enum(audienceLevels),
  speechTimeMinutes: z.coerce.number(),
  rebuttalTimeMinutes: z.coerce.number(),
  crossExamTimeMinutes: z.coerce.number(),
  regionContext: z.string().optional(),
  classInstructions: z.string().optional(),
  toneStyle: z.string(),
  objectiveMode: z.enum(objectiveModes),
  trustMode: z.enum(trustModes),
  sourcePreferenceMode: z.enum(sourcePreferenceModes),
  allowedSourceTypes: z.array(z.string()),
  sourceWhitelistText: z.string().default(""),
  sourceBlacklistText: z.string().default(""),
});

export function normalizeDebateSetupForm(
  value: z.infer<typeof debateSetupFormSchema>,
) {
  return debateSetupSchema.parse({
    ...value,
    sourceWhitelist: stringList.parse(value.sourceWhitelistText),
    sourceBlacklist: stringList.parse(value.sourceBlacklistText),
  });
}

export type DebateSetupFormValues = z.infer<typeof debateSetupFormSchema>;
