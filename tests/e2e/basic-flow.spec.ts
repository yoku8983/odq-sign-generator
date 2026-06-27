import { test, expect } from '@playwright/test';

test.describe('基本フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ページが正しく読み込まれる', async ({ page }) => {
    await expect(page.locator('h1.site-title')).toHaveText('小田急駅名標ジェネレーター');
    await expect(page.locator('canvas.sign-canvas')).toBeVisible();
    await expect(page.locator('[data-testid="pattern-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="save-button"]')).toBeVisible();
  });

  test('全コンポーネントが表示される', async ({ page }) => {
    await expect(page.locator('nav.share-links')).toBeVisible();
    await expect(page.locator('[data-testid="station-name-kanji"]')).toBeVisible();
    await expect(page.locator('[data-testid="station-name-hiragana"]')).toBeVisible();
    await expect(page.locator('[data-testid="station-name-romaji"]')).toBeVisible();
    await expect(page.locator('[data-testid="prev-station-kanji"]')).toBeVisible();
    await expect(page.locator('[data-testid="next-station-kanji"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-numbering-symbol"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-numbering-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="hide-current-numbering"]')).toBeVisible();
    await expect(page.locator('section.notes-section')).toBeVisible();
    await expect(page.locator('footer.footer')).toBeVisible();
  });

  test('パターン選択→入力補完でフォームが自動入力される', async ({ page }) => {
    const select = page.locator('[data-testid="pattern-select"]');
    await select.selectOption({ index: 1 });
    await page.locator('[data-testid="pattern-fill-button"]').click();

    await expect(page.locator('[data-testid="station-name-kanji"]')).toHaveValue('新宿');
    await expect(page.locator('[data-testid="station-name-hiragana"]')).toHaveValue('しんじゅく');
    await expect(page.locator('[data-testid="station-name-romaji"]')).toHaveValue('Shinjuku');
    await expect(page.locator('[data-testid="next-station-kanji"]')).toHaveValue('南新宿');
    await expect(page.locator('[data-testid="current-numbering-symbol"]')).toHaveValue('OH');
    await expect(page.locator('[data-testid="current-numbering-number"]')).toHaveValue('01');
  });

  test('画像保存ボタンでダウンロードが発生する', async ({ page }) => {
    const select = page.locator('[data-testid="pattern-select"]');
    await select.selectOption({ index: 1 });
    await page.locator('[data-testid="pattern-fill-button"]').click();
    await page.waitForTimeout(500);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="save-button"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('station-sign.png');
  });
});
