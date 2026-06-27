必ず日本語で回答してください。

# 小田急駅名標ジェネレーター v2.0

小田急電鉄風の駅名標画像をブラウザ上で生成する静的Webアプリ。旧リポジトリ [ODQ-ekimei-create](https://github.com/yoku8983/ODQ-ekimei-create) のゼロベースリライト。

## ローカル開発

```bash
npm install          # 依存インストール
npm run dev          # 開発サーバー起動（localhost:3000）
npm run build        # プロダクションビルド（dist/）
npm run preview      # ビルド結果のプレビュー
```

## テスト

```bash
npm test             # ユニットテスト（Vitest）
npm run test:watch   # ウォッチモード
npm run test:coverage # カバレッジ付き
npm run test:e2e     # E2E + VRT（Playwright）
npm run test:e2e:update # VRTベースライン更新
npm run check        # Svelte型チェック
```

## 技術スタック

- **フレームワーク**: Svelte 5 + Vite（SvelteKit不使用、SPA 1ページ）
- **描画**: Canvas 2D API（ライブラリなし、正規化座標 + LayoutResolver）
- **言語**: TypeScript
- **テスト**: Vitest（ユニット）+ Playwright（E2E / VRT）
- **ホスティング**: Cloudflare Pages（Direct Upload、GitHub Actions経由）
- **公開URL**: `odq-stasigin-gen.net`（カスタムドメイン）/ `odq-sign-generator.pages.dev`（Cloudflare Pagesデフォルト）

## ディレクトリ構成

```
odq-sign-generator/
├── index.html                  # Viteエントリポイント
├── vite.config.ts
├── tsconfig.json
├── svelte.config.js
├── playwright.config.ts        # Playwright E2E/VRT設定
├── package.json
├── public/
│   ├── _headers                # Cloudflare Pagesセキュリティ・キャッシュヘッダー
│   ├── _redirects              # Cloudflare Pagesリダイレクト
│   ├── favicon.ico
│   ├── assets/                 # 背景画像・ロゴ
│   └── fonts/                  # カスタムフォント woff2（FrutigerBold, Mplus2c, VialogLT）
├── src/
│   ├── main.ts                 # Appマウント
│   ├── App.svelte              # ルートコンポーネント
│   ├── app.css                 # グローバルCSS（CSS変数、フォーム、ボタン、レスポンシブ）
│   ├── components/             # Svelteコンポーネント（10ファイル）
│   └── lib/                    # ロジック層（型定義・描画・状態管理）
│       └── state.svelte.ts     # リアクティブ状態管理（$state / Runes）
├── tests/
│   ├── unit/                   # Vitestユニットテスト
│   ├── e2e/                    # Playwright E2E
│   └── visual/                 # Playwright VRT
├── fonts-src/                  # 元TTFファイル（ビルド出力に含まれない）
├── scripts/
│   └── subset-fonts.py         # フォントサブセット化 + woff2変換
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   └── research/               # 技術調査ドキュメント
└── .github/workflows/
    ├── ci.yml                  # lint + type-check + test
    └── deploy.yml              # build + Cloudflare Pages deploy
```

## アーキテクチャ

@docs/ARCHITECTURE.md

## ロードマップ・進捗

@docs/ROADMAP.md

## 設計仕様（GitHub Issue）

技術調査・仕様設計の結果はGitHub Issueとして記録:

- [#1 データモデル仕様](https://github.com/yoku8983/odq-sign-generator/issues/1)
- [#2 レイアウトエンジン仕様](https://github.com/yoku8983/odq-sign-generator/issues/2)
- [#3 Canvas描画パイプライン仕様](https://github.com/yoku8983/odq-sign-generator/issues/3)
- [#4 Svelteコンポーネント設計 + 状態管理仕様](https://github.com/yoku8983/odq-sign-generator/issues/4)
- [#5 プロジェクト構成 + デプロイ仕様](https://github.com/yoku8983/odq-sign-generator/issues/5)

旧リポジトリの技術調査: [#46](https://github.com/yoku8983/ODQ-ekimei-create/issues/46)〜[#49](https://github.com/yoku8983/ODQ-ekimei-create/issues/49)

## ドキュメント更新ルール

- 機能追加・設計変更時は ARCHITECTURE.md / ROADMAP.md を同じPR内で更新する
- セキュリティに関する変更時は SECURITY.md を同じPR内で更新する
- CLAUDE.md の記述が実態と乖離していたら修正する
- 重要な技術・設計判断は `docs/adr/` にADRとして記録する

## コーディング規約

- TypeScript strict mode
- Svelte 5 Runes（`$state`, `$derived`, `$effect`）で状態管理
- Canvas描画ロジックは純粋関数として `src/lib/` に配置（コンポーネントから分離）
- CSSはグローバル変数（`:root`）+ コンポーネントスコープ `<style>` の併用
- CSS変数: `--odakyu-blue: #028CD4`, `--odakyu-dark-blue: #0269A3`, `--light-gray: #f5f5f5`, `--border-gray: #e0e0e0`

## デプロイ

main ブランチへの push で Cloudflare Pages に自動デプロイ。
PRごとにプレビュー環境が自動作成され、PRにURLがコメントされる。
