"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ChevronDown, Loader2, Sparkles, Target, Waypoints, Zap } from "lucide-react";
import { allowedSourceTypeOptions, audienceLabels, formatLabels, sourceModeLabels } from "@/lib/constants";
import {
  audienceLevels,
  debateFormats,
  objectiveModes,
  sourcePreferenceModes,
  trustModes,
} from "@/features/debates/types";
import { debateSetupFormSchema, type DebateSetupFormValues } from "@/features/debates/validation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const pipelineSteps = [
  {
    title: "Understand the round",
    body: "Extract the real clash, the strongest criteria, and the framework that favors your side.",
    icon: <Target className="size-4" />,
  },
  {
    title: "Gather evidence",
    body: "Pull sources with trust labels, then turn the best support into usable evidence cards.",
    icon: <Sparkles className="size-4" />,
  },
  {
    title: "Build the case",
    body: "Assemble your arguments, likely opponent case, rebuttals, vulnerabilities, and cross-ex prep.",
    icon: <Waypoints className="size-4" />,
  },
  {
    title: "Get ready to speak",
    body: "Generate speech drafts, practice prompts, and a mobile-first live sheet without losing citations.",
    icon: <Zap className="size-4" />,
  },
] as const;

export function DebateSetupWizard() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<DebateSetupFormValues>({
    resolver: zodResolver(debateSetupFormSchema) as never,
    defaultValues: {
      resolution: "What is the best source of energy for the future?",
      mySide: "Natural gas",
      opponentSide: "Nuclear energy",
      format: "classroom",
      audienceLevel: "high_school",
      speechTimeMinutes: 3,
      rebuttalTimeMinutes: 2,
      crossExamTimeMinutes: 2,
      regionContext: "United States",
      classInstructions: "",
      toneStyle: "Clear, confident, evidence-first",
      objectiveMode: "win",
      trustMode: "teacher_safe",
      sourcePreferenceMode: "mixed_reputable",
      allowedSourceTypes: ["government", "academic", "international", "institutional"],
      sourceWhitelistText: "",
      sourceBlacklistText: "",
    },
  });

  const values = (useWatch({ control: form.control }) ??
    form.getValues()) as DebateSetupFormValues;

  async function onSubmit(data: DebateSetupFormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/debates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const payload = (await response.json()) as { debateId?: string; error?: string };

      if (response.status === 401 || payload.error === "AUTH_REQUIRED") {
        router.push("/login");
        return;
      }

      if (!response.ok || !payload.debateId) {
        setError(payload.error ?? "Could not build the debate workspace.");
        return;
      }

      router.push(`/debates/${payload.debateId}?intro=1`);
    } catch {
      setError("Could not build the debate workspace.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.22em] text-primary">Quick setup</p>
          <h2 className="font-heading text-3xl tracking-tight">Start with the round, not the settings.</h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Enter the resolution, pick both sides, and choose your goal. Everything else can stay on the defaults until you need more control.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Textarea
                id="resolution"
                {...form.register("resolution")}
                rows={4}
                placeholder="What is the resolution or debate question?"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mySide">My side</Label>
                <Input id="mySide" {...form.register("mySide")} placeholder="What side are you defending?" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opponentSide">Opponent side</Label>
                <Input
                  id="opponentSide"
                  {...form.register("opponentSide")}
                  placeholder="What side are they defending?"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Objective</Label>
              <Select
                value={values.objectiveMode}
                onValueChange={(value) =>
                  form.setValue("objectiveMode", value as DebateSetupFormValues["objectiveMode"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {objectiveModes.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-border/70 bg-card/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium">Current defaults</div>
                <p className="text-sm text-muted-foreground">
                  These settings guide sourcing, speeches, and the live packet. Open advanced settings only if you need to override them.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdvanced((current) => !current)}
              >
                Advanced settings
                <ChevronDown
                  className={`size-4 transition ${showAdvanced ? "rotate-180" : ""}`}
                />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <DefaultChip label="Format" value={formatLabels[values.format]} />
              <DefaultChip label="Audience" value={audienceLabels[values.audienceLevel]} />
              <DefaultChip
                label="Timing"
                value={`${values.speechTimeMinutes}/${values.rebuttalTimeMinutes}/${values.crossExamTimeMinutes} min`}
              />
              <DefaultChip label="Trust" value={values.trustMode.replaceAll("_", " ")} />
              <DefaultChip label="Sources" value={sourceModeLabels[values.sourcePreferenceMode]} />
            </div>

            {showAdvanced ? (
              <div className="grid gap-5 border-t border-border/70 pt-5 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldSelect
                      label="Format"
                      value={values.format}
                      onChange={(value) => form.setValue("format", value as DebateSetupFormValues["format"])}
                      options={debateFormats}
                    />
                    <FieldSelect
                      label="Audience"
                      value={values.audienceLevel}
                      onChange={(value) =>
                        form.setValue("audienceLevel", value as DebateSetupFormValues["audienceLevel"])
                      }
                      options={audienceLevels}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <NumberField label="Speech" valueName="speechTimeMinutes" form={form} />
                    <NumberField label="Rebuttal" valueName="rebuttalTimeMinutes" form={form} />
                    <NumberField label="Cross-ex" valueName="crossExamTimeMinutes" form={form} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldSelect
                      label="Trust mode"
                      value={values.trustMode}
                      onChange={(value) => form.setValue("trustMode", value as DebateSetupFormValues["trustMode"])}
                      options={trustModes}
                    />
                    <FieldSelect
                      label="Source mode"
                      value={values.sourcePreferenceMode}
                      onChange={(value) =>
                        form.setValue(
                          "sourcePreferenceMode",
                          value as DebateSetupFormValues["sourcePreferenceMode"],
                        )
                      }
                      options={sourcePreferenceModes}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="regionContext">Region context</Label>
                    <Input id="regionContext" {...form.register("regionContext")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toneStyle">Speaking tone</Label>
                    <Input id="toneStyle" {...form.register("toneStyle")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classInstructions">Teacher or class notes</Label>
                    <Textarea id="classInstructions" {...form.register("classInstructions")} rows={3} />
                  </div>
                </div>

                <div className="space-y-3 lg:col-span-2">
                  <Label>Allowed source types</Label>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {allowedSourceTypeOptions.map((type) => {
                      const checked = values.allowedSourceTypes.includes(type);
                      return (
                        <label
                          key={type}
                          className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => {
                              const current = form.getValues("allowedSourceTypes");
                              if (next) {
                                form.setValue("allowedSourceTypes", [...current, type]);
                              } else {
                                form.setValue(
                                  "allowedSourceTypes",
                                  current.filter((entry) => entry !== type),
                                );
                              }
                            }}
                          />
                          <span className="text-sm capitalize">{type.replaceAll("_", " ")}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceWhitelistText">Whitelist domains</Label>
                  <Textarea
                    id="sourceWhitelistText"
                    {...form.register("sourceWhitelistText")}
                    rows={4}
                    placeholder="eia.gov&#10;iea.org"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourceBlacklistText">Blacklist domains</Label>
                  <Textarea
                    id="sourceBlacklistText"
                    {...form.register("sourceBlacklistText")}
                    rows={4}
                    placeholder="example.com"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              You can refine sources, notes, speeches, and live-ordering after the workspace is built.
            </p>
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Build workspace
            </Button>
          </div>
        </form>
      </section>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">What happens next</CardTitle>
            <CardDescription>
              You will see a short build flow, then land in your full workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipelineSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-border/70 bg-background/60 p-4"
              >
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <span className="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {step.icon}
                  </span>
                  {index + 1}. {step.title}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Current round summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <PreviewLine label="Resolution" value={values.resolution} />
            <PreviewLine label="Sides" value={`${values.mySide} vs ${values.opponentSide}`} />
            <PreviewLine label="Goal" value={values.objectiveMode.replaceAll("_", " ")} />
            <PreviewLine label="Defaults" value={`${formatLabels[values.format]} • ${audienceLabels[values.audienceLevel]}`} />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option.replaceAll("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function NumberField({
  label,
  valueName,
  form,
}: {
  label: string;
  valueName: "speechTimeMinutes" | "rebuttalTimeMinutes" | "crossExamTimeMinutes";
  form: ReturnType<typeof useForm<DebateSetupFormValues>>;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={valueName}>{label} minutes</Label>
      <Input
        id={valueName}
        type="number"
        min={0}
        max={30}
        {...form.register(valueName, { valueAsNumber: true })}
      />
    </div>
  );
}

function DefaultChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{label}:</span> {value}
    </div>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="mb-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="text-sm leading-6 text-foreground">{value || "Not set yet"}</div>
    </div>
  );
}
