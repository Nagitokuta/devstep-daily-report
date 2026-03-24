export const REPORT_CATEGORIES = [
  { value: "development", label: "開発" },
  { value: "meeting", label: "会議" },
  { value: "other", label: "その他" },
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number]["value"];

export const VISIBILITY_OPTIONS = [
  { value: "team" as const, label: "チーム内のみ" },
  { value: "global" as const, label: "全体公開" },
];

export function categoryLabel(value: string): string {
  const found = REPORT_CATEGORIES.find((c) => c.value === value);
  return found?.label ?? value;
}

export function visibilityLabel(value: string): string {
  const found = VISIBILITY_OPTIONS.find((v) => v.value === value);
  return found?.label ?? value;
}
