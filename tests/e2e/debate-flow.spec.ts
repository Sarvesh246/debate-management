import { expect, test } from "@playwright/test";

test("creates a debate and opens core views in deterministic mode", async ({ page }) => {
  await page.goto("/debates/new");
  await expect(page.getByRole("heading", { name: /configure the round/i })).toBeVisible();

  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/debates") &&
      response.request().method() === "POST" &&
      response.status() === 200,
    { timeout: 20_000 },
  );
  await page.getByRole("button", { name: /build workspace/i }).click();
  await createResponsePromise;

  await expect(page).toHaveURL(/\/debates\/.+\/overview/, { timeout: 20_000 });
  await expect(page.getByText("Deterministic mode is active.", { exact: true })).toBeVisible({
    timeout: 20_000,
  });

  await page.getByRole("link", { name: /rebuttals/i }).click();
  await expect(page.getByRole("heading", { name: /rebuttal bank/i })).toBeVisible();

  await page.getByRole("link", { name: /live/i }).click();
  await expect(page.getByRole("heading", { name: /live mode/i })).toBeVisible();

  await page.getByRole("link", { name: /export/i }).click();
  await expect(page.getByRole("heading", { name: /export and print/i })).toBeVisible();
  await page.getByRole("link", { name: /full debate packet/i }).click();

  await expect(page).toHaveURL(/\/print\?kind=packet/);
  await expect(page.getByRole("heading", { name: /speeches/i })).toBeVisible();
});
