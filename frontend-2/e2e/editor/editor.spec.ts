import { expect, test } from "@playwright/test";

import { stubEditorApi } from "./editorMock";

const PORT_BASE_URL =
  process.env.PLACIS_FRONTEND2_E2E_URL ?? "http://127.0.0.1:5174";

async function openEditor(page: import("@playwright/test").Page) {
  await stubEditorApi(page);
  // The editor is an internal view of the /cms shell: land on the dashboard,
  // then open the Sites view.
  await page.goto(`${PORT_BASE_URL}/cms`);
  await page.getByRole("button", { name: "Sites" }).first().waitFor({ timeout: 20_000 });
  await page.getByRole("button", { name: "Sites" }).first().click();
  await page.getByText("Website editor").first().waitFor({ timeout: 20_000 });
  // Select the first section on the canvas so the inspector shows its content.
  // The canvas re-renders as the public components load, so re-select until
  // the inspector shows the section counter stably.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page
      .getByRole("button", { name: "Select section 1" })
      .first()
      .click({ timeout: 20_000 });
    try {
      await page.getByText("Section 1 of 1").waitFor({ timeout: 5_000 });
      break;
    } catch {
      // re-render in progress; try again
    }
  }
  await page.getByText("Section 1 of 1").waitFor({ timeout: 20_000 });
}

test("editor shell loads the sidebar, canvas and inspector", async ({ page }) => {
  await openEditor(page);

  await expect(page.getByRole("button", { name: "Pages" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Media" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Styles" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Menu" }).first()).toBeVisible();
  await expect(page.getByRole("tab", { name: "Content" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Design" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "SEO" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Forms" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "History" })).toBeVisible();
});

test("adds, reorders, and removes page sections from the inspector", async ({
  page,
}) => {
  await openEditor(page);
  await page.waitForTimeout(1000);

  // Single section: the up/down controls are disabled.
  await expect(page.getByLabel("Move section up")).toBeDisabled({ timeout: 20_000 });
  await expect(page.getByLabel("Move section down")).toBeDisabled();

  await page.getByLabel("Component to add").selectOption("public.hero.split");
  await page.getByRole("button", { name: "Add below" }).click();

  // The port keeps the current section selected, so the added section sits
  // below and the down control becomes enabled.
  await expect(page.getByLabel("Move section down")).toBeEnabled({ timeout: 20_000 });
  await expect(page.getByLabel("Move section up")).toBeDisabled();

  await page.getByLabel("Move section down").click();
  await expect(page.getByLabel("Move section up")).toBeEnabled({ timeout: 20_000 });
  await expect(page.getByLabel("Move section down")).toBeDisabled();

  await page.getByLabel("Remove section").click();
  await expect(page.getByLabel("Move section up")).toBeDisabled({ timeout: 20_000 });
  await expect(page.getByLabel("Move section down")).toBeDisabled();
});

test("edits a slot in the content tab and saves the draft", async ({ page }) => {
  await openEditor(page);

  // The services section is selected by default; edit its Title slot.
  await page.getByLabel("Title").fill("Renovations & Extensions");
  await expect(page.getByLabel("Title")).toHaveValue("Renovations & Extensions");

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();
});

test("uploads an image from the media workspace", async ({ page }) => {
  await openEditor(page);

  await page.getByRole("button", { name: "Media" }).click();
  await expect(page.getByRole("button", { name: "Add image" })).toBeVisible();

  await page
    .getByPlaceholder("Describe the image before upload")
    .fill("Uploaded slate roof closeup");

  await page.locator("input[type=file]").setInputFiles({
    buffer: Buffer.from([1, 2, 3]),
    mimeType: "image/jpeg",
    name: "roof-upload.jpg",
  });

  await expect(
    page.getByRole("button", { name: "Uploaded slate roof closeup" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/image · upload/)).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Review" })).toHaveValue(
    "pending_review",
  );
});

test("runs an assistant plan from the header", async ({ page }) => {
  await openEditor(page);

  await page.getByRole("button", { name: "Open AI assistant" }).click();
  await page
    .getByPlaceholder("e.g. Make the homepage focus on emergency callouts")
    .fill("Make the homepage focus on emergency callouts");
  await page.getByRole("button", { name: "Plan" }).click();

  await expect(page.getByText("Here is a plan to focus the homepage")).toBeVisible(
    { timeout: 20_000 },
  );
  await expect(page.getByText("## Plan")).toBeVisible();
});
