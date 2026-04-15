import { expect, test } from "@playwright/test";
test.describe("ルーティング", () => {
  test.use({ storageState: undefined });

  test("トップアクセス時はログイン画面へ遷移する", async ({ page }) => {
    await page.goto("/");

    await page.waitForURL(/\/login/);

    await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
  });

  test("未ログインで保護ページにアクセスするとログインへリダイレクトされる", async ({ page }) => {
    const targetPath = "/reports";

    await page.goto(targetPath);

    await page.waitForURL(/\/login/);

    const nextParam = new URL(page.url()).searchParams.get("next");

    if (nextParam) {
      expect(nextParam).toBe(targetPath);
    }
  });
});
