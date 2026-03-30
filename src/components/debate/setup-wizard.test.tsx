import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DebateSetupWizard } from "@/components/debate/setup-wizard";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("DebateSetupWizard", () => {
  beforeEach(() => {
    mockPush.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("updates the round summary as the user edits the setup fields", async () => {
    const user = userEvent.setup();

    render(<DebateSetupWizard />);

    const resolution = screen.getByLabelText(/resolution/i);
    const mySide = screen.getByLabelText(/my side/i);
    const opponentSide = screen.getByLabelText(/opponent side/i);

    await user.clear(resolution);
    await user.type(resolution, "Should schools require uniforms?");
    await user.clear(mySide);
    await user.type(mySide, "Schools should require uniforms");
    await user.clear(opponentSide);
    await user.type(opponentSide, "Schools should not require uniforms");

    expect(screen.getByText("Should schools require uniforms?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Schools should require uniforms vs Schools should not require uniforms",
      ),
    ).toBeInTheDocument();
  });

  it("sends anonymous users to login when workspace creation requires auth", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      status: 401,
      ok: false,
      json: async () => ({ error: "AUTH_REQUIRED" }),
    } as Response);

    render(<DebateSetupWizard />);

    await user.click(screen.getByRole("button", { name: /build workspace/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });
});
