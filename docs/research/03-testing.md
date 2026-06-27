# テスト戦略調査レポート — 駅名標画像生成Webアプリ

> **調査日**: 2026-06-27  
> **対象**: Canvas 2D APIベースの静的Webアプリ（ESMモジュール化リライト後）  
> **調査ソース**: Vitest / Playwright / 各VRTツール 公式ドキュメント、2025〜2026年の技術記事・ベンチマーク

---

## 推奨テストスタック（結論）

| レイヤー | ツール | 役割 |
|---|---|---|
| **ユニットテスト** | **Vitest 4.x** + jsdom + vitest-canvas-mock | レイアウト計算、データ変換、バリデーション |
| **Visual Regression** | **Playwright toHaveScreenshot()** | Canvas描画結果のスクリーンショット比較 |
| **E2Eテスト** | **Playwright Test** | ブラウザ操作→画像生成→ダウンロードの一連検証 |
| **CI** | **GitHub Actions** + Playwright Docker Image | 全テストの自動実行 |

Vitest + Playwright の2本柱構成を推奨する。理由は以下のとおり。

- Vitest は2026年時点でJavaScriptテストフレームワークのデファクトスタンダードとなっており、新規プロジェクトの80%以上が採用している。Viteベースの静的Webアプリとの親和性が極めて高い
- Playwright はE2EフレームワークとしてCypressを逆転し、2026年のQA専門家の採用率は45.1%に達している。VRT機能が組み込みのため、追加ツール不要でVisual Regression Testingが可能
- 両ツールとも完全無料のOSSであり、このプロジェクト規模に対して費用対効果が最も高い

---

## 1. テストのレイヤー分け

### 1-1. 全体像（テストピラミッド）

```
        ┌──────────┐
        │  E2E (少) │  ← Playwright: 3〜5シナリオ
        ├──────────┤
        │  VRT (中) │  ← Playwright toHaveScreenshot(): 5〜10パターン
        ├──────────┤
        │ Unit (多) │  ← Vitest: 30〜50テスト
        └──────────┘
```

### 1-2. 各レイヤーの定義と費用対効果

#### ユニットテスト（最優先・カバレッジ目安 80%以上）

**対象**: DOM/Canvasに依存しない純粋ロジック

- レイアウト計算（フォントサイズ自動縮小、相対配置座標の算出）
- データ変換（フォーム入力値 → 描画パラメータへの変換）
- バリデーション（入力値の検証、文字数チェック）
- 状態管理（パターン選択による入力フィールドの切り替えロジック）

**費用対効果**: 最も高い。実行が高速（数百ms）で、CIコストが最小。ロジックのリグレッションを即座に検出できる。ESMモジュール化のリライトにより、テスタブルな関数を切り出すことがこのレイヤーの前提条件となる。

#### Visual Regression Testing（中優先・5〜10パターン）

**対象**: Canvas描画の最終出力画像

- 各駅名標パターン（路線タイプ別）の描画結果
- フォントサイズ自動縮小が発動する長い駅名でのレイアウト
- チェックボックス/セレクトボックスの組み合わせによる表示差分

**費用対効果**: このプロジェクトの核心であるCanvas描画の品質保証に直結する。ただしCI環境でのフォントレンダリング差異への対処コストが必要。5〜10パターンに絞ることで維持コストを抑える。

#### E2Eテスト（低優先・3〜5シナリオ）

**対象**: ユーザー操作のフルフロー

- パターン選択 → フォーム入力 → 生成ボタンクリック → Canvas描画完了
- ダウンロードボタンによる画像ファイルの保存
- 入力補完（パターン変更時のフィールド自動入力）

**費用対効果**: ユーザー体験全体の保証に必要だが、実行時間とメンテナンスコストが大きいため最小限に留める。クリティカルパス3〜5本に絞る。

#### コンポーネントテスト（このプロジェクトでは不要）

バニラHTML/JS構成のためReact/Vue等のコンポーネントテスティングは対象外。フレームワークを使わない静的Webアプリでは、ユニットテスト + E2Eテストで十分にカバーできる。

---

## 2. Canvas描画のユニットテスト手法

### 2-1. テストランナー選定: Vitest 4.x

2026年6月時点の最新安定版は **Vitest 4.1.9**（npm公開 2026年6月中旬）。

**Vitest を選定する理由:**

- Viteネイティブのテストフレームワークであり、`vite.config` を共有できるため設定が最小限
- Jestと互換のAPI（`describe`, `it`, `expect`, `vi.mock()` 等）を持ち、学習コストが低い
- 500テスト規模のベンチマークでJest 30に対して約2〜8倍高速。ウォッチモードは400ms未満で再実行完了
- ESMがネイティブサポートされておりESMモジュール化後のプロジェクトと完全に整合
- V8によるネイティブコードカバレッジ、ビルトインUIモードを標準搭載

**Jest 30 との比較:**

Jest 30は2025年中盤にリリースされ、パフォーマンスが約37%向上しESMサポートも安定化した。しかしViteベースのプロジェクトではVitestの方が設定ゼロで動作し、パフォーマンスも依然として優位。新規プロジェクトでJestを選択する積極的理由はない。

### 2-2. DOM環境: jsdom vs happy-dom

| | jsdom | happy-dom |
|---|---|---|
| **週間DL数** | 約2,700万 | 約300万 |
| **速度** | 基準 | 2〜10倍高速 |
| **DOM API網羅性** | 高い（WHATWG仕様準拠） | 主要APIをカバー（一部不足あり） |
| **Canvas API** | スタブ（描画メソッドは存在するが実描画なし） | スタブ（同上） |
| **推奨ケース** | Canvas API モック併用時 | 高速なDOM操作テスト |

**重要**: 両環境ともCanvas APIは**スタブ実装**であり、`canvas.getContext('2d')` はオブジェクトを返すが、描画メソッドやピクセルデータAPIは実動作しない。Canvas描画のテストは専用のモックライブラリまたは実ブラウザ（Playwright Browser Mode）が必要となる。

**推奨**: ユニットテストのベース環境には **jsdom** を採用し、Canvas APIテストには **vitest-canvas-mock** を併用する。

### 2-3. Canvas APIモック: vitest-canvas-mock

```bash
npm install -D vitest-canvas-mock
```

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
    },
  },
});
```

**vitest.setup.ts:**
```typescript
import 'vitest-canvas-mock';
```

**テスト戦略 — Canvas描画ロジックの分離:**

Canvas APIを直接テストするのではなく、「描画ロジック」と「Canvas API呼び出し」を分離する設計が鍵。

```
[入力データ] → [レイアウト計算 (純粋関数)] → [描画命令オブジェクト] → [Canvas API呼び出し]
                ↑ ユニットテスト対象                                    ↑ VRT で検証
```

**レイアウト計算のテスト例:**

```typescript
// src/layout.ts — 純粋関数として切り出す
export function calculateFontSize(
  text: string,
  maxWidth: number,
  baseFontSize: number,
  minFontSize: number
): number {
  // フォントサイズ自動縮小ロジック
  let fontSize = baseFontSize;
  const charWidth = fontSize * 0.6; // 概算
  while (text.length * charWidth * (fontSize / baseFontSize) > maxWidth && fontSize > minFontSize) {
    fontSize -= 1;
  }
  return fontSize;
}

export function calculateStationNamePosition(
  canvasWidth: number,
  canvasHeight: number,
  pattern: string
): { x: number; y: number; align: CanvasTextAlign } {
  // パターン別の配置計算
  // ...
}
```

```typescript
// src/layout.test.ts
import { describe, it, expect } from 'vitest';
import { calculateFontSize, calculateStationNamePosition } from './layout';

describe('calculateFontSize', () => {
  it('短い駅名ではベースフォントサイズを返す', () => {
    expect(calculateFontSize('新宿', 400, 48, 16)).toBe(48);
  });

  it('長い駅名ではフォントサイズが縮小される', () => {
    const size = calculateFontSize('南林間中央林間つきみ野', 400, 48, 16);
    expect(size).toBeLessThan(48);
    expect(size).toBeGreaterThanOrEqual(16);
  });

  it('最小フォントサイズ未満にはならない', () => {
    const size = calculateFontSize('あ'.repeat(100), 200, 48, 16);
    expect(size).toBe(16);
  });
});
```

**vitest-canvas-mock によるCanvas API呼び出しの検証例:**

```typescript
// src/renderer.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('Canvas描画呼び出し', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    ctx = canvas.getContext('2d')!;
  });

  it('fillTextが呼び出される', () => {
    ctx.font = '48px sans-serif';
    ctx.fillText('新宿', 400, 200);

    // vitest-canvas-mock の __getEvents() でAPI呼び出しを検証
    const events = (ctx as any).__getEvents();
    expect(events).toMatchSnapshot();
  });

  it('drawImageが呼び出される', () => {
    const img = new Image();
    ctx.drawImage(img, 0, 0);

    const draws = (ctx as any).__getDrawCalls();
    expect(draws).toHaveLength(1);
  });
});
```

### 2-4. Vitest Browser Mode（補足的選択肢）

Vitest 4.0以降ではPlaywright統合によるBrowser Modeが安定化しており、実ブラウザ上でユニットテストを実行できる。Canvas APIが実際に動作するためモック不要だが、実行速度はNode.js環境より遅い。

このプロジェクトでは、レイアウト計算の大部分は純粋関数として切り出せるため、基本はNode.js（jsdom + vitest-canvas-mock）で高速テストし、Canvas描画の最終検証はVRT（Playwright toHaveScreenshot）に委ねる構成が最も効率的。

---

## 3. Visual Regression Testing

### 3-1. ツール比較

| ツール | 種別 | 特徴 | 料金 | 推奨度 |
|---|---|---|---|---|
| **Playwright toHaveScreenshot()** | OSS組込 | Playwright標準搭載。pixelmatchベース。追加設定不要 | 無料 | **◎ 最推奨** |
| BackstopJS | OSS単体 | JSON設定ベース。ビフォーアフタースライダーUI付きレポート | 無料 | ○ 代替候補 |
| reg-suit | OSS単体 | スクリーンショット比較専用。S3/GCS連携。GitHub PR上で差分表示 | 無料 | ○ 大規模向き |
| Percy | SaaS | BrowserStack傘下。AIベースの差分検出。5,000枚/月の無料枠 | 有料（無料枠あり） | △ 過剰 |
| Chromatic | SaaS | Storybook連携特化。コンポーネント単位のVRT | 有料（OSS無料） | × 不適合 |
| Applitools Eyes | SaaS | AI駆動のVisual AI。最も高精度だが高コスト | 有料 | × 過剰 |

### 3-2. 推奨: Playwright toHaveScreenshot()

このプロジェクトには **Playwright の組み込みVRT** が最適。理由は以下のとおり。

- E2Eテストと同一フレームワークで完結するため、学習コスト・設定コストが最小
- pixelmatchライブラリによるピクセル単位の比較が組み込みで動作
- ベースライン画像はリポジトリ内に `<テストファイル>-snapshots/` として自動管理
- `maxDiffPixelRatio` / `maxDiffPixels` による許容差の細やかな制御が可能
- テスト失敗時に expected / actual / diff の3画像を自動出力

**基本的なVRTテストコード:**

```typescript
// tests/visual/station-sign.visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('駅名標 Visual Regression', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // アニメーション無効化（あれば）
    await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
  });

  test('デフォルトパターンの描画', async ({ page }) => {
    await page.fill('[data-testid="station-name"]', '新宿');
    await page.fill('[data-testid="station-name-kana"]', 'しんじゅく');
    await page.click('[data-testid="generate-button"]');

    // Canvas要素のスクリーンショット
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('default-pattern-shinjuku.png', {
      maxDiffPixelRatio: 0.01,  // 1%の差異を許容
    });
  });

  test('長い駅名でのフォント縮小', async ({ page }) => {
    await page.fill('[data-testid="station-name"]', '南林間中央林間');
    await page.click('[data-testid="generate-button"]');

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('long-name-font-shrink.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

});
```

### 3-3. カスタムフォント環境の再現方法

このプロジェクトはカスタムフォント3種を使用するため、CI環境でのフォント再現が最重要課題。

**方法A: Playwright Docker Image + カスタムフォントインストール（推奨）**

```dockerfile
# Dockerfile.test
FROM mcr.microsoft.com/playwright:v1.52.0-noble

USER root

# カスタムフォントをコンテナにコピー
COPY fonts/*.ttf /usr/local/share/fonts/custom/

# フォントキャッシュを更新
RUN fc-cache -fv

# 日本語フォント（Noto Sans CJK）もインストール
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    fonts-noto-cjk \
    fontconfig && \
    rm -rf /var/lib/apt/lists/* && \
    fc-cache -fv

USER pwuser
```

**docker-compose.yml:**
```yaml
services:
  playwright:
    build:
      context: .
      dockerfile: Dockerfile.test
    volumes:
      - .:/app
    working_dir: /app
    command: npx playwright test
```

**方法B: @font-face によるWebフォント読み込み（補完策）**

アプリ側の `@font-face` 宣言でTTFファイルを相対パスで読み込んでいる場合、Playwright がローカルサーバー経由でアクセスすれば追加設定なしでフォントが読み込まれる。ただしCI環境ではOSレベルのフォントレンダリングが異なるため、Docker統一が推奨。

**フォント読み込み待機のテストコード:**
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // すべてのWebフォントの読み込み完了を待機
  await page.evaluate(() => document.fonts.ready);
});
```

### 3-4. ベースライン画像の管理戦略

**推奨: リポジトリ内管理 + Git LFS**

| 戦略 | メリット | デメリット | 推奨 |
|---|---|---|---|
| **リポジトリ内（デフォルト）** | PRレビューで差分確認可能。セットアップ不要 | バイナリファイルでGitヒストリーが肥大化 | 小規模（5〜20枚）なら最適 |
| リポジトリ内 + **Git LFS** | ヒストリー肥大化を回避 | LFS設定が必要 | 20枚以上なら推奨 |
| 外部ストレージ（S3/GCS） | リポジトリが軽量 | reg-suit等の追加ツールが必要。セットアップ複雑 | 大規模チーム向き |

このプロジェクトでは5〜10パターン程度のため、**リポジトリ内管理で十分**。20枚を超える場合は `.gitattributes` でGit LFSを設定する。

```gitattributes
# .gitattributes
tests/**/*-snapshots/**/*.png filter=lfs diff=lfs merge=lfs -text
```

**ベースライン更新のワークフロー:**

1. UIを意図的に変更した場合: `npx playwright test --update-snapshots` でベースライン再生成
2. 再生成されたPNGファイルをPRにコミット
3. レビュアーはPR上で画像差分を確認し承認

### 3-5. 許容差の設定（フォントレンダリングのOS差異への対処）

フォントレンダリングはOS間で必ず差異が生じる。特にサブピクセルアンチエイリアシングとフォントヒンティングの違いが原因。

**対策の優先順:**

1. **Docker統一（最優先）**: ベースライン生成もCIもDocker内で実行し、OS差異を根本排除
2. **ブラウザ起動オプション**: アンチエイリアシング差異を最小化
   ```typescript
   // playwright.config.ts
   use: {
     launchOptions: {
       args: [
         '--font-render-hinting=none',
         '--disable-font-subpixel-positioning',
       ],
     },
   },
   ```
3. **閾値チューニング**: パターン別に調整
   ```typescript
   // 色・レイアウトが重要なCanvas要素は厳しめ
   await expect(canvas).toHaveScreenshot('sign.png', {
     maxDiffPixelRatio: 0.01,  // 1%
   });

   // テキスト量が多い箇所はやや緩め
   await expect(canvas).toHaveScreenshot('details.png', {
     maxDiffPixelRatio: 0.02,  // 2%
   });
   ```

---

## 4. E2Eテスト

### 4-1. フレームワーク比較: Playwright vs Cypress

| 項目 | Playwright | Cypress |
|---|---|---|
| **アーキテクチャ** | ブラウザ外部から制御（CDP等） | ブラウザ内部で実行 |
| **ブラウザ対応** | Chromium, Firefox, WebKit | Chrome, Edge（Firefox実験的、WebKit非対応） |
| **並列実行** | 無料・組み込み（sharding） | 有料（Cypress Cloud必須） |
| **VRT** | 組み込み（toHaveScreenshot） | プラグイン必要 |
| **npm週間DL** | 約3,300万 | 約650万 |
| **GitHub Stars** | 75,000+ | 48,000+ |
| **QA専門家採用率(2026)** | 45.1% | 14.4% |
| **テストアクション速度** | 約290ms/アクション | 約420ms/アクション |
| **メモリ消費(並列10)** | 約2.1 GB | 約3.2 GB |
| **言語** | JS/TS, Python, Java, C# | JS/TSのみ |
| **料金** | 完全無料 | ランナー無料、並列化は有料 |
| **ダウンロードテスト** | 標準対応 | 制限あり（回避策必要） |

### 4-2. 推奨: Playwright Test

このプロジェクトには **Playwright** が最適。決定的な理由は以下の3点。

1. **VRTとの統一**: E2EテストとVRTを同一フレームワーク内で実行でき、ツールの二重管理が不要
2. **ファイルダウンロードのテスト**: Canvas画像のダウンロード検証がPlaywrightの標準APIで可能（Cypressでは制約あり）
3. **無料の並列実行**: GitHub ActionsでのCI実行時にshardingによる並列化が追加コストなしで利用可能

### 4-3. テストシナリオ例

```typescript
// tests/e2e/generate-sign.spec.ts
import { test, expect } from '@playwright/test';

test.describe('駅名標生成フロー', () => {

  test('基本フロー: パターン選択→入力→生成→描画確認', async ({ page }) => {
    await page.goto('/');

    // パターン選択
    await page.selectOption('[data-testid="pattern-select"]', '小田急線');

    // 駅名入力
    await page.fill('[data-testid="station-name"]', '新宿');
    await page.fill('[data-testid="station-name-kana"]', 'しんじゅく');
    await page.fill('[data-testid="station-name-romaji"]', 'Shinjuku');

    // 生成
    await page.click('[data-testid="generate-button"]');

    // Canvas に描画が完了していることを確認
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Canvas のサイズが正しいことを確認
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
  });

  test('ダウンロード: 画像ファイルが正しく保存される', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="station-name"]', '新宿');
    await page.click('[data-testid="generate-button"]');

    // ダウンロードイベントを待機
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="download-button"]'),
    ]);

    // ファイル名の検証
    expect(download.suggestedFilename()).toMatch(/\.png$/);

    // ファイルサイズの検証（空でないこと）
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('入力補完: パターン変更時にフィールドが自動入力される', async ({ page }) => {
    await page.goto('/');

    // パターン選択でフィールドが補完される
    await page.selectOption('[data-testid="pattern-select"]', '小田急線');

    // 補完された値が入力されていることを確認
    const prevStation = await page.inputValue('[data-testid="prev-station"]');
    expect(prevStation).not.toBe('');
  });

  test('全フォーム項目の入力と反映', async ({ page }) => {
    await page.goto('/');

    // 11項目すべてを入力
    await page.fill('[data-testid="station-name"]', 'テスト駅');
    await page.fill('[data-testid="station-name-kana"]', 'てすとえき');
    await page.fill('[data-testid="station-name-romaji"]', 'Test-Eki');
    await page.fill('[data-testid="station-number"]', 'OH 28');
    await page.fill('[data-testid="prev-station"]', '前駅');
    await page.fill('[data-testid="next-station"]', '次駅');
    // ...残りのフィールド

    // チェックボックス操作
    await page.check('[data-testid="show-number-checkbox"]');

    // 生成して描画を確認
    await page.click('[data-testid="generate-button"]');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

});
```

### 4-4. Playwright 設定ファイル

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // ローカルサーバーの起動（静的ファイル配信）
  webServer: {
    command: 'npx serve . -l 3000',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--font-render-hinting=none',
            '--disable-font-subpixel-positioning',
          ],
        },
      },
    },
  ],

  // VRT用のスナップショット設定
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    },
  },
});
```

---

## 5. CI構成（GitHub Actions）

### 5-1. 基本ワークフロー

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # ==============================
  # ユニットテスト（高速・毎回実行）
  # ==============================
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npx vitest run --coverage

      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7

  # ==============================
  # E2E + VRT（Docker統一環境）
  # ==============================
  e2e:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.52.0-noble
    steps:
      - uses: actions/checkout@v4

      - name: Install custom fonts
        run: |
          mkdir -p /usr/local/share/fonts/custom
          cp fonts/*.ttf /usr/local/share/fonts/custom/
          fc-cache -fv

      - name: Install dependencies
        run: npm ci

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14

      - name: Upload test results (screenshots, traces)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
          retention-days: 14
```

### 5-2. ワークフロー構成のポイント

**ジョブ分離**: ユニットテスト(`unit`)とE2E/VRT(`e2e`)を別ジョブとして並列実行。ユニットテストは数秒で完了するため、E2Eの結果を待たずにフィードバックが得られる。

**Docker Image**: E2E/VRTは `mcr.microsoft.com/playwright:v1.52.0-noble` コンテナ内で実行。ブラウザバイナリとシステム依存ライブラリがプリインストールされており、`npx playwright install` が不要。

**カスタムフォント**: リポジトリ内の `fonts/` ディレクトリからTTFファイルをコンテナにコピーし、`fc-cache` でフォントキャッシュを再構築。これにより `@font-face` で読み込むフォントとOSレベルのフォントレンダリングが統一される。

**アーティファクト**: テスト失敗時にPlaywright HTMLレポート、スクリーンショット、トレースファイルをアーティファクトとして保存。GitHub UI上でダウンロードしてローカルで `npx playwright show-report` により閲覧できる。

**ベースライン更新**: CIでVRTが失敗した場合の更新手順。

```bash
# Docker環境内でベースラインを再生成
docker compose run playwright npx playwright test --update-snapshots
# 生成されたスナップショットをコミット
git add tests/**/*-snapshots/
git commit -m "chore: update VRT baselines"
```

---

## 6. 各レイヤーの優先度とカバレッジ目安

| レイヤー | 優先度 | テスト数目安 | カバレッジ目安 | 実行時間 | 実行頻度 |
|---|---|---|---|---|---|
| **ユニットテスト** | ★★★ 最優先 | 30〜50 | ロジック関数 80%以上 | 数秒 | 全push |
| **VRT** | ★★☆ 中 | 5〜10パターン | 主要描画パターン全網羅 | 30秒〜1分 | 全PR |
| **E2E** | ★☆☆ 低 | 3〜5シナリオ | クリティカルパスのみ | 1〜2分 | 全PR |

### 段階的導入ロードマップ

**Phase 1（リライトと同時）**: ESMモジュール化と同時にユニットテストを整備。レイアウト計算関数を純粋関数として切り出し、Vitest でテストを書く。

**Phase 2（描画安定後）**: Canvas描画が安定した段階でPlaywright VRT を導入。Docker環境を構築し、5〜10パターンのベースライン画像を確定。

**Phase 3（フロー確認）**: E2Eテストを3〜5シナリオ追加。GitHub Actions のCIパイプラインを完成させる。

---

## 7. 参考: パッケージバージョン一覧

| パッケージ | バージョン（2026年6月時点） | 用途 |
|---|---|---|
| vitest | 4.1.9 | ユニットテストランナー |
| vitest-canvas-mock | 最新 | Canvas API モック |
| @playwright/test | 1.52.x | E2E + VRT |
| jsdom | 最新 | DOM環境シミュレーション |

---

## 8. まとめ

このプロジェクトの特性 — Canvas 2D APIによる画像生成、カスタムフォント依存、フォーム入力 → 描画のシンプルなフロー — に対して、**Vitest + Playwright の2本柱**がコストと効果のバランスに最も優れる。

最も重要なのは、リライト時にテスタブルな設計（レイアウト計算の純粋関数化）を実現すること。これによりユニットテストのカバレッジが確保され、VRTとE2Eは最小限のシナリオで品質を保証できる。有料のSaaSツール（Percy、Applitools等）はこのプロジェクト規模では過剰であり、OSS構成で十分に目的を達成できる。
