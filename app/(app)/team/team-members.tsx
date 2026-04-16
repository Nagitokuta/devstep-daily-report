"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type User = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

type Row = {
  user_id: string;
  joined_at: string;
  users: User | User[] | null;
};

type Member = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  joined_at: string;
};

export function TeamMembers({ teamId }: { teamId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true);
      const supabase = createClient();

      const { data: rows, error } = await supabase
        .from("team_members")
        .select(`
          user_id,
          joined_at,
          users (
            id,
            name,
            avatar_url
          )
        `)
        .eq("team_id", teamId)
        .order("joined_at", { ascending: true });

      if (error) {
        setError("メンバー情報の取得に失敗しました");
        console.error(error);
      } else {
        const members: Member[] =
        (rows as Row[] | null)?.map((r) => {
          const user = r.users;
          const firstUser = Array.isArray(user) ? user[0] : user;
      
          return {
            user_id: r.user_id,
            name: firstUser?.name ?? "名無し",
            avatar_url: firstUser?.avatar_url ?? null,
            joined_at: r.joined_at,
          };
        }) ?? [];
        setMembers(members);
      }
      setLoading(false);
    }

    fetchMembers();
  }, [teamId]);

  if (loading) return <p>読み込み中…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">メンバー</h2>
      <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-700">
        {members.map((m) => (
          <li key={m.user_id} className="flex items-center gap-3 py-3">
            {m.avatar_url ? (
              <img
                src={m.avatar_url}
                alt={m.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {m.name.slice(0, 1)}
              </span>
            )}
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{m.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                参加: {new Date(m.joined_at).toLocaleString("ja-JP")}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}