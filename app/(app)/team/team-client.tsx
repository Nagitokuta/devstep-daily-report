"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { setSelectedTeamId } from "@/lib/actions/team";

type TeamRow = {
  id: string;
  project_name: string;
  team_code: string;
  members_num: number;
};

type TeamClientProps = {
  teams: TeamRow[];
  selectedTeamId: string | null;
};

function normalizeText(text: string) {
  return text
    .trim()
    .normalize("NFKC")
    .slice(0,80)
    .replace(/\s+/g," ");
}

export function TeamClient({ teams, selectedTeamId }: TeamClientProps) {
  const router = useRouter();
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [errorType, setErrorType] = useState<"create" | "join" | null>(null);

  async function onTeamChange(teamId: string) {
    await setSelectedTeamId(teamId);
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
  
    const name = normalizeText(createName);
    if (!name) {
      setError("チーム名を入力してください");
      setErrorType("create");
      return;
    }
  
    setLoading("create");
    const supabase = createClient();
  
    // 同名チームが存在するかチェック
    const { data: existingTeams, error: checkError } = await supabase
    .from("teams")
    .select("id")
    .eq("project_name", name);
  
    if (checkError) {
      setError("チーム名チェック中にエラーが発生しました。");
      setErrorType("create");
      setLoading(null);
      return;
    }
  
    if (existingTeams && existingTeams.length > 0) {
      setError("同じ名前のチームがすでに存在します。別の名前を入力してください。");
      setErrorType("create");
      setLoading(null);
      return;
    }
  
    // 正常作成
    const { data, error: rpcError } = await supabase.rpc("create_team", {
      p_name: name,
    });
    setLoading(null);
  
    if (rpcError) {
      setError(rpcError.message);
      setErrorType("create");
      return;
    }
  
    if (data) {
      await setSelectedTeamId(data as string);
      setCreateName("");
      router.refresh();

      setError(null);
      setErrorType(null);
  
      setModalMessage("チームを作成しました！🎉");
      setShowModal(true);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!joinCode.trim()) {
      setError("参加コードを入力してください。");
      setErrorType("join");
      return;
    }

    setLoading("join");
    const supabase = createClient();
    const code = joinCode
      .trim()
      .normalize("NFKC")
      .replace(/[^A-Z0-9]/gi,"")
      .toUpperCase();

    try {
      // チーム存在確認
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("id")
        .eq("team_code", code)
        .single();

      if (teamError || !team) {
        setError("参加コードが存在しません。");
        setErrorType("join");
        setLoading(null);
        return;
      }

      // ユーザー UID 取得
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setError("ユーザー情報の取得に失敗しました。");
        setErrorType("join");
        setLoading(null);
        return;
      }
      const uid = authData.user.id;

      // すでに参加済みか確認
      const { data: existing } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", team.id)
        .eq("user_id", uid)
        .single();

      if (existing) {
        setError("すでにこのチームに参加済みです。");
        setErrorType("join");
        setLoading(null);
        return;
      }

      // 正常参加
      const { error: joinError } = await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: uid,
      });

      setLoading(null);
      if (joinError) {
        setError(joinError.message);
        return;
      }

      setJoinCode("");
      await setSelectedTeamId(team.id);
      router.refresh();

      setError(null);
      setErrorType(null);

      // 参加モーダルを表示
      setModalMessage("チームに参加しました！🎉");
      setShowModal(true);
    } catch (err: any) {
      setError(err.message || "エラーが発生しました。");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-10">
      {/* 現在のチーム */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">現在のチーム</h2>
        {teams.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            まだチームに参加していません。下から作成または参加コードで参加してください。
          </p>
        ) : (
          <div className="mt-4">
            <label htmlFor="team-select" className="mb-1 block text-sm text-slate-700 dark:text-slate-300">
              表示・投稿に使うチーム
            </label>
            <select
              id="team-select"
              className="w-full max-w-md cursor-pointer rounded border border-slate-300 px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              value={selectedTeamId ?? ""}
              onChange={(e) => void onTeamChange(e.target.value)}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.project_name}（{t.team_code}）
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* 作成・参加フォーム */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* チーム作成 */}
        <section
          className={`rounded-lg border bg-white p-6 shadow-sm dark:bg-slate-800 ${
            errorType === "create" ? "border-red-500" : "border-slate-200 dark:border-slate-600"
          }`}
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">チームを作成</h2>

          <form onSubmit={(e) => void handleCreate(e)} className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="create-name"
                className={`mb-1 block text-sm ${
                  errorType === "create"
                    ? "text-red-600"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                チーム名
              </label>

              <input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                maxLength={80}
                className={`w-full rounded border px-3 py-2 text-slate-900 dark:text-slate-200 dark:bg-slate-700 ${
                  errorType === "create"
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                    : "border-slate-300 dark:border-slate-600"
                }`}
                placeholder="例: 開発チームA"
              />
            </div>

            <button
              type="submit"
              disabled={loading === "create"}
              className="rounded bg-slate-900 cursor-pointer px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {loading === "create" ? "作成中…" : "チームを作成"}
            </button>
          </form>
        </section>

        {/* 参加コード */}
        <section
          className={`rounded-lg border bg-white p-6 shadow-sm dark:bg-slate-800 ${
            errorType === "join" ? "border-red-500" : "border-slate-200 dark:border-slate-600"
          }`}
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">参加コードで参加</h2>

          <form onSubmit={(e) => void handleJoin(e)} className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="join-code"
                className={`mb-1 block text-sm ${
                  errorType === "join"
                    ? "text-red-600"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                参加コード
              </label>

              <input
                id="join-code"
                value={joinCode}
                onChange={(e) =>
                  setJoinCode(e.target.value.replace(/\s/g, "").toUpperCase())
                }
                maxLength={20}
                className={`w-full rounded border px-3 py-2 font-mono text-slate-900 uppercase dark:text-slate-200 dark:bg-slate-700 ${
                  errorType === "join"
                    ? "border-red-500 focus:border-red-500"
                    : "border-slate-300 dark:border-slate-600"
                }`}
                placeholder="例: AB12CD34"
              />
            </div>

            <button
              type="submit"
              disabled={loading === "join"}
              className="rounded border cursor-pointer border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              {loading === "join" ? "参加中…" : "チームに参加"}
            </button>
          </form>
        </section>
      </div>

      {/* エラー表示 */}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
            <p className="mb-4 text-center text-lg font-medium text-slate-900 dark:text-white">
              {modalMessage}
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="mx-auto block rounded bg-slate-900 px-4 py-2 cursor-pointer text-white hover:bg-slate-800"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}