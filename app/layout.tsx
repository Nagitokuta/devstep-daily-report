import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import { headers } from "next/headers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default async function RootLayout({ children }: { children: ReactNode }) {
  // SSRでCookieを読む
  const headersList = await headers(); 
  const cookieHeader = headersList.get("cookie") ?? "";
  const isDark = cookieHeader.includes("theme=dark");

  return (
    <html lang="ja" className={`h-full antialiased ${isDark ? "dark" : ""}`}>
      <body className="min-h-full flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-500">
        {children}
      </body>
    </html>
  );
}