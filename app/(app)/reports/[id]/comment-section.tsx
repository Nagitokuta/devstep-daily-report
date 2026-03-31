"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { commentSchema } from "@/lib/validations/report";
import { ThumbsUp } from "lucide-react";

type CommentRow = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  users:
    | { name: string; avatar_url: string | null }
    | { name: string; avatar_url: string | null }[]
    | null;
  comment_likes?: { user_id: string }[];
};

type CommentSectionProps = {
  reportId: string;
  currentUserId: string;
  initialComments: CommentRow[];
};

function commentAuthor(users: CommentRow["users"]): string {
  if (!users) return "不明";
  const u = Array.isArray(users) ? users[0] : users;
  return u?.name ?? "不明";
}

function likeCount(likes?: { user_id: string }[]) {
  return likes?.length ?? 0;
}

function isLiked(
  likes: { user_id: string }[] | undefined,
  userId: string,
) {
  return likes?.some(l => l.user_id === userId) ?? false;
}

export function CommentSection({
  reportId,
  currentUserId,
  initialComments,
}: CommentSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "入力エラー");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error: insertError } = await supabase
      .from("comments")
      .insert({
        report_id: reportId,
        user_id: user.id,
        content: parsed.data,
      })
      .select(`
        id,
        content,
        created_at,
        user_id,
        users ( name, avatar_url ),
        comment_likes ( user_id )
      `)
      .single();
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (data) {
      setComments((prev) => [...prev, data as CommentRow]);
      setBody("");
      router.refresh();
    }
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("このコメントを削除しますか？")) {
      return;
    }
    const supabase = createClient();
    const { error: delError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);
    if (delError) {
      setError(delError.message);
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    router.refresh();
  }

  async function handleLike(commentId: string, liked: boolean) {
    const supabase = createClient();
  
    if (liked) {
      await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", currentUserId);
    } else {
      await supabase
        .from("comment_likes")
        .insert({
          comment_id: commentId,
          user_id: currentUserId,
        });
    }
  
    const { data } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        user_id,
        users ( name, avatar_url ),
        comment_likes ( user_id )
      `)
      .eq("report_id", reportId);
  
    if (data) {
      setComments(data as CommentRow[]);
    }
  }

  return (
    <section className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-700">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">コメント</h2>
    
      <ul className="mt-4 space-y-4">
        {comments.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border border-slate-100 bg-white shadow-sm bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {commentAuthor(c.users)}
              </span>
              <time className="text-xs text-slate-500 dark:text-slate-400" dateTime={c.created_at}>
                {new Date(c.created_at).toLocaleString("ja-JP")}
              </time>
            </div>
    
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
              {c.content}
            </p>
    
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  handleLike(c.id, isLiked(c.comment_likes, currentUserId))
                }
                className="flex items-center gap-1 text-xs cursor-pointer text-slate-500 dark:text-slate-400 hover:text-blue-500 transition active:scale-110"
              >
                <ThumbsUp
                  size={16}
                  className={`transition ${
                    isLiked(c.comment_likes, currentUserId)
                      ? "fill-blue-200 text-blue-500"
                      : ""
                  }`}
                />
                <span>{likeCount(c.comment_likes)}</span>
              </button>
            </div>
    
            {c.user_id === currentUserId ? (
              <button
                type="button"
                onClick={() => void handleDelete(c.id)}
                className="mt-2 text-xs cursor-pointer text-red-600 dark:text-red-400"
              >
                削除
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-2">
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          コメントを追加（500文字以内）
        </label>
        <textarea
          id="comment"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={500}
          className="w-full rounded border border-slate-300 bg-white shadow-sm px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-600 dark:text-slate-200"
        />
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-slate-900 cursor-pointer px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {loading ? "送信中…" : "投稿する"}
        </button>
      </form>
    </section>
  );
}
