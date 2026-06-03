import { test, expect } from '@playwright/test';
import { RankingEntry } from '../lib/types';

// Each leaderboard test needs more time: 15 questions × ~1.3 s + UI overhead
test.setTimeout(90_000);

const MOCK_RANKINGS: RankingEntry[] = [
  {
    id: 'a1', name: 'Alice', avatar: '🦊', score: 15, totalQuestions: 15,
    percentage: 100, streak: 5, date: new Date('2026-01-10').toISOString(), duration: 120,
  },
  {
    id: 'b2', name: 'Bob', avatar: '🐼', score: 12, totalQuestions: 15,
    percentage: 80, streak: 3, date: new Date('2026-01-09').toISOString(), duration: 150,
  },
  {
    id: 'c3', name: 'Carol', avatar: '🐸', score: 10, totalQuestions: 15,
    percentage: 67, streak: 2, date: new Date('2026-01-08').toISOString(), duration: 180,
  },
];

test.describe('Ranking Global', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((rankings) => {
      localStorage.setItem('brainwave_rankings', JSON.stringify(rankings));
    }, MOCK_RANKINGS);
  });

  test('muestra el ranking con jugadores', async ({ page }) => {
    await navigateToLeaderboard(page);

    await expect(page.getByText('Ranking Global')).toBeVisible();
    await expect(page.getByText('Alice').first()).toBeVisible();
    await expect(page.getByText('Bob').first()).toBeVisible();
    await expect(page.getByText('Carol').first()).toBeVisible();
  });

  test('el podio muestra top 3', async ({ page }) => {
    await navigateToLeaderboard(page);

    const podium = page.getByRole('region', { name: 'Podio top 3' });
    await expect(podium).toBeVisible();
    await expect(podium.getByText('Alice')).toBeVisible();
    await expect(podium.getByText('Bob')).toBeVisible();
    await expect(podium.getByText('Carol')).toBeVisible();
  });

  test('clic en un jugador abre modal de detalles', async ({ page }) => {
    await navigateToLeaderboard(page);

    await page.getByRole('button', { name: /Ver detalles de Alice/ }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Use the visible name paragraph (not the sr-only heading)
    await expect(dialog.locator('p.text-lg.font-bold')).toContainText('Alice');
    await expect(dialog.getByText('15 pts')).toBeVisible();
    await expect(dialog.getByText('100%').first()).toBeVisible();
  });

  test('el modal se cierra al hacer clic en Cerrar', async ({ page }) => {
    await navigateToLeaderboard(page);

    await page.getByRole('button', { name: /Ver detalles de Alice/ }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('dialog').getByRole('button', { name: 'Cerrar' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('el modal se cierra con Escape', async ({ page }) => {
    await navigateToLeaderboard(page);

    await page.getByRole('button', { name: /Ver detalles de Bob/ }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('clic en un jugador del podio abre modal', async ({ page }) => {
    await navigateToLeaderboard(page);

    const podium = page.getByRole('region', { name: 'Podio top 3' });
    await podium.getByRole('button', { name: /Ver detalles de Alice/ }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').locator('p.text-lg.font-bold')).toContainText('Alice');
  });

  test('se puede borrar el ranking', async ({ page }) => {
    await navigateToLeaderboard(page);

    await page.getByRole('button', { name: 'Borrar ranking' }).click();
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();

    await confirmDialog.getByRole('button', { name: 'Borrar todo' }).click();
    await expect(page.getByText('Aún no hay resultados')).toBeVisible();
  });
});

async function navigateToLeaderboard(page: import('@playwright/test').Page) {
  // Re-seed rankings after navigation (beforeEach runs on original page.goto)
  await page.evaluate((rankings) => {
    localStorage.setItem('brainwave_rankings', JSON.stringify(rankings));
  }, MOCK_RANKINGS);

  // Start a game
  await page.getByPlaceholder('¿Cómo te llamas?').fill('TestUser');
  await page.getByRole('button', { name: 'Empezar el Quiz' }).click();

  // Answer all 15 questions — wait for each .answer-option, click, wait for next
  for (let i = 0; i < 15; i++) {
    const option = page.locator('.answer-option').first();
    try {
      await option.waitFor({ state: 'visible', timeout: 18_000 });
      await option.click();
      // 1100 ms transition + small buffer
      await page.waitForTimeout(1300);
    } catch {
      // Question may have been auto-timed-out or we're already on results
      break;
    }
  }

  // Wait for results screen (button "Ver ranking completo" appears)
  await page.waitForSelector('button:has-text("Ver ranking completo")', { timeout: 30_000 });
  await page.getByRole('button', { name: 'Ver ranking completo' }).click();

  await expect(page.getByText('Ranking Global')).toBeVisible({ timeout: 5_000 });
}
