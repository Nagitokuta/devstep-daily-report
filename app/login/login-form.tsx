"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/reports";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
  
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    setLoading(false);
  
    if (signError) {
      setError("メールアドレスかパスワードが違います。");
      return;
    }
  
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md md:w-1/2 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-semibold text-slate-900">
        ログイン
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            パスワード
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
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
          className="w-full rounded bg-slate-900 cursor-pointer py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "送信中…" : "ログイン"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/signup" className="text-slate-900 underline">
          新規登録
        </Link>
        {" · "}
        <Link href="/reset-password" className="text-slate-900 underline">
          パスワードを忘れた場合
        </Link>
      </p>
    </div>
  );
}
