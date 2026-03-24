"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AppHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const loadAvatar = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAvatarUrl(null);
      return;
    }
    const { data: row } = await supabase
      .from("users")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    setAvatarUrl(row?.avatar_url ?? null);
  }, []);

  useEffect(() => {
    void loadAvatar();
  }, [loadAvatar, pathname]);

  useEffect(() => {
    const onUpdate = () => void loadAvatar();
    window.addEventListener("profile-updated", onUpdate);
    return () => window.removeEventListener("profile-updated", onUpdate);
  }, [loadAvatar]);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="メニューを開く"
            className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-300 text-slate-700 md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
              <path d="M4 7h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
            </svg>
          </button>
          <form action="/reports" method="get" className="flex w-full max-w-md items-center gap-3">
            <input
              type="search"
              name="q"
              placeholder="検索"
              className="w-full rounded-full border border-slate-300 px-4 py-2 text-slate-900 outline-none focus:border-slate-500"
              aria-label="検索"
            />
            <button
              type="submit"
              className="hidden rounded-xl bg-slate-200 px-5 py-2 text-sm font-medium text-slate-900 hover:bg-slate-300 md:inline-flex"
            >
              検索
            </button>
          </form>
        </div>
        <Link
          href="/profile"
          aria-label="プロフィール"
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
              <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-3.88 0-7 2.12-7 4.75V21h14v-2c0-2.63-3.12-4.75-7-4.75Z" />
            </svg>
          )}
        </Link>
      </div>
    </header>
  );
}
