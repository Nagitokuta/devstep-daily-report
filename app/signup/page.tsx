"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
  
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
  
    const { data, error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: { name: name.trim() },
      },
    });

    if (signError) {
      setError("メールアドレスはすでに使われているか、入力に誤りがあります。");
      setPassword("");
      document.getElementById("password")?.focus();
      setLoading(false);
      return;
    }
  
    if (data.session) {
      await router.replace("/team");
      router.refresh();
      return;
    }
  
    setMessage(
      "確認メールを送信しました。メール内のリンクを開いて登録を完了してください。（登録済みの場合も確認メールが送信されます）"
    );

    setName("");
    setEmail("");
    setPassword("");
  
    setLoading(false);
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md md:w-1/2 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-semibold text-slate-900 dark:text-slate-100">
        新規登録
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            氏名
          </label>
          <input
            id="name"
            type="text"
            required
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 dark:text-slate-100 dark:border-slate-600 dark:bg-slate-700"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 dark:text-slate-100 dark:border-slate-600 dark:bg-slate-700"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 dark:text-slate-100 dark:border-slate-600 dark:bg-slate-700"
          />
          <p className="mt-1 text-xs text-slate-500">6文字以上</p>
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-emerald-700" role="status">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-slate-900 cursor-pointer py-2 text-sm font-medium text-white dark:text-white dark:bg-slate-900 hover:dark:bg-slate-700 hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "送信中…" : "登録する"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/login" className="text-slate-900 dark:text-slate-100">
          ログインへ
        </Link>
      </p>
    </div>
  );
}
