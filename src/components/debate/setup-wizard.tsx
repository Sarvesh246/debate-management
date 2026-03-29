"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { allowedSourceTypeOptions } from "@/lib/constants";
import { audienceLevels, debateFormats, objectiveModes, sourcePreferenceModes, trustModes } from "@/features/debates/types";
import { debateSetupFormSchema, type DebateSetupFormValues } from "@/features/debates/validation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const steps = ["Debate", "Format", "Sources"];

export function DebateSetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
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

    const response = await fetch("/api/debates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const payload = (await response.json()) as { debateId?: string; error?: string };
    setSubmitting(false);

    if (!response.ok || !payload.debateId) {
      setError(payload.error ?? "Could not build the debate workspace.");
      return;
    }

    router.push(`/debates/${payload.debateId}/overview`);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-border/70 bg-card/90 shadow-xl shadow-primary/5">
        <CardHeader>
          <CardTitle className="font-heading text-3xl">Start a debate workspace</CardTitle>
          <CardDescription>
            Build a full strategy packet with trustworthy sourcing, structured arguments, live-round prep, and deterministic fallback if providers are unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2 sm:grid-cols-3">
            {steps.map((item, index) => (
              <button
                key={item}
                type="button"
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${index === step ? "border-primary bg-primary/10 text-foreground" : "border-border/70 bg-background/60 text-muted-foreground"}`}
                onClick={() => setStep(index)}
              >
                <div className="font-medium">{item}</div>
                <div className="text-xs">Step {index + 1}</div>
              </button>
            ))}
          </div>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {step === 0 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution</Label>
                  <Textarea id="resolution" {...form.register("resolution")} rows={4} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mySide">My side</Label>
                    <Input id="mySide" {...form.register("mySide")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opponentSide">Opponent side</Label>
                    <Input id="opponentSide" {...form.register("opponentSide")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classInstructions">Teacher or class notes</Label>
                  <Textarea id="classInstructions" {...form.register("classInstructions")} rows={3} />
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldSelect
                    label="Format"
                    value={values.format}
                    onChange={(value) => form.setValue("format", value as DebateSetupFormValues["format"])}
                    options={debateFormats}
                  />
                  <FieldSelect
                    label="Audience level"
                    value={values.audienceLevel}
                    onChange={(value) => form.setValue("audienceLevel", value as DebateSetupFormValues["audienceLevel"])}
                    options={audienceLevels}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <NumberField label="Speech" valueName="speechTimeMinutes" form={form} />
                  <NumberField label="Rebuttal" valueName="rebuttalTimeMinutes" form={form} />
                  <NumberField label="Cross-ex" valueName="crossExamTimeMinutes" form={form} />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FieldSelect
                    label="Objective"
                    value={values.objectiveMode}
                    onChange={(value) => form.setValue("objectiveMode", value as DebateSetupFormValues["objectiveMode"])}
                    options={objectiveModes}
                  />
                  <FieldSelect
                    label="Trust mode"
                    value={values.trustMode}
                    onChange={(value) => form.setValue("trustMode", value as DebateSetupFormValues["trustMode"])}
                    options={trustModes}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="regionContext">Region context</Label>
                    <Input id="regionContext" {...form.register("regionContext")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toneStyle">Speaking tone</Label>
                  <Input id="toneStyle" {...form.register("toneStyle")} />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <FieldSelect
                  label="Source mode"
                  value={values.sourcePreferenceMode}
                  onChange={(value) =>
                    form.setValue("sourcePreferenceMode", value as DebateSetupFormValues["sourcePreferenceMode"])
                  }
                  options={sourcePreferenceModes}
                />
                <div className="space-y-3">
                  <Label>Allowed source types</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {allowedSourceTypeOptions.map((type) => {
                      const checked = values.allowedSourceTypes.includes(type);
                      return (
                        <label key={type} className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3">
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sourceWhitelistText">Whitelist domains</Label>
                    <Textarea id="sourceWhitelistText" {...form.register("sourceWhitelistText")} rows={4} placeholder="eia.gov&#10;iea.org" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sourceBlacklistText">Blacklist domains</Label>
                    <Textarea id="sourceBlacklistText" {...form.register("sourceBlacklistText")} rows={4} placeholder="example.com" />
                  </div>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                disabled={step === 0}
              >
                Back
              </Button>
              <div className="flex gap-3">
                {step < steps.length - 1 ? (
                  <Button type="button" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                    Build workspace
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/75">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Preview</CardTitle>
          <CardDescription>Live summary of the debate packet the app will assemble.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <PreviewBlock label="Resolution" value={values.resolution} />
          <PreviewBlock label="Sides" value={`${values.mySide} vs ${values.opponentSide}`} />
          <PreviewBlock label="Format" value={`${values.format.replaceAll("_", " ")} • ${values.audienceLevel.replaceAll("_", " ")}`} />
          <PreviewBlock label="Source mode" value={`${values.sourcePreferenceMode.replaceAll("_", " ")} • ${values.allowedSourceTypes.join(", ")}`} />
          <PreviewBlock label="Timing" value={`${values.speechTimeMinutes} min speech • ${values.rebuttalTimeMinutes} min rebuttal • ${values.crossExamTimeMinutes} min cross-ex`} />
          <div className="rounded-3xl border border-primary/20 bg-primary/8 p-5 text-sm text-muted-foreground">
            The app will extract likely criteria, build research queries, retrieve trustworthy sources, create evidence cards, rank arguments for both sides, flag vulnerabilities, generate speeches, and produce a live debate sheet.
          </div>
        </CardContent>
      </Card>
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
      <Input id={valueName} type="number" min={0} max={30} {...form.register(valueName, { valueAsNumber: true })} />
    </div>
  );
}

function PreviewBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="mb-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="text-sm leading-6 text-foreground">{value || "Not set yet"}</div>
    </div>
  );
}
