# 小田急駅名標ジェネレーター v2.0 — Architecture Document

## 1. システム概要

小田急電鉄風の駅名標画像をブラウザ上で生成する静的Webアプリ（SPA）。

- **フレームワーク**: Svelte 5 + Vite（SvelteKit不使用）
- **描画**: Canvas 2D API（ライブラリなし）
- **言語**: TypeScript（strict mode）
- **ホスティング**: Cloudflare Pages

旧リポジトリ [ODQ-ekimei-create](https://github.com/yoku8983/ODQ-ekimei-create)（Vanilla JS）のゼロベースリライト。技術選定の詳細は [docs/research/01_framework_comparison.md](research/01_framework_comparison.md) を参照。

## 2. データフロー

```
User Input (フォーム)
    ↓ bind:value
Svelte $state (station, flags)
    ↓ $effect() 自動追跡
renderStationSign()
    ↓ LayoutResolver で正規化座標→ピクセル変換
Canvas 2D 描画
    ↓ toBlob
PNG ダウンロード / SNSシェア
```

## 3. ディレクトリ構成

```
odq-sign-generator/
├── index.html                  # Viteエントリポイント
├── vite.config.ts
├── tsconfig.json
├── svelte.config.js
├── package.json
├── playwright.config.ts
├── public/
│   ├── _headers                # Cloudflare Pages セキュリティ・キャッシュヘッダー
│   ├── _redirects              # SPA フォールバック
│   ├── favicon.ico
│   ├── robots.txt
│   ├── assets/                 # background.png, badgelogo.png
│   └── fonts/                  # Mplus2c-Medium.woff2, VialogLT-Regular.woff2, Frutiger-Bold.woff2
├── src/
│   ├── main.ts                 # App マウント
│   ├── App.svelte              # ルートコンポーネント
│   ├── app.css                 # グローバルCSS（CSS変数、ベーススタイル）
│   ├── components/             # Svelteコンポーネント
│   │   ├── Header.svelte
│   │   ├── StationForm.svelte
│   │   ├── PatternSelector.svelte
│   │   ├── StationNameInputs.svelte
│   │   ├── AdjacentInputs.svelte
│   │   ├── NumberingInputs.svelte
│   │   ├── ActionButtons.svelte
│   │   ├── SignPreview.svelte
│   │   ├── NotesSection.svelte
│   │   └── Footer.svelte
│   └── lib/                    # ロジック層
│       ├── models.ts           # TypeScript型定義
│       ├── layout.ts           # LAYOUT定数 + 型定義
│       ├── layout-resolver.ts  # LayoutResolverクラス
│       ├── state.svelte.ts     # リアクティブ状態管理
│       ├── station-patterns.ts # 駅名パターンデータ（70駅）
│       ├── renderer.ts         # 描画オーケストレーター
│       ├── text.ts             # フォントサイズ最適化 + テキスト描画
│       ├── shapes.ts           # 図形描画（角丸矩形等）
│       ├── canvas-utils.ts     # HiDPI設定 + Blob出力 + ダウンロード
│       └── fonts.ts            # FontFace APIロード
├── tests/
│   ├── unit/                   # Vitest ユニットテスト
│   ├── e2e/                    # Playwright E2E
│   └── visual/                 # Playwright VRT
├── fonts-src/                  # 元TTFファイル（ビルド出力に含まれない）
│   ├── Mplus2c-Medium.ttf
│   ├── Frutiger-Bold.ttf
│   └── VialogLT-Regular.ttf
├── scripts/
│   └── subset-fonts.py         # フォントサブセット化 + woff2変換
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   └── research/               # 技術調査ドキュメント
└── .github/workflows/
    ├── ci.yml                  # svelte-check + vitest + playwright
    └── deploy.yml              # build + Cloudflare Pages deploy
```

## 4. データモデル

設計仕様: [Issue #1](https://github.com/yoku8983/odq-sign-generator/issues/1)

### 型定義（src/lib/models.ts）

```typescript
/** 駅ナンバリング（路線記号 + 駅番号） */
interface StationNumbering {
  symbol: string;   // "OH", "OE", "OT"
  number: string;   // "01", "23" — 先頭ゼロ保持のためstring
}

/** 駅データ — フォーム11フィールドと1:1対応 */
interface StationData {
  name:    { kanji: string; hiragana: string; romaji: string };
  prev:    { kanji: string; romaji: string };
  next:    { kanji: string; romaji: string };
  currentNumbering: StationNumbering | null;
  nextNumbering:    StationNumbering | null;
}

/** 表示フラグ */
interface DisplayFlags {
  hideCurrentNumbering: boolean;
  hideNextNumbering: boolean;
}

/** 駅名パターンエントリ（ドロップダウン用） */
interface StationPatternEntry extends StationData {
  readonly label: string;  // 表示ラベル
  readonly line: string;   // 路線識別子: "OH" | "OE" | "OT"
}
```

### フォームフィールド対応

| StationData | フォーム | station-patterns.jsキー |
|---|---|---|
| `name.kanji` | `stationNameKanji` | `stationNameKanji` |
| `name.hiragana` | `stationNameHiragana` | `stationNameHiragana` |
| `name.romaji` | `stationNameRomaji` | `stationNameRomaji` |
| `prev.kanji` | `previousStationNameKanji` | `previousStationNameKanji` |
| `prev.romaji` | `previousStationNameRomaji` | `previousStationNameRomaji` |
| `next.kanji` | `nextStationNameKanji` | `nextStationNameKanji` |
| `next.romaji` | `nextStationNameRomaji` | `nextStationNameRomaji` |
| `currentNumbering.symbol` | `currentStationSymbol` | `currentStationSymbol` |
| `currentNumbering.number` | `currentStationNumber` | `currentStationNumber` |
| `nextNumbering.symbol` | `nextStationSymbol` | `nextStationSymbol` |
| `nextNumbering.number` | `nextStationNumber` | `nextStationNumber` |

### ネスト構造の採用理由

将来の拡張時に `StationData` を壊さずにフィールドを追加できる:
- 中韓表記（旧リポ #26）: `name` に `korean?`, `simplifiedChinese?` を追加
- 分岐駅（旧リポ #25）: 複数の prev/next + `direction` フィールド
- 乗換路線（旧リポ #27）: `companyName`, `lineName`, `lineColor`

## 5. レイアウトエンジン

設計仕様: [Issue #2](https://github.com/yoku8983/odq-sign-generator/issues/2)

### 正規化座標システム

全座標を0〜1の比率で定義し、`LayoutResolver` でピクセル変換する。

- **背景画像**: 1213x378px → アスペクト比 `378/1213 = 0.31161`
- **変換式**: x座標 = `ratio × canvasWidth`、y座標 = `ratio × canvasHeight`

### LayoutResolver（src/lib/layout-resolver.ts）

```typescript
class LayoutResolver {
  constructor(public readonly w: number, public readonly h: number) {}
  x(ratio: number): number      { return ratio * this.w; }
  y(ratio: number): number      { return ratio * this.h; }
  fontSize(ratio: number): number { return ratio * this.w; }
  width(ratio: number): number   { return ratio * this.w; }
  height(ratio: number): number  { return ratio * this.h; }
}
```

### LAYOUT定数（src/lib/layout.ts）

Canvas基準 1200x373px からの正規化座標。主要要素:

| 要素 | x | y | fontSize | maxWidth |
|------|---|---|----------|----------|
| メイン漢字 | 0.5 (center) | 115/373 | 100/1200 | 750/1200 |
| メインローマ字 | 0.5 (center) | 190/373 | 60/1200 | 550/1200 |
| メインひらがな | 0.5 (center) | 330/373 | 55/1200 | 380/1200 |
| 前駅 | 1/40 (left) | 330/373 | 42/1200 | 170/1200 |
| 次駅 | 39/40 (right) | 330/373 | 42/1200 | 170/1200 |

## 6. Canvas描画パイプライン

設計仕様: [Issue #3](https://github.com/yoku8983/odq-sign-generator/issues/3)

### モジュール構成（計~390行）

| ファイル | 責務 | 行数 |
|---------|------|------|
| `renderer.ts` | 描画オーケストレーター + 内部ヘルパー3関数 | ~200行 |
| `shapes.ts` | drawRoundedRect + drawNumberingBadge | ~70行 |
| `text.ts` | fitFontSize（二分探索）+ drawFittedText | ~65行 |
| `canvas-utils.ts` | HiDPI Canvas設定 + toBlob出力 + ダウンロード | ~40行 |
| `fonts.ts` | FontFace APIロード | ~16行 |

### 描画順序

1. 背景画像
2. メイン駅名（漢字）
3. メインローマ字
4. メインひらがな
5. 前駅名（漢字 + ローマ字）
6. 次駅名（漢字 + ローマ字）
7. 現在駅ナンバリング（角丸矩形 + 2行テキスト）
8. 次駅ナンバリング

### 二分探索フォントサイズ最適化

現行の1pxデクリメントループ（最大92回の `measureText`）を二分探索に置換。通常3〜4回で完了。

### toBlob への移行

`toDataURL`（Base64、33%サイズ増加）→ `toBlob` + `URL.createObjectURL`（バイナリ直接操作で効率的）

## 7. コンポーネント設計

設計仕様: [Issue #4](https://github.com/yoku8983/odq-sign-generator/issues/4)

### コンポーネントツリー

```
App.svelte
├── Header.svelte               — タイトル + SNSリンク（intent URL）
├── StationForm.svelte           — フォーム全体
│   ├── PatternSelector.svelte   — 駅パターンドロップダウン + 補完ボタン
│   ├── StationNameInputs.svelte — 漢字/ひらがな/ローマ字
│   ├── AdjacentInputs.svelte    — 前駅/次駅（漢字+ローマ字）
│   ├── NumberingInputs.svelte   — 路線記号/駅番号 + 非表示チェックボックス
│   └── ActionButtons.svelte     — 保存/クリア（Canvas）/クリア（フォーム）
├── SignPreview.svelte           — Canvas要素 + エラー表示
├── NotesSection.svelte          — 注意事項
└── Footer.svelte                — 変更履歴 + コピーライト
```

### 状態管理（src/lib/state.svelte.ts）

Svelte 5 Runes（`$state`, `$derived`, `$effect`）を使用。`.svelte.ts` 拡張子によりコンポーネント外でRunesを使用可能。

- `station: StationData` — `$state` でリアクティブ、フォームに `bind:value` でバインド
- `flags: DisplayFlags` — `$state` でリアクティブ
- `resetStation()` — 全フィールド初期化
- `applyPattern(pattern)` — 駅パターンから値を適用

### リアルタイムプレビュー

SignPreview.svelte 内の `$effect()` が `station.*` と `flags.*` の変更を自動追跡し、Canvas を再描画。Svelte 5のプロキシベース追跡により、ネストされたプロパティの変更も自動検知される。

### SNSシェア

外部SDKを排除し、intent URLリンクに変更（CSP簡素化 + バンドルサイズ削減）。

## 8. デプロイ構成

設計仕様: [Issue #5](https://github.com/yoku8983/odq-sign-generator/issues/5)

### Cloudflare Pages

- **デプロイ方式**: GitHub Actions + `wrangler pages deploy`（Direct Upload）
- **本番**: `odq-sign-gen.pages.dev`（main push）
- **プレビュー**: PRごとに自動生成

### セキュリティヘッダー（_headers）

- CSP: `default-src 'self'`（外部スクリプト/スタイル排除）
- X-Frame-Options: DENY
- HSTS: 1年、preload対応
- Permissions-Policy: カメラ・マイク・位置情報・決済を全拒否

### キャッシュ戦略

- HTML: `no-cache`（常に最新チェック）
- フォント・画像・favicon: `immutable`、1年（コンテンツハッシュ不要の静的アセット）
- JS/CSS: Viteがコンテンツハッシュ付与 → `immutable`、1年

### CI/CD

- **ci.yml**: svelte-check + vitest（全push/PR）
- **deploy.yml**: build + wrangler pages deploy（main push + PR）

## 9. 設計判断

| 判断 | 理由 |
|------|------|
| Svelte 5（SvelteKit不使用） | SPA 1ページ、ルーティング/SSR不要。コンパイラベースで3〜5KB gzip |
| Canvasライブラリ不使用 | Konva/Fabric/PixiJS は50〜100KB超。2D描画のみで不要 |
| 正規化座標（0〜1） | Canvas幅変更・Retina対応・出力サイズ選択を座標定義の変更なしで実現 |
| 二分探索フォントサイズ | 1pxループ（最大92回）→ 二分探索（3〜4回）でmeasureText呼び出し削減 |
| toBlob（toDataURL廃止） | Base64の33%サイズ増加を回避、メモリ効率改善 |
| SNS intent URL | 外部SDK排除でCSP簡素化 + バンドルサイズ削減 |
| ネスト型データモデル | 将来の中韓表記・分岐駅・乗換路線追加時に型を壊さない拡張性 |
| Cloudflare Pages Direct Upload | テスト→ビルド→デプロイのCI/CDパイプライン制御が可能 |
