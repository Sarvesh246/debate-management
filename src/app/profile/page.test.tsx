import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAppUserMock = vi.fn();
const getAppModeLabelMock = vi.fn(() => "Authenticated workspace mode");

vi.mock("@/server/services/debate-access", () => ({
  requireAppUser: requireAppUserMock,
  getAppModeLabel: getAppModeLabelMock,
}));

vi.mock("@/components/layout/site-header", () => ({
  SiteHeader: ({ appModeLabel }: { appModeLabel?: string }) => (
    <div data-testid="site-header">{appModeLabel}</div>
  ),
}));

vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    requireAppUserMock.mockReset();
    getAppModeLabelMock.mockClear();
  });

  it("renders authenticated profile content", async () => {
    requireAppUserMock.mockResolvedValue({
      id: "user-1",
      name: "Casey Coach",
      email: "casey@example.com",
      mode: "authenticated",
    });

    const { default: ProfilePage } = await import("@/app/profile/page");
    render(await ProfilePage());

    expect(screen.getByRole("heading", { name: /account and workspace identity/i })).toBeInTheDocument();
    expect(screen.getByText("Casey Coach")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("renders local workspace guidance without a sign-out button", async () => {
    requireAppUserMock.mockResolvedValue({
      id: "local-user",
      name: "Local Workspace",
      email: "local@debate-command.dev",
      mode: "local",
    });

    const { default: ProfilePage } = await import("@/app/profile/page");
    render(await ProfilePage());

    expect(screen.getByText(/you are using local workspace mode/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
  });

  it("propagates the login redirect for anonymous users", async () => {
    requireAppUserMock.mockRejectedValue(new Error("NEXT_REDIRECT"));

    const { default: ProfilePage } = await import("@/app/profile/page");
    await expect(ProfilePage()).rejects.toThrow("NEXT_REDIRECT");
  });
});
