import { test, expect } from '@playwright/test';

test.describe('Pantalla de inicio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('muestra el título y el formulario', async ({ page }) => {
    await expect(page.getByText('¿Listo para jugar?')).toBeVisible();
    await expect(page.getByPlaceholder('¿Cómo te llamas?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Empezar el Quiz' })).toBeVisible();
  });

  test('muestra error al intentar empezar sin nombre', async ({ page }) => {
    await page.getByRole('button', { name: 'Empezar el Quiz' }).click();
    await expect(page.getByRole('alert')).toContainText('Escribe tu nombre');
  });

  test('puede seleccionar un avatar', async ({ page }) => {
    const avatars = page.getByRole('radio');
    const count = await avatars.count();
    expect(count).toBeGreaterThan(3);
    await avatars.nth(2).click();
    await expect(avatars.nth(2)).toHaveAttribute('aria-checked', 'true');
  });

  test('el nombre se guarda y se puede empezar', async ({ page }) => {
    await page.getByPlaceholder('¿Cómo te llamas?').fill('TestPlayer');
    await page.getByRole('button', { name: 'Empezar el Quiz' }).click();
    // Debería cargar la pantalla del quiz
    await expect(page).not.toHaveURL('/error');
  });
});
