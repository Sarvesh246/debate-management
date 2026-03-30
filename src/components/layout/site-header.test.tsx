import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteHeaderShell } from "@/components/layout/site-header";

const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockSignOut = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));

vi.mock("@/lib/supabase/browser", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}));

describe("SiteHeaderShell", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockRefresh.mockReset();
    mockSignOut.mockReset();
    mockSignOut.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders explicit login and signup actions for anonymous users", () => {
    render(<SiteHeaderShell viewer={null} />);

    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
  });

  it("renders the authenticated account menu and signs out cleanly", async () => {
    const user = userEvent.setup();

    render(
      <SiteHeaderShell
        viewer={{
          id: "user-1",
          name: "Casey Coach",
          email: "casey@example.com",
          initials: "CC",
          mode: "authenticated",
          workspaceModeLabel: "Authenticated Workspace",
        }}
      />,
    );

    expect(screen.queryByRole("link", { name: /log in/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /new debate/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /open account menu/i }));
    expect(screen.getByRole("menuitem", { name: /view profile/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("renders local workspace menu items without a sign-out action", async () => {
    const user = userEvent.setup();

    render(
      <SiteHeaderShell
        viewer={{
          id: "local-user",
          name: "Local Workspace",
          email: "local@debate-command.dev",
          initials: "LW",
          mode: "local",
          workspaceModeLabel: "Local Workspace",
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /open workspace menu/i }));

    expect(screen.getByRole("menuitem", { name: /view profile/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /^log in$/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /sign out/i })).not.toBeInTheDocument();
  });
});
