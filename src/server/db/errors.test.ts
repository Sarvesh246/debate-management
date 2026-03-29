import { describe, expect, it } from "vitest";
import {
  getDatabaseFailureDetail,
  getDatabaseFailureKind,
  getDatabaseSetupGuidance,
} from "@/server/db/errors";

describe("database error helpers", () => {
  it("detects schema errors", () => {
    const error = new Error('relation "debate_workspaces" does not exist');

    expect(getDatabaseFailureKind(error)).toBe("schema");
    expect(getDatabaseSetupGuidance("schema")).toContain("db:push");
  });

  it("detects connection errors", () => {
    const error = new Error("password authentication failed for user postgres");

    expect(getDatabaseFailureKind(error)).toBe("connection");
    expect(getDatabaseSetupGuidance("connection")).toContain("DATABASE_URL");
  });

  it("detects wrapped driver errors", () => {
    const error = new Error('Failed query: select * from "debate_workspaces"', {
      cause: new Error('relation "debate_workspaces" does not exist'),
    });

    expect(getDatabaseFailureKind(error)).toBe("schema");
    expect(getDatabaseFailureDetail(error)).toContain('relation "debate_workspaces" does not exist');
  });
});
