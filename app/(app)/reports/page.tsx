import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel, visibilityLabel } from "@/lib/constants";
import { getTeamSelectionContext } from "@/lib/team-selection";
import ReportFilters from "@/components/reports/ReportFilters";
import { TeamSelect } from "@/components/TeamSelect";
 
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

const REPORTS_PAGE_SIZE = 50;

function authorName(users: ReportListRow["users"]): string {
  if (!users) return "不明";

  const u = Array.isArray(users) ? users[0] : users;

  return u?.name || "名無し";
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
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  noStore();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const params = await searchParams;
  const q = normalizeSearchTerm(params.q ?? "");
  const category = params.category ?? "";

  const { selectedTeamId, memberTeams } = await getTeamSelectionContext(
    supabase,
    user.id,
  );

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
      users!daily_reports_user_id_fkey (
        name,
        avatar_url
      ),
      comments(count)
    `
    )
    .order("created_at", { ascending: false })
    .limit(REPORTS_PAGE_SIZE);

  // 公開範囲条件
  if (selectedTeamId) {
    query = query.or(
      `visibility.eq.global,and(visibility.eq.team,team_id.eq.${selectedTeamId})`
    );
  } else {
    query = query.eq("visibility", "global");
  }

  if (category) {
    query = query.eq("category", category);
  }

  // 検索条件
  if (q) {

    // ユーザー名一致ユーザー取得
    const { data: matchedUsers } = await supabase
      .from("users")
      .select("id")
      .ilike("name", `%${q}%`)
      .limit(20);
  
    const userIds = matchedUsers?.map(u => u.id) ?? [];
  
    const orConditions = [
      `title.ilike.%${q}%`,
      `content.ilike.%${q}%`
    ];
  
    if (userIds.length > 0) {
      orConditions.push(`user_id.in.(${userIds.join(",")})`);
    }
  
    query = query.or(orConditions.join(","));
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
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">日報一覧aaa</h1>

          <ReportFilters
            q={q}
            category={category}
          />

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {selectedTeamId
              ? "全体公開の日報と、選択中チームの「チーム内のみ」日報を表示しています。"
              : "全体公開の日報を表示しています。チーム参加後はチーム内公開の日報も表示されます。"}
          </p>

          {q ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              検索: {q}
            </p>
          ) : null}

        </div>

        <div className="mt-4 flex items-end gap-3">
          {/* チーム選択 */}
          <TeamSelect
            initialTeams={memberTeams}
            initialSelectedTeamId={selectedTeamId}
          />

          {/* 新規作成ボタン */}
          <Link
            href="/reports/new"
            className="h-[42px] rounded bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700 flex items-center"
          >
            新規作成
          </Link>
        </div>

      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {q ? "該当する日報がありません。" : "まだ日報がありません。"}
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/reports/${r.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:hover:border-slate-500"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{r.title}</h2>
                  <time
                    dateTime={r.created_at}
                    className="text-xs text-slate-500 dark:text-slate-400"
                  >
                    {formatDate(r.created_at)}
                  </time>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {authorName(r.users)} · {r.report_date} · {categoryLabel(r.category)} · {visibilityLabel(r.visibility)}
                </p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{excerpt(r.content)}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
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

