"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

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

    const {
      data: { publicUrl },
    } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

    const { error: dbErr } = await supabase
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    setUploading(false);
    if (dbErr) {
      setError(dbErr.message);
      return;
    }

    setAvatarUrl(publicUrl);
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
        <h1 className="text-2xl font-semibold text-slate-900">プロフィール</h1>
        <p className="mt-1 text-sm text-slate-600">
          表示名・プロフィール画像・所属チームを確認・編集できます。
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">プロフィール画像</h2>
        <p className="mt-1 text-sm text-slate-600">
          画像をタップしてアップロード（JPEG / PNG / WebP / GIF、最大5MB）
        </p>
        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative flex cursor-pointer h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 text-slate-500 transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-60 sm:h-44 sm:w-44"
            aria-label="プロフィール画像をアップロード"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 外部Storage URL
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-20 w-20 fill-current" aria-hidden="true">
                <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-3.88 0-7 2.12-7 4.75V21h14v-2c0-2.63-3.12-4.75-7-4.75Z" />
              </svg>
            )}
            {uploading ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white">
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
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                  氏名
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  required
                  className="w-full rounded border border-slate-300 px-3 py-3 text-base text-slate-900 sm:py-2.5"
                />
              </div>
              {error ? (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
              {message ? (
                <p className="text-sm text-emerald-700" role="status">
                  {message}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded bg-slate-900 cursor-pointer px-4 py-3 text-base font-medium text-white hover:bg-slate-800 disabled:opacity-60 sm:w-auto sm:py-2"
              >
                {saving ? "保存中…" : "保存する"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">所属チーム</h2>
        {teams.length === 0 ? (
          <p className="mt-4 text-base text-slate-600">所属しているチームはまだありません。</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {teams.map((t) => (
              <li key={t.id} className="flex flex-wrap items-baseline justify-between gap-2 py-4 first:pt-0">
                <span className="text-base font-medium text-slate-900">{t.project_name}</span>
                <span className="font-mono text-sm text-slate-500">
                  {t.team_code} · メンバー {t.members_num} 人
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
