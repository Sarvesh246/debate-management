import type { AnchorHTMLAttributes } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceView } from "@/components/debate/workspace-view";
import { buildWorkspaceSnapshot } from "@/features/debates/deterministic-engine";
import { normalizeWorkspaceOverlay } from "@/features/debates/workspace-overlay";
import type { DebateSetupInput, DebateWorkspaceRecord } from "@/features/debates/types";

const mockSearchParams = new URLSearchParams("tool=sources");

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/debates/debate-1/understand",
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/components/debate/client-panels", () => ({
  PracticeModePanel: () => <div>Practice mode panel</div>,
  RerunDebateButton: () => <button type="button">Re-run with current providers</button>,
  SourceReviewPanel: () => <div>Source review panel</div>,
}));

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: "(max-width: 1279px)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function createDebate(): DebateWorkspaceRecord {
  const setup: DebateSetupInput = {
    resolution: "Should cities ban smartphones in classrooms by default?",
    mySide: "Yes, ban them by default",
    opponentSide: "No, allow classroom discretion",
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
    sourceWhitelist: [],
    sourceBlacklist: [],
  };

  const snapshot = buildWorkspaceSnapshot(setup, []);

  return {
    id: "debate-1",
    userId: "user-1",
    title: `${setup.mySide} vs ${setup.opponentSide}`,
    resolution: setup.resolution,
    mySide: setup.mySide,
    opponentSide: setup.opponentSide,
    format: setup.format,
    audienceLevel: setup.audienceLevel,
    timeLimits: {
      speech: setup.speechTimeMinutes,
      rebuttal: setup.rebuttalTimeMinutes,
      crossExam: setup.crossExamTimeMinutes,
    },
    sourcePreferences: {
      mode: setup.sourcePreferenceMode,
      allowedSourceTypes: setup.allowedSourceTypes,
      whitelist: [],
      blacklist: [],
    },
    trustMode: setup.trustMode,
    regionContext: setup.regionContext,
    toneStyle: setup.toneStyle,
    objectiveMode: setup.objectiveMode,
    status: "degraded",
    generationMode: "deterministic",
    providerStatus: "degraded",
    degradationReason: "Provider unavailable during test.",
    workspaceSnapshot: snapshot,
    workspaceOverlay: normalizeWorkspaceOverlay(undefined, snapshot),
    createdAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:00:00.000Z",
  };
}

describe("WorkspaceView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the utility drawer interactive on desktop without rendering the mobile sheet overlay", () => {
    mockMatchMedia(false);

    render(<WorkspaceView debate={createDebate()} pillar="understand" />);

    expect(screen.getByText("Source review panel")).toBeInTheDocument();
    expect(document.querySelector("[data-slot='sheet-overlay']")).toBeNull();
  });

  it("renders the bottom sheet overlay for utility tools on mobile", () => {
    mockMatchMedia(true);

    render(<WorkspaceView debate={createDebate()} pillar="understand" />);

    expect(screen.getByText("Source review panel")).toBeInTheDocument();
    expect(document.querySelector("[data-slot='sheet-overlay']")).not.toBeNull();
  });
});
