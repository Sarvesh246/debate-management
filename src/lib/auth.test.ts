import { describe, expect, it } from "vitest";
import { getUserInitials } from "@/lib/auth";

describe("getUserInitials", () => {
  it("builds initials from a full name", () => {
    expect(getUserInitials("Casey Coach", "casey@example.com")).toBe("CC");
  });

  it("falls back to email when no name is present", () => {
    expect(getUserInitials("", "coach@example.com")).toBe("CO");
  });

  it("returns a stable default when no identity fields exist", () => {
    expect(getUserInitials("", "")).toBe("DB");
  });
});
