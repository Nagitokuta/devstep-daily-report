"use client";

import { useEffect } from "react";

export default function DarkModeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 初期ロード時に localStorage を確認して dark クラスを付与
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (saved === "dark" || (!saved && prefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // 常に子要素を描画
  return <>{children}</>;
}