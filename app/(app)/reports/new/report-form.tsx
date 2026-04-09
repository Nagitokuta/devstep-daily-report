"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { REPORT_CATEGORIES, VISIBILITY_OPTIONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { reportFormSchemaWithTeamContext } from "@/lib/validations/report";

type ReportFormProps = {
  teamId: string | null;
  defaultReportDate: string;
};

export function ReportForm({ teamId, defaultReportDate }: ReportFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [reportDate, setReportDate] = useState(defaultReportDate);
  const [category, setCategory] = useState<string>("development");
  const [visibility, setVisibility] = useState<"team" | "global">("global");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();
    if(loading) return;
    setLoading(true);
  
    try{
      setErrors({});
  
      const parsed = reportFormSchemaWithTeamContext(teamId).safeParse({
        title,
        report_date: reportDate,
        category,
        visibility,
        content,
      });
  
      if (!parsed.success) {
  
        const next: Record<string,string> = {};
        parsed.error.issues.forEach((issue)=>{
  
          const p = issue.path[0];
  
          if(typeof p==="string" && !next[p]){
            next[p]=issue.message;
          }
  
        });

        setErrors(next);
        setLoading(false); 
        return;
  
      }
  
      const supabase = createClient();
  
      const {
        data:{user},
      } = await supabase.auth.getUser();
  
      if(!user){
        setLoading(false);
        return;
      }
  
      const {error} = await supabase
        .from("daily_reports")
        .insert({
          team_id:teamId,
          user_id:user.id,
          title:parsed.data.title.trim(),
          report_date:parsed.data.report_date,
          category:parsed.data.category,
          visibility:parsed.data.visibility,
          content:parsed.data.content,
        });
  
      if(error){
        setErrors({form:error.message});
        setLoading(false);
        return;
      }
  
      router.replace("/reports");
      router.refresh();
  
    }catch(err){
      console.error(err);
  
      setErrors({
        form:"予期しないエラーが発生しました"
      });

      setLoading(false);
    }
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
            className="w-full rounded border border-slate-300 shadow-sm bg-white dark:bg-slate-600 px-3 py-2 text-slate-900 dark:border-slate-500 dark:text-white"
          />
          {errors.title ? (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          ) : null}
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
            className="w-full max-w-xs cursor-pointer rounded border shadow-sm border-slate-300 bg-white dark:bg-slate-600 dark:border-slate-500 px-3 py-2 text-slate-900 dark:text-white"
          />
          {errors.report_date ? (
            <p className="mt-1 text-sm text-red-600">{errors.report_date}</p>
          ) : null}
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            カテゴリ
          </span>
          <div className="flex flex-wrap gap-3">
            {REPORT_CATEGORIES.map((c) => (
              <label key={c.value} className="flex items-center gap-2 text-sm dark:text-slate-200">
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
          {errors.category ? (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          ) : null}
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            公開範囲
          </span>
          <div className="flex flex-wrap gap-3">
            {VISIBILITY_OPTIONS.map((v) => (
              <label key={v.value} className="flex items-center gap-2 text-sm dark:text-slate-200">
                <input
                  type="radio"
                  name="visibility"
                  className="cursor-pointer"
                  value={v.value}
                  checked={visibility === v.value}
                  onChange={() => setVisibility(v.value)}
                  disabled={v.value === "team" && !teamId}
                />
                {v.label}
                {v.value === "team" && !teamId ? (
                  <span className="text-xs text-slate-500 dark:text-slate-400">（要チーム参加）</span>
                ) : null}
              </label>
            ))}
          </div>
          {!teamId ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              チーム未参加のときは「全体公開」のみ保存できます。「チーム内のみ」は
              <Link href="/team" className="underline text-slate-900 dark:text-white">
                チーム画面
              </Link>
              から参加後に選択できます。
            </p>
          ) : null}
          {errors.visibility ? (
            <p className="mt-1 text-sm text-red-600">{errors.visibility}</p>
          ) : null}
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
            className="w-full rounded border border-slate-300 bg-white shadow-md dark:bg-slate-600 dark:border-slate-500 px-3 py-2 text-slate-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {content.length} / 2000
          </p>
          {errors.content ? (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          ) : null}
        </div>

        {errors.form ? (
          <p className="text-sm text-red-600" role="alert">
            {errors.form}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-slate-900 cursor-pointer shadow-md px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "保存中…" : "保存する"}
          </button>
          <Link
            href="/reports"
            className="rounded border border-slate-300 cursor-pointer shadow-sm px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
