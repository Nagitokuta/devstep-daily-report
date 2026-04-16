import { expect, test, type Page } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

async function login(page: Page) {
  await page.goto("/login");

  console.log("EMAIL:", E2E_EMAIL);
  console.log("PASSWORD:", E2E_PASSWORD);

  if (!E2E_EMAIL || !E2E_PASSWORD) {
    throw new Error("E2E_EMAIL / E2E_PASSWORD が未設定です");
  }

  await page.getByLabel("メールアドレス").fill(E2E_EMAIL!);
  await page.getByLabel("パスワード").fill(E2E_PASSWORD!);
  await page.getByRole("button", { name: "ログイン" }).click();

  await expect(page).toHaveURL(/\/reports/, { timeout: 15000 });
  
  await expect(
    page.getByText("読み込み中…")
  ).toBeHidden({ timeout: 15000 });
  
  await expect(
    page.getByRole("heading", { name: "日報一覧" })
  ).toBeVisible();
}

async function openReportFromList(page: Page, title: string) {
  const link = page.getByRole("link", { name: new RegExp(title) }).first();

  await expect(link).toBeVisible({ timeout: 15000 });
  await link.click();

  await expect(
    page.getByRole("heading", { name: title })
  ).toBeVisible({ timeout: 15000 });
}

test.describe("主要機能E2E", () => {
  test.describe.configure({ mode: "serial" });

  let reportTitle = "";
  let updatedReportTitle = "";
  let createdTeamName = "";

  test.beforeAll(() => {
    test.skip(!E2E_EMAIL || !E2E_PASSWORD, "E2E_EMAIL / E2E_PASSWORD が未設定です。");
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("日報作成・検索・絞り込み", async ({ page }) => {
    reportTitle = `E2E作成 ${Date.now()}`;
    createdTeamName = `E2Eチーム ${Date.now()}`;

    await page.goto("/reports/new");

    await expect(page.getByRole("heading", { name: "日報を作成" }))
      .toBeVisible();

    await page.getByLabel("タイトル（50文字以内）").fill(reportTitle);
    await page.getByLabel("日付").fill("2026-04-15");
    await page.getByRole("radio", { name: "会議" }).check();
    await page.getByLabel("本文（2000文字以内）")
      .fill("E2Eの作成テスト本文");

    await page.getByRole("button", { name: "保存する" }).click();

    await expect(page.getByRole("heading", { name: "日報一覧" }))
      .toBeVisible();

    await page.getByRole("searchbox", { name: "検索" }).fill(reportTitle);
    await page.getByRole("button", { name: "検索" }).click();

    await expect(page.getByText(`検索: ${reportTitle}`))
      .toBeVisible();

    await page.getByRole("button", { name: "会議" }).click();

    await expect(page.getByText("検索:")).toBeVisible();

    await openReportFromList(page, reportTitle);
  });

  test("日報編集", async ({ page }) => {
    test.skip(!reportTitle, "前テスト未完了");

    await page.goto("/reports");

    await page.getByRole("searchbox", { name: "検索" }).fill(reportTitle);
    await page.getByRole("button", { name: "検索" }).click();

    await openReportFromList(page, reportTitle);

    await page.getByRole("link", { name: "編集" }).click();

    await expect(
      page.getByRole("heading", { name: "日報を編集" })
    ).toBeVisible();

    updatedReportTitle = `${reportTitle} 更新`;

    await page.getByLabel("タイトル（50文字以内）")
      .fill(updatedReportTitle);

    await page.getByLabel("本文（2000文字以内）")
      .fill("E2E更新テスト");

    await page.getByRole("button", { name: "更新する" }).click();

    await expect(
      page.getByRole("heading", { name: updatedReportTitle })
    ).toBeVisible();
  });

  test("チーム作成", async ({ page }) => {
    await page.goto("/team");

    await expect(
      page.getByRole("heading", { level: 1, name: "チーム" })
    ).toBeVisible();

    await page.getByLabel("チーム名").fill(createdTeamName);
    await page.getByRole("button", { name: "チームを作成" }).click();

    await expect(page.getByText("チームを作成しました！🎉"))
      .toBeVisible();

    await page.getByRole("button", { name: "閉じる" }).click();

    await expect(page.getByText("チームを作成しました！🎉"))
      .not.toBeVisible();

    await page.getByLabel("参加コード").fill("INVALIDCODE");
    await page.getByRole("button", { name: "チームに参加" }).click();

    await expect(
      page.getByRole("alert").filter({
        hasText: "参加コードが存在しません。",
      })
    ).toBeVisible();
  });

  test("プロフィール編集", async ({ page }) => {
    await page.goto("/profile");

    await expect(
      page.getByRole("heading", { level: 1, name: "プロフィール" })
    ).toBeVisible();

    const nameInput = page.getByLabel("氏名");

    const originalName = await nameInput.inputValue();
    const nextName = `${originalName} e2e`.slice(0, 50);

    await nameInput.fill(nextName);
    await page.getByRole("button", { name: "保存する" }).click();

    await expect(page.getByText("保存しました。")).toBeVisible();

    await nameInput.fill(originalName);
    await page.getByRole("button", { name: "保存する" }).click();

    await expect(page.getByText("保存しました。")).toBeVisible();
  });

  test("日報削除", async ({ page }) => {
    test.skip(!updatedReportTitle, "未更新");

    await page.goto("/reports");

    await page.getByRole("searchbox", { name: "検索" }).fill(updatedReportTitle);
    await page.getByRole("button", { name: "検索" }).click();

    await openReportFromList(page, updatedReportTitle);

    page.once("dialog", (dialog) => dialog.accept());

    await page.getByRole("button", { name: "削除" }).click();

    await expect(page).toHaveURL(/\/reports/);
    
    await page.getByRole("searchbox", { name: "検索" }).fill("");
    await page.getByRole("button", { name: "検索" }).click();

    await expect(
      page.getByRole("link", { name: updatedReportTitle })
    ).toHaveCount(0);
  });
});