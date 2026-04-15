import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // CI や一時環境で Supabase 設定が無い場合でも、
  // ルートアクセスは確実にログイン画面へ遷移させる。
  if (!supabaseUrl || !supabaseKey) {
    redirect("/login");
  }

  const supabase = await createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/reports");
    }
  } catch {
    redirect("/login");
  }

  redirect("/login");
}