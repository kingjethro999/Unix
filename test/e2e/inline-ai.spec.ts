import { expect, test } from "@playwright/test";

test("inline Unix opens from a selection through keyboard and context menu", async ({
  page,
}) => {
  const email = `inline-${Date.now()}@example.test`;
  await page.goto("/sign-up");
  await page.getByLabel("Full Name").fill("Inline Writer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("ReliableWriting123!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByRole("button", { name: "Blank" }).click();
  await page.getByPlaceholder("Document Name").fill("Inline edits");
  await page.getByRole("button", { name: "Create", exact: true }).click();

  const editor = page.locator(".ProseMirror");
  await expect(editor).toBeVisible();
  await editor.fill("John walked slowly into the room.");
  await editor.click();
  await page.keyboard.down("Shift");
  for (let index = 0; index < 5; index += 1)
    await page.keyboard.press("ArrowLeft");
  await page.keyboard.up("Shift");

  await page.keyboard.press("ControlOrMeta+K");
  await expect(
    page.getByRole("region", { name: "Inline Unix request" }),
  ).toBeVisible();
  await expect(
    page.getByPlaceholder("Ask Unix to change this..."),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("region", { name: "Inline Unix request" }),
  ).toHaveCount(0);

  await editor.click();
  await page.keyboard.down("Shift");
  for (let index = 0; index < 5; index += 1)
    await page.keyboard.press("ArrowLeft");
  await page.keyboard.up("Shift");
  await editor.click({ button: "right" });
  await expect(
    page.getByRole("region", { name: "Inline Unix request" }),
  ).toBeVisible();
});
