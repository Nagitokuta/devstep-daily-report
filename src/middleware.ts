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
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (isProtectedPath(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isProtectedPath(pathname) && !user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if ((pathname === "/login" || pathname === "/signup") && user) {
    return NextResponse.redirect(new URL("/reports", request.url));
  }

  if (!isPublicPath(pathname) && !isProtectedPath(pathname) && pathname !== "/") {
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
