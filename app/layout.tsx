import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daily Report",
  description: "チームで日報を共有・管理するアプリ",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
<html lang="ja" className="h-full antialiased">
  <body
    className="min-h-full flex flex-col transition-colors duration-500"
  >
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const theme = localStorage.getItem('theme');
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const isDark = theme === 'dark' || (!theme && prefersDark);
              document.documentElement.classList.add(isDark ? 'dark' : 'light');
              // 一旦 body を visible にする
              document.body.style.visibility = 'visible';
            } catch(e) {}
          })();
        `,
      }}
    />
    {children}
  </body>
</html>
  );
}
