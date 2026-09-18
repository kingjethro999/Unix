import { expect, test } from "@playwright/test";

test("agent writing creates a reviewable manuscript action instead of chat prose", async ({
  page,
}) => {
  const email = `agent-${Date.now()}@example.test`;
  await page.goto("/sign-up");
  await page.getByLabel("Full Name").fill("Agent Writer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("ReliableWriting123!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByRole("button", { name: "Blank" }).click();
  await page.getByPlaceholder("Document Name").fill("Untitled Page");
  await page.getByRole("button", { name: "Create", exact: true }).click();

  await page.route("**/api/ai/chat", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const request = route.request().postDataJSON() as {
      activeDocument?: { id: string };
    };
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        type: "document",
        conversationId: "11111111-1111-4111-8111-111111111111",
        text: "Renamed the page and prepared the opening for review.",
        document: {
          fileId: request.activeDocument?.id,
          title: "The First Tremor",
          appendText: "The city trembled before dawn.",
          description: "Draft opening scene",
        },
      }),
    });
  });

  await page
    .getByPlaceholder(/Ask (Unix|about)/)
    .fill("Rename the page and write Quiver's opening.");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(
    page.getByRole("button", { name: "The First Tremor", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Draft opening scene")).toBeVisible();
  await expect(page.getByText("The city trembled before dawn.")).toBeVisible();
  await expect(page.getByText("Add to page")).toHaveCount(0);

  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.locator(".ProseMirror")).toContainText(
    "The city trembled before dawn.",
  );
});
