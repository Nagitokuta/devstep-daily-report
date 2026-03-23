import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

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
