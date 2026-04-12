import { z } from "zod";

export const reportFormSchema = z.object({
  title: z.string().trim().min(1, "タイトルを入力してください").max(50),
  report_date: z.string().min(1, "日付を選択してください"),
  category: z.enum(["development", "meeting", "other"]),
  visibility: z.enum(["team", "global"]),
  content: z
    .string()
    .min(1, "本文を入力してください")
    .max(2000, "本文は2000文字以内です"),
});

export type ReportFormInput = z.infer<typeof reportFormSchema>;

/** 「チーム内のみ」のときは所属チームのいずれかを reportTeamId で指定する */
export function reportFormSchemaWithTeamContext(
  teams: { id: string }[],
  reportTeamId: string | null,
) {
  return reportFormSchema.superRefine((data, ctx) => {
    if (data.visibility !== "team") return;
    if (teams.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "「チーム内のみ」はチームに参加してから投稿してください。",
        path: ["visibility"],
      });
      return;
    }
    if (!reportTeamId || !teams.some((t) => t.id === reportTeamId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "紐づけるチームを選択してください。",
        path: ["team_id"],
      });
    }
  });
}

export const commentSchema = z
  .string()
  .trim()
  .min(1, "コメントを入力してください")
  .max(500, "500文字以内です");
