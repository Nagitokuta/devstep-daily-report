"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  q: string;
  category: string;
};

export default function ReportFilters({ q, category }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const move = (url: string) => {
    const current = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    if (current === url) {
      return;
    }

    startTransition(() => {
      router.replace(url);
    });
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        onClick={() => move(`/reports${q ? `?q=${q}` : ""}`)}
        disabled={isPending}
        className={`rounded-full px-3 py-1 text-sm border cursor-pointer transition ${
          !category
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600 dark:hover:text-white"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        全て
      </button>

      <button
        onClick={() => move(`/reports?category=development${q ? `&q=${q}` : ""}`)}
        disabled={isPending}
        className={`rounded-full px-3 py-1 text-sm border cursor-pointer transition ${
          category === "development"
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600 dark:hover:text-white"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        開発
      </button>

      <button
        onClick={() => move(`/reports?category=meeting${q ? `&q=${q}` : ""}`)}
        disabled={isPending}
        className={`rounded-full px-3 py-1 text-sm border cursor-pointer transition ${
          category === "meeting"
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600 dark:hover:text-white"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        会議
      </button>

      <button
        onClick={() => move(`/reports?category=other${q ? `&q=${q}` : ""}`)}
        disabled={isPending}
        className={`rounded-full px-3 py-1 text-sm border cursor-pointer transition ${
          category === "other"
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600 dark:hover:text-white"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        その他
      </button>
      {isPending ? (
        <p className="ml-2 text-xs text-slate-500 dark:text-slate-400" role="status">
          絞り込み中…
        </p>
      ) : null}
    </div>
  );
}