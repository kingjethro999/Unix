import { expect, test } from "@playwright/test";

test("desktop entry is a focused welcome flow and does not use the web landing page", async ({
  page,
}) => {
  await page.goto("/desktop");

  await expect(
    page.getByRole("heading", {
      name: "A calmer place to finish important work.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Create your workspace/ }),
  ).toHaveAttribute("href", "/sign-up?desktop=1");
  await expect(page.getByText("Built for long-form writing")).toBeVisible();

  await Promise.all([
    page.waitForURL("**/sign-up?desktop=1"),
    page.getByRole("link", { name: /Create your workspace/ }).click(),
  ]);
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/sign-in?desktop=1",
  );

  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /The Foundational Workspace for Writers/,
    }),
  ).toBeVisible();
});
