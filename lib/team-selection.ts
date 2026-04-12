import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MemberTeamRow = {
  id: string;
  project_name: string;
  team_code: string;
  members_num: number;
};

/** ユーザーが所属するチーム一覧（日報・チーム画面のセレクト用） */
export async function getMemberTeamsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<MemberTeamRow[]> {
  const { data: memberRows } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);

  const teamIds = (memberRows ?? []).map((r) => r.team_id).filter(Boolean);
  if (teamIds.length === 0) return [];

  const { data: teamRows } = await supabase
    .from("teams")
    .select("id, project_name, team_code, members_num")
    .in("id", teamIds);

  return (teamRows ?? []) as MemberTeamRow[];
}

export async function getSelectedTeamId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("selected_team_id")?.value;
  const { data: members } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);
  const ids = (members ?? []).map((m) => m.team_id);
  if (fromCookie && ids.includes(fromCookie)) {
    return fromCookie;
  }
  if (ids.length > 0) {
    return ids[0] ?? null;
  }
  return null;
}
