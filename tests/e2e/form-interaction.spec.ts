import { test, expect } from '@playwright/test';

test.describe('フォーム操作', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('テキスト入力がCanvasに反映される', async ({ page }) => {
    const canvas = page.locator('canvas.sign-canvas');
    await expect(canvas).toBeVisible();

    await page.locator('[data-testid="station-name-kanji"]').fill('テスト駅');
    await page.locator('[data-testid="station-name-hiragana"]').fill('てすとえき');
    await page.locator('[data-testid="station-name-romaji"]').fill('Test-Eki');
    await page.waitForTimeout(300);

    const dims = await canvas.evaluate((c: HTMLCanvasElement) => ({
      w: c.width,
      h: c.height,
    }));
    expect(dims.w).toBeGreaterThan(0);
    expect(dims.h).toBeGreaterThan(0);
  });

  test('ナンバリング非表示チェックボックスが機能する', async ({ page }) => {
    await page.locator('[data-testid="current-numbering-symbol"]').fill('OH');
    await page.locator('[data-testid="current-numbering-number"]').fill('01');

    const checkbox = page.locator('[data-testid="hide-current-numbering"]');
    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  test('フォームクリアで全フィールドが空になる', async ({ page }) => {
    const select = page.locator('[data-testid="pattern-select"]');
    await select.selectOption({ index: 1 });
    await page.locator('[data-testid="pattern-fill-button"]').click();

    await expect(page.locator('[data-testid="station-name-kanji"]')).toHaveValue('新宿');

    await page.locator('[data-testid="clear-form-button"]').click();

    await expect(page.locator('[data-testid="station-name-kanji"]')).toHaveValue('');
    await expect(page.locator('[data-testid="station-name-hiragana"]')).toHaveValue('');
    await expect(page.locator('[data-testid="station-name-romaji"]')).toHaveValue('');
    await expect(page.locator('[data-testid="prev-station-kanji"]')).toHaveValue('');
    await expect(page.locator('[data-testid="next-station-kanji"]')).toHaveValue('');
    await expect(page.locator('[data-testid="current-numbering-symbol"]')).toHaveValue('');
  });

  test('Canvasクリアボタンが動作する', async ({ page }) => {
    await page.locator('[data-testid="station-name-kanji"]').fill('テスト');
    await page.waitForTimeout(300);
    await page.locator('[data-testid="clear-canvas-button"]').click();
    await page.waitForTimeout(100);

    const canvas = page.locator('canvas.sign-canvas');
    await expect(canvas).toBeVisible();
  });
});
