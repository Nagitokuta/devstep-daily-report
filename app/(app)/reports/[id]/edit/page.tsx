import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportEditForm } from "./report-edit-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditReportPage({ params }: PageProps) {
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
    .select("id, title, report_date, category, visibility, content, user_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !report) {
    notFound();
  }

  if (report.user_id !== user.id) {
    redirect(`/reports/${id}`);
  }

  const visibility =
    report.visibility === "team" || report.visibility === "global"
      ? report.visibility
      : "global";

  const category =
    report.category === "development" ||
    report.category === "meeting" ||
    report.category === "other"
      ? report.category
      : "development";

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/reports/${id}`} className="text-sm text-slate-600 hover:text-slate-900">
          ← 詳細へ戻る
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">日報を編集</h1>
      </div>
      <ReportEditForm
        reportId={report.id}
        initial={{
          title: report.title,
          report_date: report.report_date,
          category,
          visibility,
          content: report.content,
        }}
      />
    </div>
  );
}
