import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const publicPaths = new Set([
  "/",
  "/login",
  "/signup",
  "/reset-password",
]);

function isPublicPath(pathname: string) {
  if (publicPaths.has(pathname)) return true;
  if (pathname.startsWith("/auth/")) return true;
  return false;
}

function isProtectedPath(pathname: string) {
  return pathname.startsWith("/reports") ||
         pathname.startsWith("/profile") ||
         pathname.startsWith("/team");
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) return res;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { fetch: fetch }, // Edge では fetch を渡す
  });

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;

  if (isProtectedPath(pathname) && !user) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if ((pathname === "/login" || pathname === "/signup") && user) {
    return NextResponse.redirect(new URL("/reports", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};