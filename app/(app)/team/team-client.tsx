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

export function TeamClient({ teams, selectedTeamId }: TeamClientProps) {
  const router = useRouter();
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"create" | "join" | null>(null);

  async function onTeamChange(teamId: string) {
    await setSelectedTeamId(teamId);
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("create");
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("create_team", {
      p_name: createName.trim(),
    });
    setLoading(null);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    if (data) {
      await setSelectedTeamId(data as string);
      setCreateName("");
      router.refresh();
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("join");
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("join_team", {
      p_code: joinCode.trim().toUpperCase(),
    });
    setLoading(null);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    if (data) {
      await setSelectedTeamId(data as string);
      setJoinCode("");
      router.refresh();
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">現在のチーム</h2>
        {teams.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            まだチームに参加していません。下から作成または参加コードで参加してください。
          </p>
        ) : (
          <div className="mt-4">
            <label htmlFor="team-select" className="mb-1 block text-sm text-slate-700">
              表示・投稿に使うチーム
            </label>
            <select
              id="team-select"
              className="w-full max-w-md cursor-pointer rounded border border-slate-300 px-3 py-2 text-slate-900"
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

      <div className="grid gap-8 md:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">チームを作成</h2>
          <form onSubmit={(e) => void handleCreate(e)} className="mt-4 space-y-3">
            <div>
              <label htmlFor="create-name" className="mb-1 block text-sm text-slate-700">
                チーム名
              </label>
              <input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                maxLength={80}
                required
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
                placeholder="例: 開発チームA"
              />
            </div>
            <button
              type="submit"
              disabled={loading === "create"}
              className="rounded bg-slate-900 cursor-pointer px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading === "create" ? "作成中…" : "チームを作成"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">参加コードで参加</h2>
          <form onSubmit={(e) => void handleJoin(e)} className="mt-4 space-y-3">
            <div>
              <label htmlFor="join-code" className="mb-1 block text-sm text-slate-700">
                参加コード
              </label>
              <input
                id="join-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={20}
                className="w-full rounded border border-slate-300 px-3 py-2 font-mono text-slate-900 uppercase"
                placeholder="例: AB12CD34"
              />
            </div>
            <button
              type="submit"
              disabled={loading === "join"}
              className="rounded border cursor-pointer border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-60"
            >
              {loading === "join" ? "参加中…" : "チームに参加"}
            </button>
          </form>
        </section>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
