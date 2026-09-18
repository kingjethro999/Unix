import { expect, test } from "@playwright/test";

test("theme choice applies and persists", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Use light theme" });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(
    page.getByRole("button", { name: "Use dark theme" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
