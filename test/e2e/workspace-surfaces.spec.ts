import { expect, test, type Locator } from "@playwright/test";

async function expectDarkSurface(locator: Locator) {
  const colors = await locator.evaluate((element: HTMLElement) => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, color: style.color };
  });
  expect(colors.background).not.toBe("rgb(255, 255, 255)");
  expect(colors.color).not.toBe("rgb(0, 0, 0)");
}

test("workspace portals keep the dark Unix surface", async ({ page }) => {
  const email = `surfaces-${Date.now()}@example.test`;
  await page.goto("/sign-up");
  await page.getByLabel("Full Name").fill("Surface Writer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("ReliableWriting123!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByRole("button", { name: "Blank" }).click();
  await page.getByPlaceholder("Document Name").fill("Surface checks");
  await page.getByRole("button", { name: "Create", exact: true }).click();

  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await expect(
    page.locator('[data-slot="dropdown-menu-content"]'),
  ).toBeVisible();
  await expectDarkSurface(page.locator('[data-slot="dropdown-menu-content"]'));

  await page.getByRole("menuitem", { name: "World wiki" }).click();
  await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible();
  await expectDarkSurface(page.locator('[data-slot="dialog-content"]'));
});
