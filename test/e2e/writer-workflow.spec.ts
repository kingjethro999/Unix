import { expect, test } from "@playwright/test";

test("writer workflow preserves rich content, rules, images, failures, and sharing", async ({
  page,
  browser,
}) => {
  const email = `unix-${Date.now()}@example.test`;
  await page.goto("/sign-up");
  await page.getByLabel("Full Name").fill("Unix Browser Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("ReliableWriting123!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/create$/, { timeout: 30_000 });

  await page.getByRole("button", { name: "Blank" }).click();
  await page.getByPlaceholder("Document Name").fill("Formatting Trust");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page).toHaveURL(/\/workspace\/[a-f0-9-]+$/, { timeout: 30_000 });
  const workspaceUrl = page.url();

  const editor = page.locator(".ProseMirror");
  await expect(editor).toBeVisible();
  await editor.fill("Same opening. Same opening. Cafe remains vivid.");
  await editor.click();
  await page.keyboard.down("Shift");
  for (let index = 0; index < 6; index += 1)
    await page.keyboard.press("ArrowLeft");
  await page.keyboard.up("Shift");
  await page.getByRole("button", { name: "Bold" }).click();
  await expect(editor.locator("strong")).toHaveText("vivid.");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible({
    timeout: 12_000,
  });

  await page.getByRole("button", { name: ".unixrc", exact: true }).click();
  await expect(page.locator(".ProseMirror h2").first()).toHaveText("Rules");
  await page
    .getByRole("button", { name: "Untitled Page", exact: true })
    .click();
  await page.getByPlaceholder(/Ask (Unix|about)/).fill("Summarize this page.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator("article")).toHaveCount(2, { timeout: 45_000 });
  await expect(page.locator("article").last()).not.toContainText(
    "Summarize this page.",
  );
  await expect(editor).toContainText(
    "Same opening. Same opening. Cafe remains vivid.",
  );

  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Insert image" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: "one-pixel.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9WlS8AAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(editor.locator("img")).toHaveCount(1);
  await editor.evaluate((element, encoded) => {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    const transfer = new DataTransfer();
    transfer.items.add(new File([bytes], "dropped.png", { type: "image/png" }));
    const bounds = element.getBoundingClientRect();
    element.dispatchEvent(
      new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer: transfer,
        clientX: bounds.left + 20,
        clientY: bounds.top + 20,
      }),
    );
  }, "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9WlS8AAAAASUVORK5CYII=");
  await expect(editor.locator("img")).toHaveCount(2);
  await expect(page.getByText("Saved", { exact: true })).toBeVisible({
    timeout: 12_000,
  });

  await page.reload();
  await expect(page.locator(".ProseMirror strong")).toHaveText("vivid.");
  await expect(page.locator(".ProseMirror img")).toHaveCount(2);
  await page.getByRole("button", { name: ".unixrc", exact: true }).click();
  await expect(page.locator(".ProseMirror h2").first()).toHaveText("Rules");
  await page
    .getByRole("button", { name: "Untitled Page", exact: true })
    .click();

  await page.getByRole("button", { name: "Share", exact: true }).click();
  await page.getByRole("button", { name: "Enable read-only link" }).click();
  await expect(
    page.getByRole("button", { name: "Disable link" }),
  ).toBeVisible();
  const publicUrl = workspaceUrl.replace("/workspace/", "/view/");
  const anonymous = await browser.newContext();
  const publicPage = await anonymous.newPage();
  await publicPage.goto(publicUrl);
  await expect(
    publicPage.getByRole("heading", { name: "Formatting Trust" }),
  ).toBeVisible();
  await expect(
    publicPage.getByText("Same opening. Same opening. Cafe remains vivid."),
  ).toBeVisible();
  await expect(publicPage.locator("strong")).toHaveText("vivid.");
  await expect(publicPage.locator("img")).toHaveCount(2);
  await anonymous.close();
});

test("wiki, invitations, and alternate drafts are functional", async ({
  page,
  browser,
}) => {
  const stamp = Date.now();
  const ownerEmail = `owner-${stamp}@example.test`;
  const memberEmail = `member-${stamp}@example.test`;
  await page.goto("/sign-up");
  await page.getByLabel("Full Name").fill("Workspace Owner");
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Password").fill("ReliableWriting123!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByRole("button", { name: "Blank" }).click();
  await page.getByPlaceholder("Document Name").fill("Collaboration Room");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page).toHaveURL(/\/workspace\/[a-f0-9-]+$/, { timeout: 30_000 });

  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page.getByRole("menuitem", { name: "World wiki" }).click();
  await page.getByRole("button", { name: "New wiki entry" }).click();
  await page.getByPlaceholder("Name").fill("Mara Venn");
  await page
    .getByPlaceholder("Short summary")
    .fill("A reluctant guardian of the northern gate.");
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page.getByText("Mara Venn")).toBeVisible();
  await page
    .getByRole("dialog", { name: "Workspace tools" })
    .getByRole("button", { name: "Close" })
    .click();

  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page.getByRole("menuitem", { name: "Draft history" }).click();
  await page.getByPlaceholder("A quieter ending").fill("Storm ending");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Storm ending")).toBeVisible();
  await page.getByTitle("Open this draft").click();
  await expect(page.getByText("Open draft")).toBeVisible();
  await page.getByTitle("Use this draft as the manuscript").click();
  await page
    .getByRole("dialog", { name: "Workspace tools" })
    .getByRole("button", { name: "Close" })
    .click();

  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page.getByRole("menuitem", { name: "Team" }).click();
  await page.getByPlaceholder("writer@example.com").fill(memberEmail);
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  const inviteUrl = await page
    .getByRole("textbox", { name: "Invitation link" })
    .inputValue();
  expect(inviteUrl).toContain("/invite/");
  await page
    .getByRole("dialog", { name: "Workspace tools" })
    .getByRole("button", { name: "Close" })
    .click();

  const member = await browser.newContext();
  const memberPage = await member.newPage();
  await memberPage.goto("/sign-up");
  await memberPage.getByLabel("Full Name").fill("Invited Writer");
  await memberPage.getByLabel("Email").fill(memberEmail);
  await memberPage.getByLabel("Password").fill("ReliableWriting123!");
  await memberPage.getByRole("button", { name: "Sign up" }).click();
  await expect(memberPage).toHaveURL(/\/create$/, { timeout: 30_000 });
  await memberPage.goto(inviteUrl);
  await memberPage.getByRole("button", { name: "Accept invitation" }).click();
  await expect(memberPage).toHaveURL(/\/workspace\/[a-f0-9-]+$/);
  const memberEditor = memberPage.locator(".ProseMirror");
  await memberEditor.click();
  await memberPage.keyboard.type("Shared cursor");
  await memberPage.keyboard.down("Shift");
  await memberPage.keyboard.press("ArrowLeft");
  await memberPage.keyboard.up("Shift");
  await expect(page.locator(".unix-remote-cursor")).toBeVisible({
    timeout: 15_000,
  });
  await member.close();
});
