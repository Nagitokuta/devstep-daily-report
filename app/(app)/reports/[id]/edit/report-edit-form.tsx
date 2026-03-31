"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { REPORT_CATEGORIES, VISIBILITY_OPTIONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { reportFormSchema } from "@/lib/validations/report";

type ReportEditFormProps = {
  reportId: string;
  initial: {
    title: string;
    report_date: string;
    category: string;
    visibility: "team" | "global";
    content: string;
  };
};

export function ReportEditForm({ reportId, initial }: ReportEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [reportDate, setReportDate] = useState(initial.report_date);
  const [category, setCategory] = useState(initial.category);
  const [visibility, setVisibility] = useState<"team" | "global">(
    initial.visibility,
  );
  const [content, setContent] = useState(initial.content);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const parsed = reportFormSchema.safeParse({
      title,
      report_date: reportDate,
      category,
      visibility,
      content,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const p = issue.path[0];
        if (typeof p === "string" && !next[p]) {
          next[p] = issue.message;
        }
      });
      setErrors(next);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("daily_reports")
      .update({
        title: parsed.data.title.trim(),
        report_date: parsed.data.report_date,
        category: parsed.data.category,
        visibility: parsed.data.visibility,
        content: parsed.data.content,
      })
      .eq("id", reportId);
    setLoading(false);
    if (error) {
      setErrors({ form: error.message });
      return;
    }
    router.replace(`/reports/${reportId}`);
    router.refresh();
  }

  return (
    <div className="
      rounded-xl
      bg-white dark:bg-slate-700
      border border-slate-200 dark:border-slate-600
      p-8
      shadow-sm
    ">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            タイトル（50文字以内）
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
            required
            className="w-full rounded border border-slate-300 bg-white shadow-sm px-3 py-2 text-slate-900 dark:border-slate-500 dark:bg-slate-600 dark:text-slate-200"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="report_date"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            日付
          </label>
          <input
            id="report_date"
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            required
            className="w-full max-w-xs cursor-pointer bg-white shadow-sm rounded border border-slate-300 px-3 py-2 text-slate-900 dark:border-slate-500 dark:bg-slate-600 dark:text-slate-200"
          />
          {errors.report_date && (
            <p className="mt-1 text-sm text-red-600">{errors.report_date}</p>
          )}
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            カテゴリ
          </span>
          <div className="flex flex-wrap gap-3">
            {REPORT_CATEGORIES.map((c) => (
              <label key={c.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="category"
                  className="cursor-pointer"
                  value={c.value}
                  checked={category === c.value}
                  onChange={() => setCategory(c.value)}
                />
                {c.label}
              </label>
            ))}
          </div>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            公開範囲
          </span>
          <div className="flex flex-wrap gap-3">
            {VISIBILITY_OPTIONS.map((v) => (
              <label key={v.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="visibility"
                  className="cursor-pointer"
                  value={v.value}
                  checked={visibility === v.value}
                  onChange={() => setVisibility(v.value)}
                />
                {v.label}
              </label>
            ))}
          </div>
          {errors.visibility && (
            <p className="mt-1 text-sm text-red-600">{errors.visibility}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="content"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            本文（2000文字以内）
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            required
            maxLength={2000}
            className="w-full rounded border border-slate-300 bg-white shadow-sm px-3 py-2 text-slate-900 dark:border-slate-500 dark:bg-slate-600 dark:text-slate-200"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {content.length} / 2000
          </p>
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
        </div>

        {errors.form && (
          <p className="text-sm text-red-600" role="alert">
            {errors.form}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-slate-900 cursor-pointer px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "保存中…" : "更新する"}
          </button>
          <Link
            href={`/reports/${reportId}`}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
