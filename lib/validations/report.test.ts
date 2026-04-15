import { describe, expect, it } from "vitest";
import { reportFormSchemaWithTeamContext } from "@/lib/validations/report";

const baseInput = {
  title: "テスト",
  report_date: "2026-04-14",
  category: "development" as const,
  content: "本文",
};

describe("reportFormSchemaWithTeamContext", () => {
  it("チーム未参加でチーム内公開を弾く", () => {
    const result = reportFormSchemaWithTeamContext([], null).safeParse({
      ...baseInput,
      visibility: "team" as const,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path[0]).toBe("visibility");
    }
  });

  it("所属チーム以外の team_id を弾く", () => {
    const result = reportFormSchemaWithTeamContext([{ id: "team-a" }], "team-b")
      .safeParse({
        ...baseInput,
        visibility: "team" as const,
      });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path[0]).toBe("team_id");
    }
  });

  it("所属チームの team_id ならチーム内公開を許可する", () => {
    const result = reportFormSchemaWithTeamContext([{ id: "team-a" }], "team-a")
      .safeParse({
        ...baseInput,
        visibility: "team" as const,
      });

    expect(result.success).toBe(true);
  });

  it("CIテスト用：破壊", () => {
    expect(true).toBe(false);
  });
});
