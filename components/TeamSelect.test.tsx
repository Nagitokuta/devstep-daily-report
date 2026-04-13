import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeamSelect } from "@/components/TeamSelect";

const refreshMock = vi.fn();
const setSelectedTeamIdMock = vi.fn();
const setSelectedTeamIdStateMock = vi.fn();
const useTeamsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock("@/lib/actions/team", () => ({
  setSelectedTeamId: (...args: unknown[]) => setSelectedTeamIdMock(...args),
}));

vi.mock("@/hooks/useTeams", () => ({
  useTeams: (...args: unknown[]) => useTeamsMock(...args),
}));

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("TeamSelect", () => {
  it("loading 中は何も表示しない", () => {
    useTeamsMock.mockReturnValue({
      teams: [],
      selectedTeamId: null,
      setSelectedTeamIdState: setSelectedTeamIdStateMock,
      loading: true,
    });

    const { container } = render(<TeamSelect />);
    expect(container.firstChild).toBeNull();
  });

  it("チーム未参加時のメッセージを表示する", () => {
    useTeamsMock.mockReturnValue({
      teams: [],
      selectedTeamId: null,
      setSelectedTeamIdState: setSelectedTeamIdStateMock,
      loading: false,
    });

    render(<TeamSelect />);
    expect(
      screen.getByText("まだチームに参加していません。下から作成または参加コードで参加してください。"),
    ).toBeTruthy();
  });

  it("切り替え中のステータスを表示して cookie 保存後に refresh する", async () => {
    const pending = deferred<void>();
    setSelectedTeamIdMock.mockReturnValueOnce(pending.promise);
    useTeamsMock.mockReturnValue({
      teams: [{ id: "team-1", project_name: "A", team_code: "AAA1" }],
      selectedTeamId: "team-1",
      setSelectedTeamIdState: setSelectedTeamIdStateMock,
      loading: false,
    });

    render(<TeamSelect />);

    const select = screen.getByLabelText("表示・投稿に使うチーム");
    fireEvent.change(select, { target: { value: "team-1" } });

    expect(setSelectedTeamIdStateMock).toHaveBeenCalledWith("team-1");
    expect(screen.getByText("設定を保存しています…")).toBeTruthy();

    pending.resolve();

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("サーバー初期値 props を useTeams に渡す", () => {
    useTeamsMock.mockReturnValue({
      teams: [{ id: "team-1", project_name: "A", team_code: "AAA1" }],
      selectedTeamId: "team-1",
      setSelectedTeamIdState: setSelectedTeamIdStateMock,
      loading: false,
    });

    render(
      <TeamSelect
        initialTeams={[{ id: "team-1", project_name: "A", team_code: "AAA1", members_num: 1 }]}
        initialSelectedTeamId="team-1"
      />,
    );

    expect(useTeamsMock).toHaveBeenCalledWith(
      [{ id: "team-1", project_name: "A", team_code: "AAA1", members_num: 1 }],
      "team-1",
    );
  });
});
