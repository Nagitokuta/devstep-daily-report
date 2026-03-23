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

/** チーム未参加時は「チーム内のみ」を選べない */
export function reportFormSchemaWithTeamContext(teamId: string | null) {
  return reportFormSchema.superRefine((data, ctx) => {
    if (data.visibility === "team" && !teamId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "「チーム内のみ」はチームに参加し、表示中のチームを選んだ状態で投稿してください。",
        path: ["visibility"],
      });
    }
  });
}

export const commentSchema = z
  .string()
  .trim()
  .min(1, "コメントを入力してください")
  .max(500, "500文字以内です");
