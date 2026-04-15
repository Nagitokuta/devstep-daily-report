import { expect, test } from "@playwright/test";

test.describe("ルーティング", () => {
  test("トップアクセス時はログイン画面へ遷移する", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
    await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
  });

  test("未ログインで保護ページにアクセスするとログインへリダイレクトされる", async ({ page }) => {
    const targetPath = "/reports";

    await page.goto(targetPath);
    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);

    const redirected = new URL(page.url());
    const nextParam = redirected.searchParams.get("next");

    if (nextParam) {
      expect(nextParam).toBe(targetPath);
    }
  });
});
