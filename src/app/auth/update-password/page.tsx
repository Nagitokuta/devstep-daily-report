"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.replace("/reports");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-semibold text-slate-900">
        新しいパスワード
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            新しいパスワード
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "更新中…" : "パスワードを更新"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/login" className="text-slate-900 underline">
          ログインへ
        </Link>
      </p>
    </div>
  );
}
