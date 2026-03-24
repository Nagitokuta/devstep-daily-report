import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-24 text-center">
      <p className="text-6xl font-semibold text-slate-300">404</p>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">
        ページが見つかりません
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        URL が間違っているか、削除された可能性があります。
      </p>
      <Link
        href="/reports"
        className="mt-8 inline-block rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        日報一覧へ
      </Link>
    </div>
  );
}
