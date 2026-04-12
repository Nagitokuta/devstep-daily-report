import { createClient } from "@/lib/supabase/server";
import { getMemberTeamsForUser, getSelectedTeamId } from "@/lib/team-selection";
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

  const teams = await getMemberTeamsForUser(supabase, user.id);
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
