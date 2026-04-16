import { expect, test } from "@playwright/test";

test.describe("認証ページ", () => {
  test("ログイン画面の基本要素を表示する", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByLabel("パスワード")).toBeVisible();
    await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
  });

  test("ログイン画面から新規登録に遷移できる", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "新規登録" }).click();

    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole("heading", { name: "新規登録" })).toBeVisible();
  });

  test("新規登録画面の入力項目を表示する", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.getByRole("heading", { name: "新規登録" })).toBeVisible();
    await expect(page.getByLabel("氏名")).toBeVisible();
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByLabel("パスワード")).toBeVisible();
    await expect(page.getByRole("button", { name: "登録する" })).toBeVisible();
  });

  test("パスワード再設定画面に遷移できる", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "パスワードを忘れた場合" }).click();

    await expect(page).toHaveURL(/\/reset-password$/);
    await expect(page.getByRole("heading", { name: "パスワード再設定" })).toBeVisible();
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByRole("button", { name: "メールを送信" })).toBeVisible();
  });
});
