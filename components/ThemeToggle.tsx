"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");

    if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);

    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme","dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme","light");
    }
  }

  return (
    <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 p-6">

      <div>
        <div className="flex items-center gap-2 text-base font-medium text-slate-900 dark:text-white">
          {dark ? <Moon size={18}/> : <Sun size={18}/>}
          ダークモード
        </div>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          画面テーマを切り替えます
        </p>
      </div>

      <button
        onClick={toggle}
        className={`
            relative h-8 w-16 cursor-pointer rounded-full transition
            ${dark ? "bg-sky-600" : "bg-slate-300"}
        `}
        >

        <div
        className={`
            absolute top-1 h-6 w-6 rounded-full bg-white shadow transition
            ${dark ? "left-8" : "left-1"}
        `}
        />

    </button>
    
    </div>
  );
}