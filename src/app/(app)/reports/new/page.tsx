import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSelectedTeamId } from "@/lib/team-selection";
import { ReportForm } from "./report-form";

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function NewReportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const teamId = await getSelectedTeamId(supabase, user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">日報を作成</h1>
        {teamId ? (
          <p className="mt-1 text-sm text-slate-600">
            選択中のチームに紐づけて日報を投稿します。
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-600">
            チーム未参加でも「全体公開」で投稿できます。「チーム内のみ」にするには
            <Link href="/team" className="ml-1 underline">
              チーム画面
            </Link>
            から参加してください。
          </p>
        )}
      </div>
      <ReportForm teamId={teamId} defaultReportDate={todayIsoDate()} />
    </div>
  );
}
