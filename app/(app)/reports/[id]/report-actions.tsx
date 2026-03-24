"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ReportActionsProps = {
  reportId: string;
};

export function ReportActions({ reportId }: ReportActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("この日報を削除しますか？この操作は取り消せません。")) {
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: delError } = await supabase
      .from("daily_reports")
      .delete()
      .eq("id", reportId);
    setLoading(false);
    if (delError) {
      setError(delError.message);
      return;
    }
    router.replace("/reports");
    router.refresh();
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Link
        href={`/reports/${reportId}/edit`}
        className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
      >
        編集
      </Link>
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleDelete()}
        className="rounded border border-red-200 cursor-pointer bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {loading ? "削除中…" : "削除"}
      </button>
      {error ? (
        <p className="w-full text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
