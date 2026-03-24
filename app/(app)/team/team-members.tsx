import { createClient } from "@/lib/supabase/server";

export async function TeamMembers({ teamId }: { teamId: string }) {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("team_members")
    .select("user_id, joined_at, users ( name, avatar_url )")
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true });

  const members =
    rows?.map((r) => {
      const user = r.users?.[0];

      return {
        user_id: r.user_id as string,
        name: user?.name ?? "",
        avatar_url: user?.avatar_url ?? null,
        joined_at: r.joined_at as string,
      };
      return null;
    }).filter((m): m is NonNullable<typeof m> => m != null) ?? [];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">メンバー</h2>
      <ul className="mt-4 divide-y divide-slate-100">
        {members.map((m) => (
          <li key={m.user_id} className="flex items-center gap-3 py-3">
            {m.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.avatar_url}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm text-slate-700">
                {m.name.slice(0, 1)}
              </span>
            )}
            <div>
              <p className="font-medium text-slate-900">{m.name}</p>
              <p className="text-xs text-slate-500">
                参加: {new Date(m.joined_at).toLocaleString("ja-JP")}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
