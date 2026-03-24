import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// 公開ページのパス
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
  return (
    pathname.startsWith("/reports") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/team")
  );
}

export async function middleware(request: NextRequest) {
  console.log("middleware start");

  const response = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // env が未設定の場合は公開ページだけ通す
  if (!supabaseUrl || !supabaseKey) {
    if (isProtectedPath(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  try {
    // Edge 対応の Supabase client
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach((cookie) => {
            response.cookies.set(cookie.name, cookie.value, cookie.options);
          });
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    const pathname = request.nextUrl.pathname;

    // protected route に未ログインなら login にリダイレクト
    if (isProtectedPath(pathname) && !user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ログイン済みユーザーが login/signup にアクセスした場合は reports にリダイレクト
    if ((pathname === "/login" || pathname === "/signup") && user) {
      return NextResponse.redirect(new URL("/reports", request.url));
    }

    return response;

  } catch (err) {
    console.error("Middleware Edge error:", err);
    return response;
  }
}

// Edge Runtime matcher 設定
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};