import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { ReportForm } from "@/app/(app)/reports/new/report-form";

const replaceMock = vi.fn();
const refreshMock = vi.fn();
const getUserMock = vi.fn();
const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  }),
}));

describe("ReportForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    insertMock.mockResolvedValue({ error: null });
  });

  it("チーム内公開を選んだときに選択した team_id で保存する", async () => {
    render(
      <ReportForm
        teamId="team-1"
        teams={[
          { id: "team-1", project_name: "A", team_code: "A001", members_num: 1 },
          { id: "team-2", project_name: "B", team_code: "B001", members_num: 1 },
        ]}
        defaultReportDate="2026-04-14"
      />
    );

    fireEvent.change(screen.getByLabelText("タイトル（50文字以内）"), {
      target: { value: "今日の日報" },
    });
    fireEvent.change(screen.getByLabelText("本文（2000文字以内）"), {
      target: { value: "作業内容です" },
    });
    fireEvent.click(screen.getByLabelText("チーム内のみ"));
    fireEvent.change(screen.getByLabelText("この日報を紐づけるチーム"), {
      target: { value: "team-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalled();
    });

    const payload = insertMock.mock.calls[0][0];
    expect(payload.team_id).toBe("team-2");
    expect(payload.visibility).toBe("team");
    expect(replaceMock).toHaveBeenCalledWith("/reports");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("タイトル未入力でエラーになる", async () => {
    render(<ReportForm teamId="team-1" teams={[]} defaultReportDate="2026-04-14" />);

    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    expect(await screen.findByText(/タイトル/)).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("本文未入力でエラーになる", async () => {
    render(<ReportForm teamId="team-1" teams={[]} defaultReportDate="2026-04-14" />);

    fireEvent.change(screen.getByLabelText("タイトル（50文字以内）"), {
      target: { value: "タイトル" },
    });

    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    expect(await screen.findByText(/本文/)).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("全体公開のときはteam_idが設定されない", async () => {
    render(
      <ReportForm
        teamId="team-1"
        teams={[{ id: "team-1", project_name: "A", team_code: "A001", members_num: 1 }]}
        defaultReportDate="2026-04-14"
      />
    );

    fireEvent.change(screen.getByLabelText("タイトル（50文字以内）"), {
      target: { value: "タイトル" },
    });
    fireEvent.change(screen.getByLabelText("本文（2000文字以内）"), {
      target: { value: "本文" },
    });

    fireEvent.click(screen.getByLabelText("全体公開"));
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalled();
    });

    const payload = insertMock.mock.calls[0][0];
    expect(payload.visibility).toBe("global");
    expect(payload.team_id).toBeNull();
  });

  it("保存エラー時に遷移しない", async () => {
    insertMock.mockResolvedValueOnce({ error: { message: "error" } });

    render(<ReportForm teamId="team-1" teams={[]} defaultReportDate="2026-04-14" />);

    fireEvent.change(screen.getByLabelText("タイトル（50文字以内）"), {
      target: { value: "タイトル" },
    });
    fireEvent.change(screen.getByLabelText("本文（2000文字以内）"), {
      target: { value: "本文" },
    });

    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalled();
    });

    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("ユーザー取得失敗時は保存しない", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });

    render(<ReportForm teamId="team-1" teams={[]} defaultReportDate="2026-04-14" />);

    fireEvent.change(screen.getByLabelText("タイトル（50文字以内）"), {
      target: { value: "タイトル" },
    });
    fireEvent.change(screen.getByLabelText("本文（2000文字以内）"), {
      target: { value: "本文" },
    });

    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(insertMock).not.toHaveBeenCalled();
    });
  });
  it("loading中はsubmitされない", async () => {
    render(<ReportForm teamId="team-1" teams={[]} defaultReportDate="2026-04-14" />);
  
    const button = screen.getByRole("button", { name: "保存する" });
  
    // 1回目クリック（loadingになる）
    fireEvent.change(screen.getByLabelText("タイトル（50文字以内）"), {
      target: { value: "タイトル" },
    });
    fireEvent.change(screen.getByLabelText("本文（2000文字以内）"), {
      target: { value: "本文" },
    });
  
    fireEvent.click(button);
    fireEvent.click(button); // 2回目
  
    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledTimes(1);
    });
  });
  it("例外発生時にエラーメッセージが出る", async () => {
    insertMock.mockRejectedValueOnce(new Error("boom"));
  
    render(<ReportForm teamId="team-1" teams={[]} defaultReportDate="2026-04-14" />);
  
    fireEvent.change(screen.getByLabelText("タイトル（50文字以内）"), {
      target: { value: "タイトル" },
    });
    fireEvent.change(screen.getByLabelText("本文（2000文字以内）"), {
      target: { value: "本文" },
    });
  
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));
  
    expect(await screen.findByText("予期しないエラーが発生しました")).toBeInTheDocument();
  });
  it("チーム未参加の場合は注意文が表示される", () => {
    render(<ReportForm teamId={null} teams={[]} defaultReportDate="2026-04-14" />);
  
    expect(screen.getByText(/チーム未参加のときは/)).toBeInTheDocument();
  });
  it("チーム内公開選択時にチームセレクトが表示される", () => {
    render(
      <ReportForm
        teamId="team-1"
        teams={[{ id: "team-1", project_name: "A", team_code: "A001", members_num: 1 }]}
        defaultReportDate="2026-04-14"
      />
    );
  
    fireEvent.click(screen.getByLabelText("チーム内のみ"));
  
    expect(screen.getByLabelText("この日報を紐づけるチーム")).toBeInTheDocument();
  });
  it("team未選択でチーム内公開にすると自動でセットされる", () => {
    render(
      <ReportForm
        teamId={null}
        teams={[{ id: "team-1", project_name: "A", team_code: "A001", members_num: 1 }]}
        defaultReportDate="2026-04-14"
      />
    );
  
    fireEvent.click(screen.getByLabelText("チーム内のみ"));
  
    const select = screen.getByLabelText("この日報を紐づけるチーム") as HTMLSelectElement;
    expect(select.value).toBe("team-1");
  });
  it("バリデーションエラーでerrorsがセットされる", async () => {
    render(<ReportForm teamId="team-1" teams={[]} defaultReportDate="2026-04-14" />);
  
    // 何も入力しないで送信
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));
  
    // errors.titleとかが出る
    expect(await screen.findByText(/タイトル/)).toBeInTheDocument();
  });
  it("バリデーションエラーでerrorsがセットされる", async () => {
    render(<ReportForm teamId="team-1" teams={[]} defaultReportDate="2026-04-14" />);
  
    // 何も入力しないで送信
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));
  
    // errors.titleとかが出る
    expect(await screen.findByText(/タイトル/)).toBeInTheDocument();
  });
  it("formエラーが表示される", async () => {
    insertMock.mockResolvedValueOnce({
      error: { message: "保存エラー" },
    });
  
    render(<ReportForm teamId="team-1" teams={[]} defaultReportDate="2026-04-14" />);
  
    fireEvent.change(screen.getByLabelText("タイトル（50文字以内）"), {
      target: { value: "タイトル" },
    });
    fireEvent.change(screen.getByLabelText("本文（2000文字以内）"), {
      target: { value: "本文" },
    });
  
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));
  
    expect(await screen.findByText("保存エラー")).toBeInTheDocument();
  });

  it("チーム未参加でチーム内のみを保存しようとすると visibility エラーになる", async () => {
    render(<ReportForm teamId={null} teams={[]} defaultReportDate="2026-04-14" />);

    fireEvent.change(screen.getByLabelText("タイトル（50文字以内）"), {
      target: { value: "タイトル" },
    });
    fireEvent.change(screen.getByLabelText("本文（2000文字以内）"), {
      target: { value: "本文" },
    });

    const teamRadio = screen.getByRole("radio", { name: /チーム内のみ/ });
    expect(teamRadio).toBeDisabled();
    fireEvent.click(teamRadio);
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    expect(await screen.findByText(/チーム未参加のときは/)).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("日付とカテゴリを変更して保存できる", async () => {
    render(
      <ReportForm
        teamId="team-1"
        teams={[{ id: "team-1", project_name: "A", team_code: "A001", members_num: 1 }]}
        defaultReportDate="2026-04-14"
      />,
    );

    fireEvent.change(screen.getByLabelText("タイトル（50文字以内）"), {
      target: { value: "日付カテゴリ変更" },
    });
    fireEvent.change(screen.getByLabelText("本文（2000文字以内）"), {
      target: { value: "本文" },
    });
    fireEvent.change(screen.getByLabelText("日付"), {
      target: { value: "2026-04-15" },
    });
    fireEvent.click(screen.getByLabelText("会議"));
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalled();
    });

    const payload = insertMock.mock.calls[0][0];
    expect(payload.report_date).toBe("2026-04-15");
    expect(payload.category).toBe("meeting");
  });

  it("初期 teams が空で再描画後にチーム内を選ぶと先頭チームが自動設定される", () => {
    const { rerender } = render(
      <ReportForm
        teamId={null}
        teams={[]}
        defaultReportDate="2026-04-14"
      />,
    );

    rerender(
      <ReportForm
        teamId={null}
        teams={[{ id: "team-1", project_name: "A", team_code: "A001", members_num: 1 }]}
        defaultReportDate="2026-04-14"
      />,
    );

    fireEvent.click(screen.getByLabelText("チーム内のみ"));

    const select = screen.getByLabelText("この日報を紐づけるチーム") as HTMLSelectElement;
    expect(select.value).toBe("team-1");
  });

  it("選択済み team_id が所属チーム一覧から外れた場合は team_id エラーになる", async () => {
    const { rerender } = render(
      <ReportForm
        teamId="team-1"
        teams={[{ id: "team-1", project_name: "A", team_code: "A001", members_num: 1 }]}
        defaultReportDate="2026-04-14"
      />,
    );

    rerender(
      <ReportForm
        teamId="team-1"
        teams={[{ id: "team-2", project_name: "B", team_code: "B001", members_num: 1 }]}
        defaultReportDate="2026-04-14"
      />,
    );

    fireEvent.change(screen.getByLabelText("タイトル（50文字以内）"), {
      target: { value: "タイトル" },
    });
    fireEvent.change(screen.getByLabelText("本文（2000文字以内）"), {
      target: { value: "本文" },
    });
    fireEvent.click(screen.getByLabelText("チーム内のみ"));
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    expect(await screen.findByText("紐づけるチームを選択してください。")).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
  });
});