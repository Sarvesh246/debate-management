import { expect, test, type Page } from "@playwright/test";

async function createDebate(page: Page) {
  await page.goto("/debates/new");
  await expect(page.getByRole("heading", { name: /start fast/i })).toBeVisible();
  await expect(page.getByLabel(/whitelist domains/i)).toHaveCount(0);

  await page.getByRole("button", { name: /advanced settings/i }).click();
  await expect(page.getByLabel(/whitelist domains/i)).toBeVisible();
  await page.getByRole("button", { name: /advanced settings/i }).click();

  await page.getByRole("button", { name: /build workspace/i }).click();
  await expect(page).toHaveURL(/\/debates\/[^/]+\?intro=1/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /getting your workspace ready/i })).toBeVisible();

  const debateId = page.url().match(/\/debates\/([^/?]+)/)?.[1];
  if (!debateId) {
    throw new Error("Could not determine debate id from build flow URL.");
  }

  return debateId;
}

test("shows the local workspace account menu in fallback mode", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /open workspace menu/i }).click();
  await expect(page.getByRole("menuitem", { name: /view profile/i })).toBeVisible();
  await page.getByRole("menuitem", { name: /view profile/i }).click();
  await expect(page).toHaveURL("/profile");
  await expect(page.getByRole("heading", { name: /account and workspace identity/i })).toBeVisible();
});

test("creates a debate and moves through the simplified workspace flow", async ({ page }) => {
  const debateId = await createDebate(page);

  await expect(page.getByText(/round brief and criteria/i)).toBeVisible();
  await page.getByRole("link", { name: /open workspace/i }).click();

  await expect(page).toHaveURL(/\/understand/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /see the round clearly/i })).toBeVisible();

  await page.getByRole("button", { name: /^sources$/i }).click();
  await expect(page).toHaveURL(/tool=sources/, { timeout: 10_000 });

  await page.goto(`/debates/${debateId}/build?module=opponent`);
  await expect(page.getByRole("heading", { name: /shape the case you will actually use/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /opponent and rebuttals/i })).toBeVisible();

  await page.goto(`/debates/${debateId}/build?module=speeches`);
  const speechDraft = page.locator("textarea").nth(1);
  await speechDraft.fill("Opening version tuned for the live round.");
  await expect(speechDraft).toHaveValue(/Opening version tuned/i);

  await page.goto(`/debates/${debateId}/live`);
  await expect(page.getByRole("heading", { name: /run the round from one clean live sheet/i })).toBeVisible();
  await page.getByRole("button", { name: /open export/i }).click();
  await expect(page).toHaveURL(/tool=export/, { timeout: 10_000 });
  await page.goto(`/debates/${debateId}/print?kind=packet`);
  await expect(page).toHaveURL(/\/print\?kind=packet/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { name: /speeches/i })).toBeVisible();
});

test("practice pillar is reachable from the workspace", async ({ page }) => {
  const debateId = await createDebate(page);
  await page.goto(`/debates/${debateId}/practice`);

  await expect(page.getByRole("heading", { name: /pressure-test the working case/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /round simulator/i })).toBeVisible();

  await page.getByLabel(/your response/i).fill("My case wins because reliability and deployment speed matter first.");
  await page.getByRole("button", { name: /save and continue/i }).click();
  await expect(page.getByLabel(/your response/i)).toHaveValue("");
});
