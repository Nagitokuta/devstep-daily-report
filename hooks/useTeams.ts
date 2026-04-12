"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSelectedTeamIdFromSession } from "@/lib/actions/team";
import type { MemberTeamRow } from "@/lib/team-selection";

export type TeamRow = MemberTeamRow;

/**
 * @param serverTeams / serverSelectedTeamId — RSC から渡すと cookie 基準と一致する。
 *  未指定のときはクライアントでメンバー一覧と選択を取得する。
 */
export function useTeams(
  serverTeams?: TeamRow[],
  serverSelectedTeamId?: string | null,
) {
  const fromServer = serverTeams !== undefined;
  const [teams, setTeams] = useState<TeamRow[]>(() => serverTeams ?? []);
  const [selectedTeamId, setSelectedTeamIdState] = useState<string | null>(
    () =>
      fromServer ? (serverSelectedTeamId ?? null) : null,
  );
  const [loading, setLoading] = useState(!fromServer);

  const serverTeamIdsKey = fromServer
    ? (serverTeams ?? []).map((t) => t.id).slice().sort().join(",")
    : "";

  useEffect(() => {
    if (!fromServer) return;
    setTeams(serverTeams ?? []);
    setSelectedTeamIdState(serverSelectedTeamId ?? null);
    setLoading(false);
  }, [fromServer, serverTeamIdsKey, serverSelectedTeamId, serverTeams]);

  useEffect(() => {
    if (fromServer) return;

    const supabase = createClient();

    async function fetchData() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setTeams([]);
        setSelectedTeamIdState(null);
        setLoading(false);
        return;
      }

      const { data: memberRows } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id);

      const teamIds = (memberRows ?? []).map((r) => r.team_id).filter(Boolean);
      let teamList: TeamRow[] = [];
      if (teamIds.length > 0) {
        const { data: teamRows } = await supabase
          .from("teams")
          .select("id, project_name, team_code, members_num")
          .in("id", teamIds);
        teamList = (teamRows ?? []) as TeamRow[];
      }

      const selected = await getSelectedTeamIdFromSession();
      setTeams(teamList);
      setSelectedTeamIdState(selected);
      setLoading(false);
    }

    void fetchData();
  }, [fromServer]);

  return {
    teams,
    selectedTeamId,
    setSelectedTeamIdState,
    loading,
  };
}
