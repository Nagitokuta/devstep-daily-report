"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSelectedTeamId } from "@/lib/team-selection";

/** cookie とメンバーシップに基づく選択中チーム（クライアントからは cookie を読めないため） */
export async function getSelectedTeamIdFromSession(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getSelectedTeamId(supabase, user.id);
}

export async function setSelectedTeamId(teamId: string) {
  const cookieStore = await cookies();
  cookieStore.set("selected_team_id", teamId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
  });
}
