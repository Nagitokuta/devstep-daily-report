import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel, visibilityLabel } from "@/lib/constants";
import { CommentSection } from "./comment-section";
import { ReportActions } from "./report-actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: report, error } = await supabase
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
      updated_at,
      user_id,
      users!daily_reports_user_id_fkey ( name, avatar_url ),
      comments (
        id,
        content,
        created_at,
        user_id,
        users ( name, avatar_url )
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !report) {
    notFound();
  }

  const author = report.users;
  const authorName =
    author && typeof author === "object" && "name" in author
      ? (author as { name: string }).name
      : "不明";
  const avatarUrl =
    author && typeof author === "object" && "avatar_url" in author
      ? ((author as { avatar_url: string | null }).avatar_url ?? null)
      : null;

  const rawComments = report.comments;
  const comments = Array.isArray(rawComments)
    ? rawComments
    : rawComments
      ? [rawComments]
      : [];
  const sorted = [...comments].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const isOwner = report.user_id === user.id;

  return (
    <article>
      <Link
        href="/reports"
        className="text-sm text-slate-600 hover:text-slate-900"
      >
        ← 一覧へ
      </Link>
      <header className="mt-4 border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{report.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg text-slate-700">
              {authorName.slice(0, 1)}
            </span>
          )}
          <div>
            <p className="font-medium text-slate-900">{authorName}</p>
            <p className="text-sm text-slate-600">
              日付 {report.report_date} · {categoryLabel(report.category)} ·{" "}
              {visibilityLabel(report.visibility)}
            </p>
            <p className="text-xs text-slate-500">
              作成 {new Date(report.created_at).toLocaleString("ja-JP")} / 更新{" "}
              {new Date(report.updated_at).toLocaleString("ja-JP")}
            </p>
          </div>
        </div>
      </header>
      <div className="prose prose-slate mt-6 max-w-none">
        <p className="whitespace-pre-wrap text-slate-800">{report.content}</p>
      </div>

      {isOwner ? <ReportActions reportId={report.id} /> : null}

      <CommentSection
        reportId={report.id}
        currentUserId={user.id}
        initialComments={sorted}
      />
    </article>
  );
}
