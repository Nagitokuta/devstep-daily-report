"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

export function AppHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // ★追加
  const [loading, setLoading] = useState(false);

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

    <header className="
      relative
      sticky top-0 z-30
      border-b border-slate-200 dark:border-slate-600
      bg-white/95 dark:bg-slate-800/95
      backdrop-blur
      shadow-sm dark:shadow-black/20
      transition-colors
    ">
      
      <LoadingOverlay show={loading} text="検索中..." />

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">

        <div className="flex flex-1 items-center gap-3">

          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="メニューを開く"
            className="
              inline-flex h-10 w-10 items-center justify-center rounded
              border border-slate-300 dark:border-slate-600
              text-slate-700 dark:text-slate-300
              hover:bg-slate-100 dark:hover:bg-slate-700
              transition-colors
              md:hidden
            "
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
              <path d="M4 7h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
            </svg>
          </button>

          <form
            action="/reports"
            method="get"
            onSubmit={() => setLoading(true)}
            className="relative flex w-full max-w-md items-center gap-3"
          >

            <input
              type="search"
              name="q"
              placeholder="検索"
              defaultValue={q}
              className="
                w-full rounded-full
                border border-slate-300 dark:border-slate-600
                bg-white dark:bg-slate-900
                px-4 py-2
                text-slate-900 dark:text-slate-100
                outline-none
                focus:border-slate-500 dark:focus:border-slate-400
                transition-colors
              "
              aria-label="検索"
            />

            <button
              type="submit"
              disabled={loading}
              className="
                hidden whitespace-nowrap min-w-[80px]
                rounded-xl cursor-pointer
                bg-slate-200 dark:bg-slate-700
                px-6 py-2
                text-sm font-medium
                text-slate-900 dark:text-white
                hover:bg-slate-300 dark:hover:bg-slate-600
                transition-colors
                md:inline-flex
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              検索
            </button>

          </form>

        </div>

        <Link
          href="/profile"
          aria-label="プロフィール"
          className="
            flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full
            bg-slate-200 dark:bg-slate-700
            text-slate-700 dark:text-slate-200
            hover:bg-slate-300 dark:hover:bg-slate-600
            transition-colors
          "
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
              <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-3.88 0-7 2.12-7 4.75V21h14v-2c0-2.63-3.12-4.75-7-4.75Z" />
            </svg>
          )}
        </Link>

      </div>

    </header>
  );
}