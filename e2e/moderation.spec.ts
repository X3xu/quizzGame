import { test, expect } from '@playwright/test';

const nameInput  = (page: import('@playwright/test').Page) => page.getByTestId('name-input');
const startBtn   = (page: import('@playwright/test').Page) => page.getByTestId('start-btn');
const errorAlert = (page: import('@playwright/test').Page) => page.locator('p[role="alert"]');

const BANNED_NAMES = ['pito', 'Polla', 'CACA', 'tetas', 'mierda', 'puto amo', 'follar'];

test.describe('Moderación de nombres', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  for (const name of BANNED_NAMES) {
    test(`rechaza el nombre prohibido: "${name}"`, async ({ page }) => {
      await nameInput(page).fill(name);
      await startBtn(page).click();
      await expect(errorAlert(page)).toContainText('no está permitido');
    });
  }

  test('acepta un nombre normal después de uno prohibido', async ({ page }) => {
    await nameInput(page).fill('polla');
    await startBtn(page).click();
    await expect(errorAlert(page)).toContainText('no está permitido');

    await nameInput(page).fill('JugadorNormal');
    await startBtn(page).click();
    await expect(errorAlert(page)).not.toBeVisible();
  });

  test('acepta nombres legítimos sin error', async ({ page }) => {
    const validNames = ['Carlos', 'María123', 'ProGamer'];
    for (const name of validNames) {
      await page.goto('/');
      await nameInput(page).fill(name);
      await startBtn(page).click();
      await expect(errorAlert(page)).not.toBeVisible();
    }
  });
});
