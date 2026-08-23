import { expect, test } from "@playwright/test";

test("home, contact, and support are the static Placis website", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Built for/ })).toBeVisible();
  const tryNow = page.getByRole("link", { name: "Try now" }).first();
  await expect(tryNow).toHaveAttribute("href", /\/onboarding\/find$/);
  await expect(page.getByRole("link", { name: "Login" }).first()).toHaveAttribute(
    "href",
    /\/sign-in$/,
  );
  await expect(
    page.getByRole("textbox", { name: "Describe what you want Placis to build" }),
  ).toHaveCSS("text-align", "left");

  await page.goto("/contact/");
  await expect(
    page.getByRole("heading", { name: "Talk to the Placis team." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();

  await page.goto("/support/");
  await expect(
    page.getByRole("link", { name: /Email help@placis.com/ }),
  ).toHaveAttribute("href", "mailto:help@placis.com");
});

test("prompt submit goes to onboarding with the typed prompt", async ({
  page,
}) => {
  await page.route("https://app.placis.com/**", async (route) => {
    await route.fulfill({
      body: "<html>ok</html>",
      contentType: "text/html",
      status: 200,
    });
  });
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Describe what you want Placis to build" })
    .fill("Roofing site");
  await page.getByRole("button", { name: "Start building" }).click();
  await expect(page).toHaveURL(/https:\/\/app\.placis\.com\/onboarding\/find\?prompt=/);
  expect(page.url()).toContain(encodeURIComponent("Roofing site"));
});

test("unknown path uses the static not-found document", async ({ page }) => {
  const response = await page.goto("/no-such-path/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Not found" })).toBeVisible();
});
