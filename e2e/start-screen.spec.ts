import { test, expect } from '@playwright/test';

const nameInput  = (page: import('@playwright/test').Page) => page.getByTestId('name-input');
const startBtn   = (page: import('@playwright/test').Page) => page.getByTestId('start-btn');
const errorAlert = (page: import('@playwright/test').Page) => page.locator('p[role="alert"]');

test.describe('Pantalla de inicio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('muestra el título y el formulario', async ({ page }) => {
    await expect(page.getByText('¿Listo para jugar?')).toBeVisible();
    await expect(nameInput(page)).toBeVisible();
    await expect(startBtn(page)).toBeVisible();
  });

  test('muestra error al intentar empezar sin nombre', async ({ page }) => {
    await startBtn(page).click();
    await expect(errorAlert(page)).toContainText('Escribe tu nombre');
  });

  test('puede seleccionar un avatar', async ({ page }) => {
    const avatars = page.getByRole('radio');
    const count = await avatars.count();
    expect(count).toBeGreaterThan(3);
    await avatars.nth(2).click();
    await expect(avatars.nth(2)).toHaveAttribute('aria-checked', 'true');
  });

  test('el nombre se guarda y se puede empezar', async ({ page }) => {
    await nameInput(page).fill('TestPlayer');
    await startBtn(page).click();
    await expect(errorAlert(page)).not.toBeVisible();
  });
});
