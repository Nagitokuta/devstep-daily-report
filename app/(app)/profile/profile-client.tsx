"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const AVATAR_BUCKET = "avatars";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type TeamRow = {
  id: string;
  project_name: string;
  team_code: string;
  members_num: number;
};

function notifyProfileUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("profile-updated"));
  }
}

export function ProfileClient() {
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: row } = await supabase
      .from("users")
      .select("name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (row) {
      setName(row.name);
      setAvatarUrl(row.avatar_url ?? null);
    }

    const { data: memberRows } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id);

    const teamIds = (memberRows ?? []).map((r) => r.team_id).filter(Boolean);
    if (teamIds.length > 0) {
      const { data: teamRows } = await supabase
        .from("teams")
        .select("id, project_name, team_code, members_num")
        .in("id", teamIds);
      const list = ((teamRows ?? []) as TeamRow[]).sort((a, b) =>
        a.project_name.localeCompare(b.project_name, "ja"),
      );
      setTeams(list);
    } else {
      setTeams([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
  
    setError(null);
    setMessage(null);
  
    if (!file.type.startsWith("image/")) {
      setError("画像ファイル（JPEG / PNG / WebP / GIF）を選んでください。");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("ファイルサイズは5MB以下にしてください。");
      return;
    }
  
    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }
  
    // ファイル名は固定して上書き
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    const path = `${user.id}/avatar.${safeExt}`;
  
    const { error: upErr } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type || "image/jpeg",
    });
  
    if (upErr) {
      setUploading(false);
      setError(upErr.message);
      return;
    }
  
    // キャッシュ回避用にクエリパラメータ ?t=timestamp を付与
    const { data: { publicUrl } } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
  
    const { error: dbErr } = await supabase
      .from("users")
      .update({ avatar_url: cacheBustedUrl })
      .eq("id", user.id);
  
    setUploading(false);
    if (dbErr) {
      setError(dbErr.message);
      return;
    }
  
    setAvatarUrl(cacheBustedUrl);
    setMessage("プロフィール画像を更新しました。");
    notifyProfileUpdated();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 50) {
      setError("名前は1〜50文字で入力してください。");
      setSaving(false);
      return;
    }
    const { error: upError } = await supabase
      .from("users")
      .update({
        name: trimmed,
      })
      .eq("id", user.id);
    setSaving(false);
    if (upError) {
      setError(upError.message);
      return;
    }
    setMessage("保存しました。");
    notifyProfileUpdated();
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-600" role="status">
        読み込み中…
      </p>
    );
  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 transition-colors">
          プロフィール
        </h1>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 transition-colors">
          表示名・プロフィール画像・所属チームを確認・編集できます。
        </p>
      </div>


      <section className="
      rounded-lg
      border border-slate-200 dark:border-slate-600
      bg-white dark:bg-slate-800
      p-6 sm:p-8
      shadow-sm dark:shadow-black/20
      transition-colors
      ">

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          プロフィール画像
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          画像をタップしてアップロード（JPEG / PNG / WebP / GIF、最大5MB）
        </p>

        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start">

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="
            relative flex cursor-pointer
            h-36 w-36 sm:h-44 sm:w-44
            shrink-0 items-center justify-center
            overflow-hidden rounded-full

            border-2 border-slate-200 dark:border-slate-600
            bg-slate-100 dark:bg-slate-700

            text-slate-500 dark:text-slate-300

            transition-colors
            hover:border-slate-400 dark:hover:border-slate-500

            focus:outline-none
            focus:ring-2 focus:ring-slate-400
            focus:ring-offset-2
            dark:focus:ring-offset-slate-800

            disabled:opacity-60
            "
          >

            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-20 w-20 fill-current">
                <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-3.88 0-7 2.12-7 4.75V21h14v-2c0-2.63-3.12-4.75-7-4.75Z"/>
              </svg>
            )}

            {uploading ? (
              <span className="
              absolute inset-0 flex items-center justify-center
              bg-black/40
              text-sm font-medium text-white
              ">
                送信中…
              </span>
            ) : null}

          </button>


          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(ev) => void handleAvatarFile(ev)}
          />


          <div className="w-full min-w-0 flex-1 space-y-4">

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">

            <div>
              <label
                htmlFor="name"
                className="
                mb-1 block text-sm font-medium
                text-slate-700 dark:text-slate-300
                "
              >
                氏名
              </label>

              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                required
                className="
                w-full rounded
                border border-slate-300 dark:border-slate-600

                bg-white dark:bg-slate-900

                px-3 py-3 sm:py-2.5
                text-base

                text-slate-900 dark:text-slate-100

                transition-colors
                "
              />
            </div>


              {error ? (
                <p className="text-sm text-red-600">
                  {error}
                </p>
              ) : null}


              {message ? (
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  {message}
                </p>
              ) : null}


              <button
                type="submit"
                disabled={saving}
                className="
                w-full sm:w-auto

                rounded
                px-4 py-3 sm:py-2

                text-base font-medium text-white

                bg-slate-900 dark:bg-slate-700
                hover:bg-slate-800 dark:hover:bg-slate-600

                cursor-pointer
                transition-colors

                disabled:opacity-60
                "
              >
                {saving ? "保存中…" : "保存する"}
              </button>

            </form>

          </div>

        </div>

      </section>


      <section className="
      rounded-lg
      border border-slate-200 dark:border-slate-600
      bg-white dark:bg-slate-800
      p-6 sm:p-8
      shadow-sm dark:shadow-black/20
      transition-colors
      ">

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          所属チーム
        </h2>

        {teams.length === 0 ? (
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            所属しているチームはまだありません。
          </p>
        ) : (

          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-700">

            {teams.map((t) => (

              <li key={t.id}
              className="flex flex-wrap items-baseline justify-between gap-2 py-4 first:pt-0">

                <span className="text-base font-medium text-slate-900 dark:text-slate-100">
                  {t.project_name}
                </span>

                <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                  {t.team_code} · メンバー {t.members_num} 人
                </span>

              </li>

            ))}

          </ul>

        )}

      </section>


      <section className="
      rounded-lg
      border border-slate-200 dark:border-slate-600
      bg-white dark:bg-slate-800
      p-6 sm:p-8
      shadow-sm dark:shadow-black/20
      transition-colors
      ">

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          設定
        </h2>

        <ThemeToggle />

      </section>

    </div>
  );
}
