import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const publicPaths = new Set([
  "/",
  "/login",
  "/signup",
  "/reset-password",
]);

function isPublicPath(pathname: string): boolean {
  if (publicPaths.has(pathname)) return true;
  if (pathname.startsWith("/auth/")) return true;
  return false;
}

function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/reports") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/team")
  );
}

export async function middleware(request: NextRequest) {

  console.log("middleware start")

  let supabaseResponse = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  try {

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return supabaseResponse;

  } catch (e) {
    console.error(e);
    return supabaseResponse;
  }
}

export const config = {
  matcher: ["/:path*"],
};