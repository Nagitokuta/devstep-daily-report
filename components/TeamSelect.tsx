"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setSelectedTeamId } from "@/lib/actions/team";
import { useTeams, type TeamRow } from "@/hooks/useTeams";

type TeamSelectProps = {
  initialTeams?: TeamRow[];
  initialSelectedTeamId?: string | null;
};

export function TeamSelect({
  initialTeams,
  initialSelectedTeamId,
}: TeamSelectProps = {}) {
  const fromServer = initialTeams !== undefined;
  const { teams, selectedTeamId, setSelectedTeamIdState, loading } = useTeams(
    fromServer ? initialTeams : undefined,
    fromServer ? (initialSelectedTeamId ?? null) : undefined,
  );
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  async function onTeamChange(teamId: string) {
    setSwitching(true);
    setSelectedTeamIdState(teamId);
    try {
      await setSelectedTeamId(teamId);
      router.refresh();
    } finally {
      setSwitching(false);
    }
  }

  if (loading) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        現在のチーム
      </h2>

      {teams.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          まだチームに参加していません。下から作成または参加コードで参加してください。
        </p>
      ) : (
        <div className="mt-4">
          <label
            htmlFor="team-select"
            className="mb-1 block text-sm text-slate-700 dark:text-slate-300"
          >
            表示・投稿に使うチーム
          </label>

          <select
            id="team-select"
            aria-busy={switching}
            disabled={switching}
            className="w-full max-w-md cursor-pointer rounded border border-slate-300 px-3 py-2 text-slate-900 disabled:cursor-wait disabled:opacity-70 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            value={selectedTeamId ?? ""}
            onChange={(e) => void onTeamChange(e.target.value)}
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.project_name}（{t.team_code}）
              </option>
            ))}
          </select>
          {switching ? (
            <p
              className="mt-2 text-sm text-slate-600 dark:text-slate-400"
              role="status"
              aria-live="polite"
            >
              チームを切り替えています…
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
