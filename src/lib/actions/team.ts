"use server";

import { cookies } from "next/headers";

export async function setSelectedTeamId(teamId: string) {
  const cookieStore = await cookies();
  cookieStore.set("selected_team_id", teamId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
  });
}
