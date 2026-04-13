import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSelectedTeamIdFromSession, setSelectedTeamId } from "@/lib/actions/team";

const mocks = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  createClientMock: vi.fn(),
  getSelectedTeamIdMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookiesMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClientMock,
}));

vi.mock("@/lib/team-selection", () => ({
  getSelectedTeamId: mocks.getSelectedTeamIdMock,
}));

describe("team actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("setSelectedTeamId が expected options で cookie を更新する", async () => {
    const set = vi.fn();
    mocks.cookiesMock.mockResolvedValue({ set });

    await setSelectedTeamId("team-1");

    expect(set).toHaveBeenCalledWith("selected_team_id", "team-1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: true,
    });
  });

  it("getSelectedTeamIdFromSession が user.id を使って解決する", async () => {
    mocks.createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
    });
    mocks.getSelectedTeamIdMock.mockResolvedValue("team-2");

    const result = await getSelectedTeamIdFromSession();

    expect(mocks.getSelectedTeamIdMock).toHaveBeenCalled();
    expect(result).toBe("team-2");
  });

  it("getSelectedTeamIdFromSession は未ログイン時に null を返す", async () => {
    mocks.createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const result = await getSelectedTeamIdFromSession();

    expect(result).toBeNull();
    expect(mocks.getSelectedTeamIdMock).not.toHaveBeenCalled();
  });
});
