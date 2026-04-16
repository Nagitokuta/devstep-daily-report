import { expect, test } from "@playwright/test";

const protectedPaths = ["/reports/new", "/team", "/profile"];

test.describe("主要機能ページのアクセス制御", () => {
  for (const path of protectedPaths) {
    test(`${path} は未ログイン時にログインへ遷移する`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
      await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();

      const redirected = new URL(page.url());
      const nextParam = redirected.searchParams.get("next");
      if (nextParam) {
        expect(nextParam).toBe(path);
      }
    });
  }
});
