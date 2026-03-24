// app/api/auth/middlewareNode.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function handler(req: NextRequest) {
  const response = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
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

    const pathname = req.nextUrl.pathname;

    // protected route に未ログインなら login にリダイレクト
    if ((pathname.startsWith("/reports") ||
         pathname.startsWith("/profile") ||
         pathname.startsWith("/team")) && !user) {
      const login = new URL("/login", req.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }

    // ログイン済みユーザーが login/signup にアクセスした場合は reports にリダイレクト
    if ((pathname === "/login" || pathname === "/signup") && user) {
      return NextResponse.redirect(new URL("/reports", req.url));
    }

    return response;
  } catch (err) {
    console.error("Node middleware error:", err);
    return response;
  }
}