import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel, visibilityLabel } from "@/lib/constants";
import { getSelectedTeamId } from "@/lib/team-selection";

type ReportListRow = {
  id: string;
  title: string;
  report_date: string;
  category: string;
  visibility: string;
  content: string;
  created_at: string;
  users:
    | { name: string; avatar_url: string | null }
    | { name: string; avatar_url: string | null }[]
    | null;
  comments: { count: number }[] | null;
};

function authorName(users: ReportListRow["users"]): string {
  if (!users) return "不明";
  const u = Array.isArray(users) ? users[0] : users;
  return u?.name ?? "不明";
}

function commentCount(row: ReportListRow): number {
  const c = row.comments;
  if (c && c[0] && typeof c[0].count === "number") {
    return c[0].count;
  }
  return 0;
}

function excerpt(text: string, max = 120): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function normalizeSearchTerm(value: string): string {
  return value.replace(/[%_,]/g, " ").trim();
}

export function formatDate(date: string) {
  return new Date(date).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo"
  });
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const params = await searchParams;
  const q = normalizeSearchTerm(params.q ?? "");

  const selectedTeamId = await getSelectedTeamId(supabase, user.id);
  let query = supabase
    .from("daily_reports")
    .select(
      `
      id,
      title,
      report_date,
      category,
      visibility,
      content,
      created_at,
      users!daily_reports_user_id_fkey ( name, avatar_url ),
      comments(count)
    `,
    )
    .order("created_at", { ascending: false });

  if (selectedTeamId) {
    query = query.or(
      `visibility.eq.global,and(team_id.eq.${selectedTeamId},visibility.eq.team)`,
    );
  } else {
    query = query.eq("visibility", "global");
  }

  if (q) {
    query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
  }

  const { data: reports, error } = await query;

  if (error) {
    return (
      <p className="text-sm text-red-600" role="alert">
        一覧の取得に失敗しました: {error.message}
      </p>
    );
  }

  const rows = (reports ?? []) as ReportListRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">日報一覧</h1>
          <p className="mt-1 text-sm text-slate-600">
            {selectedTeamId
              ? "全体公開の日報と、選択中チームの「チーム内のみ」日報を表示しています。"
              : "全体公開の日報を表示しています。チーム参加後はチーム内公開の日報も表示されます。"}
          </p>
          {q ? <p className="mt-1 text-sm text-slate-500">検索: {q}</p> : null}
        </div>
        <Link
          href="/reports/new"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          新規作成
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-600">
          {q ? "該当する日報がありません。" : "まだ日報がありません。"}
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/reports/${r.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">{r.title}</h2>
                  <time
                    dateTime={r.created_at}
                    className="text-xs text-slate-500"
                  >
                    {formatDate(r.created_at)}
                  </time>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {authorName(r.users)} · {r.report_date} ·{" "}
                  {categoryLabel(r.category)} · {visibilityLabel(r.visibility)}
                </p>
                <p className="mt-2 text-sm text-slate-700">{excerpt(r.content)}</p>
                <p className="mt-2 text-xs text-slate-500">
                  コメント {commentCount(r)} 件
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
