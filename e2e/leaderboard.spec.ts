import { test, expect } from '@playwright/test';
import { RankingEntry } from '../lib/types';

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
    // Seed localStorage with mock rankings
    await page.evaluate((rankings) => {
      localStorage.setItem('brainwave_rankings', JSON.stringify(rankings));
    }, MOCK_RANKINGS);

    // Navigate to leaderboard: click the trophy/ranking button in start screen
    // Since leaderboard is accessed from results screen or directly,
    // we trigger it via the start screen context hint
    await page.goto('/');
    await page.evaluate((rankings) => {
      localStorage.setItem('brainwave_rankings', JSON.stringify(rankings));
    }, MOCK_RANKINGS);
  });

  test('muestra el ranking con jugadores', async ({ page }) => {
    await navigateToLeaderboard(page);

    await expect(page.getByText('Ranking Global')).toBeVisible();
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();
    await expect(page.getByText('Carol')).toBeVisible();
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

    // Click on the first row (Alice)
    await page.getByRole('button', { name: /Ver detalles de Alice/ }).first().click();

    // Modal should open with player details
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Alice')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('15 pts')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('100%')).toBeVisible();
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
    await expect(page.getByRole('dialog').getByText('Alice')).toBeVisible();
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
  // Go through quiz to results then leaderboard
  // Alternative: inject the screen state. We use direct navigation by simulating
  // game completion via localStorage state + UI interaction.

  // The simplest path: play a quick game using the name field
  await page.getByPlaceholder('¿Cómo te llamas?').fill('TestUser');
  await page.getByRole('button', { name: 'Empezar el Quiz' }).click();

  // Wait for quiz screen to load, then auto-answer all questions
  await page.waitForTimeout(500);

  // Answer 15 questions by clicking first answer option each time
  for (let i = 0; i < 15; i++) {
    const option = page.locator('.answer-option').first();
    const visible = await option.isVisible().catch(() => false);
    if (visible) {
      await option.click();
      await page.waitForTimeout(1800);
    } else {
      break;
    }
  }

  // Wait for results screen ("Ver ranking completo" button appears)
  await page.waitForSelector('button:has-text("Ver ranking")', { timeout: 20_000 });

  // Click "Ver ranking completo" to go to leaderboard
  await page.getByRole('button', { name: /Ver ranking/i }).click();

  await expect(page.getByText('Ranking Global')).toBeVisible({ timeout: 5_000 });
}
