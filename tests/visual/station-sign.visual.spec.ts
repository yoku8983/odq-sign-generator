import { test, expect } from '@playwright/test';

test.describe('駅名標 Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas.sign-canvas');
    await page.waitForTimeout(500);
  });

  test('新宿パターン', async ({ page }) => {
    const select = page.locator('[data-testid="pattern-select"]');
    await select.selectOption({ index: 1 });
    await page.locator('[data-testid="pattern-fill-button"]').click();
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas.sign-canvas');
    await expect(canvas).toHaveScreenshot('shinjuku.png');
  });

  test('長い駅名（祖師ヶ谷大蔵）', async ({ page }) => {
    await page.locator('[data-testid="station-name-kanji"]').fill('祖師ヶ谷大蔵');
    await page.locator('[data-testid="station-name-hiragana"]').fill('そしがやおおくら');
    await page.locator('[data-testid="station-name-romaji"]').fill('Soshigaya-Okura');
    await page.locator('[data-testid="current-numbering-symbol"]').fill('OH');
    await page.locator('[data-testid="current-numbering-number"]').fill('13');
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas.sign-canvas');
    await expect(canvas).toHaveScreenshot('soshigaya-okura.png');
  });

  test('ナンバリング非表示', async ({ page }) => {
    const select = page.locator('[data-testid="pattern-select"]');
    await select.selectOption({ index: 1 });
    await page.locator('[data-testid="pattern-fill-button"]').click();
    await page.locator('[data-testid="hide-current-numbering"]').check();
    await page.locator('[data-testid="hide-next-numbering"]').check();
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas.sign-canvas');
    await expect(canvas).toHaveScreenshot('no-numbering.png');
  });

  test('空フォーム（背景のみ）', async ({ page }) => {
    const canvas = page.locator('canvas.sign-canvas');
    await expect(canvas).toHaveScreenshot('empty.png');
  });
});
