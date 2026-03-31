"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 min-h-screen dark:bg-slate-800 dark:bg-slate-800">
        <AppHeader onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">{children}</main>
      </div>
    </div>
  );
}
