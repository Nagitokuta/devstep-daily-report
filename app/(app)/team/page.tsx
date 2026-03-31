import { createClient } from "@/lib/supabase/server";
import { getSelectedTeamId } from "@/lib/team-selection";
import { TeamClient } from "./team-client";
import { TeamMembers } from "./team-members";

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: memberRows } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  const teamIds = (memberRows ?? []).map((r) => r.team_id).filter(Boolean);
  let teams: {
    id: string;
    project_name: string;
    team_code: string;
    members_num: number;
  }[] = [];

  if (teamIds.length > 0) {
    const { data: teamRows } = await supabase
      .from("teams")
      .select("id, project_name, team_code, members_num")
      .in("id", teamIds);
    teams = (teamRows ?? []) as typeof teams;
  }

  const selectedTeamId = await getSelectedTeamId(supabase, user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">チーム</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          チームの作成・参加、表示中チームの切り替えができます。
        </p>
      </div>
      <TeamClient
        teams={teams}
        selectedTeamId={selectedTeamId}
      />
      {selectedTeamId ? (
        <TeamMembers
          teamId={selectedTeamId}
        />
      ) : null}
    </div>
  );
}
