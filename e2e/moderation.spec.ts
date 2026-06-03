import { test, expect } from '@playwright/test';

// Next.js injects a route announcer <div role="alert"> — target only our <p role="alert">
const errorAlert = (page: import('@playwright/test').Page) =>
  page.locator('p[role="alert"]');

const BANNED_NAMES = ['pito', 'Polla', 'CACA', 'tetas', 'mierda', 'puto amo', 'follar'];

test.describe('Moderación de nombres', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  for (const name of BANNED_NAMES) {
    test(`rechaza el nombre prohibido: "${name}"`, async ({ page }) => {
      await page.getByPlaceholder('¿Cómo te llamas?').fill(name);
      await page.getByRole('button', { name: 'Empezar el Quiz' }).click();
      await expect(errorAlert(page)).toContainText('no está permitido');
    });
  }

  test('acepta un nombre normal después de uno prohibido', async ({ page }) => {
    const input = page.getByPlaceholder('¿Cómo te llamas?');

    await input.fill('polla');
    await page.getByRole('button', { name: 'Empezar el Quiz' }).click();
    await expect(errorAlert(page)).toContainText('no está permitido');

    // Clear and type a valid name — the error should disappear on input change
    await input.fill('JugadorNormal');
    await page.getByRole('button', { name: 'Empezar el Quiz' }).click();
    await expect(errorAlert(page)).not.toBeVisible();
  });

  test('acepta nombres legítimos sin error', async ({ page }) => {
    const validNames = ['Carlos', 'María123', 'ProGamer'];
    for (const name of validNames) {
      await page.goto('/');
      await page.getByPlaceholder('¿Cómo te llamas?').fill(name);
      await page.getByRole('button', { name: 'Empezar el Quiz' }).click();
      await expect(errorAlert(page)).not.toBeVisible();
    }
  });
});
