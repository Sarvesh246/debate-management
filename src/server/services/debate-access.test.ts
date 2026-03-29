import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn(() => {
  throw new Error("NEXT_REDIRECT");
});

const getCurrentUserContextMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserContext: getCurrentUserContextMock,
  isLocalMode: () => false,
}));

const { requireAppUser } = await import("@/server/services/debate-access");

describe("requireAppUser", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    getCurrentUserContextMock.mockReset();
  });

  it("redirects to login when auth is required", async () => {
    getCurrentUserContextMock.mockRejectedValue(new Error("AUTH_REQUIRED"));

    await expect(requireAppUser()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("redirects to settings when deployed auth config is missing (Missing: …)", async () => {
    getCurrentUserContextMock.mockRejectedValue(
      new Error("Supabase is required in deployed environments. Missing: DATABASE_URL."),
    );

    await expect(requireAppUser()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/settings?setup=supabase");
  });

  it("redirects to settings when deployed auth config is missing (Set …)", async () => {
    getCurrentUserContextMock.mockRejectedValue(
      new Error(
        "Supabase is required in deployed environments. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and DATABASE_URL.",
      ),
    );

    await expect(requireAppUser()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/settings?setup=supabase");
  });
});
