"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/profile", label: "プロフィール" },
  { href: "/reports/new", label: "日報作成" },
  { href: "/reports", label: "日報一覧" },
  { href: "/team", label: "チーム" },
];

type AppSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = (() => {
    if (pathname.startsWith("/profile")) return "プロフィール";
    if (pathname.startsWith("/team")) return "チーム";
    if (pathname.startsWith("/reports/new")) return "日報作成";
    if (pathname.startsWith("/reports/") && pathname !== "/reports") return "日報詳細";
    return "日報一覧";
  })();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
    {isOpen ? (
      <button
        type="button"
        className="fixed inset-0 z-30 bg-black/30 md:hidden"
        aria-label="メニューを閉じる"
        onClick={onClose}
      />
    ) : null}
  
    <aside
      className={`fixed top-0 left-0 z-40 h-screen w-64 overflow-y-auto
      border-r border-slate-200 dark:border-slate-600
      bg-white dark:bg-slate-800/95 backdrop-blur
      transition-transform md:w-56 md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="p-4 md:p-5">
        <Link
          href="/reports"
          onClick={onClose}
          className="
          text-3xl font-semibold md:text-4xl
          text-slate-900 dark:text-slate-100
          transition-colors
          "
        >
          {pageTitle}
        </Link>
      </div>
  
      <nav className="space-y-1 px-3 pb-4 md:px-4">
        {navItems.map((item) => {
          const active = (() => {
            if (item.href === "/reports/new") {
              return pathname.startsWith("/reports/new");
            }
            if (item.href === "/reports") {
              return (
                pathname === "/reports" ||
                (pathname.startsWith("/reports/") &&
                  !pathname.startsWith("/reports/new"))
              );
            }
            if (item.href === "/profile") {
              return pathname.startsWith("/profile");
            }
            if (item.href === "/team") {
              return pathname.startsWith("/team");
            }
            return pathname === item.href;
          })();
  
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
              block rounded px-3 py-2 text-lg
              transition-colors
  
              ${
                active
                  ? `
                  bg-slate-900 text-white
                  dark:bg-slate-600 dark:text-white
                  `
                  : `
                  text-slate-700 dark:text-slate-300
                  hover:bg-slate-100 dark:hover:bg-slate-700
                  hover:text-slate-900 dark:hover:text-white
                  `
              }
              `}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
  
      <div className="px-6 pb-6 md:pt-4">
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="
          text-lg cursor-pointer
          text-slate-700 dark:text-slate-300
          hover:text-slate-900 dark:hover:text-white
          transition-colors
          "
        >
          ログアウト
        </button>
      </div>
    </aside>
  </>
  );
}
