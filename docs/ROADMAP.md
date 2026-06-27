# 小田急駅名標ジェネレーター v2.0 — Roadmap

## 過去バージョン（旧リポジトリ）

旧リポジトリ [ODQ-ekimei-create](https://github.com/yoku8983/ODQ-ekimei-create) での開発履歴:

| バージョン | リリース日 | 主な変更 |
|-----------|-----------|---------|
| v1.0.0 | 2024/12/15 | 初回リリース |
| v1.1.0 | 2024/12/21 | CSS修正、meta tags追加 |
| v1.2.0 | 2024/12/29 | 定数リファクタ、アクセシビリティ改善 |
| v1.3.0 | 2025/01/19 | CSP準拠（addEventListener移行）、セキュリティヘッダー |
| v1.4.0 | 2025/02/17 | ナンバリングとローマ字の重複修正 |

## v2.0 フェーズ計画

### Phase 0: アセット移植 + ドキュメント整備

- [x] 旧リポジトリからアセットコピー（背景画像、ロゴ、ファビコン、フォント3種）
- [x] 技術調査ドキュメント4件を docs/research/ に移植
- [x] ARCHITECTURE.md 作成（Issue #1〜#5 の設計仕様を統合）
- [x] ROADMAP.md 作成（本ファイル）
- [x] .gitignore 作成（Node.js / Vite / Playwright対応）

### Phase 1: プロジェクト初期化（Vite + Svelte 5）

- [ ] Vite + Svelte 5 + TypeScript（strict mode）セットアップ
- [ ] npm scripts 定義（dev, build, preview, check, test, test:e2e 等）
- [ ] index.html（OGP meta tags、日本語 lang 属性）
- [ ] src/App.svelte（最小プレースホルダー）
- [ ] src/app.css（CSS変数: 小田急ブランドカラー + ベーススタイル）
- [ ] Cloudflare Pages 設定（_headers, _redirects）
- [ ] GitHub Actions CI/CD ワークフロー（ci.yml, deploy.yml）

### Phase 2: データモデル + レイアウトエンジン

- [x] TypeScript 型定義 — [Issue #1](https://github.com/yoku8983/odq-sign-generator/issues/1)
  - StationData, StationNumbering, DisplayFlags, StationPatternEntry, RenderOptions
- [x] LAYOUT 定数 + LayoutResolver — [Issue #2](https://github.com/yoku8983/odq-sign-generator/issues/2)
  - 正規化座標（0〜1）定義、LayoutResolver クラス
- [x] 駅名パターンデータ移植（station-patterns.ts、70駅）
- [x] ユニットテスト（Vitest）

### Phase 3: Canvas 描画パイプライン

- [x] renderer.ts（描画オーケストレーター）— [Issue #3](https://github.com/yoku8983/odq-sign-generator/issues/3)
- [x] text.ts（二分探索フォントサイズ最適化 + テキスト描画）
- [x] shapes.ts（角丸矩形 + ナンバリング描画）
- [x] canvas-utils.ts（HiDPI Canvas 設定 + toBlob 出力 + ダウンロード）
- [x] fonts.ts（FontFace API ロード）
- [x] ユニットテスト（Vitest）
- [x] VRT（Playwright）— Phase 4 で UI と合わせて実施

### Phase 4: Svelte コンポーネント + UI

- [x] 状態管理（state.svelte.ts）— [Issue #4](https://github.com/yoku8983/odq-sign-generator/issues/4)
- [x] コンポーネント実装
  - Header, StationForm, PatternSelector, StationNameInputs
  - AdjacentInputs, NumberingInputs, ActionButtons
  - SignPreview, NotesSection, Footer
- [x] リアルタイムプレビュー（$effect による自動再描画）
- [x] 画像保存（toBlob + ダウンロード）/ Canvas クリア / フォームリセット
- [x] SNS シェア（intent URL: Twitter, LINE, Facebook）
- [x] E2E テスト（Playwright）

### Phase 5: 最適化 + リリース

- [x] フォント最適化（TTF→woff2変換 + Mplus2cサブセット化、合計1.43MB→498KB）
- [ ] バンドルサイズ最適化（その他）
- [ ] Cloudflare Pages 本番デプロイ
- [ ] カスタムドメイン設定（旧 Azure SWA からの移行）
- [ ] パフォーマンス検証

---

## 旧リポジトリ未対応 Issue（v2.0 で対応予定）

### 機能追加

| 旧Issue | 内容 | v2.0 での対応 |
|---------|------|-------------|
| [#20](https://github.com/yoku8983/ODQ-ekimei-create/issues/20) | テキスト入力時のリアルタイムプレビュー | Phase 4 で `$effect()` により実現 |
| [#21](https://github.com/yoku8983/ODQ-ekimei-create/issues/21) | 駅名が短い場合の横幅レイアウト問題 | Phase 3 で LayoutResolver により対応 |
| [#23](https://github.com/yoku8983/ODQ-ekimei-create/issues/23) | フォント最適化（woff2化・サブセット化） | Phase 5 で対応 |
| [#24](https://github.com/yoku8983/ODQ-ekimei-create/issues/24) | モバイル表示の改善 | Phase 4 で CSS 対応 |
| [#29](https://github.com/yoku8983/ODQ-ekimei-create/issues/29) | 高解像度（Retina対応）画像出力 | Phase 3 で canvas-utils.ts の HiDPI 対応 |

### 将来機能

| 旧Issue | 内容 | 備考 |
|---------|------|------|
| [#25](https://github.com/yoku8983/ODQ-ekimei-create/issues/25) | 分岐駅・スイッチバック駅の表記対応 | データモデル拡張が必要 |
| [#26](https://github.com/yoku8983/ODQ-ekimei-create/issues/26) | 中韓駅名表記の追加 | StationData.name に korean/simplifiedChinese 追加 |
| [#27](https://github.com/yoku8983/ODQ-ekimei-create/issues/27) | 乗換路線表記の追加 | TransferLine 型の追加が必要 |
| [#28](https://github.com/yoku8983/ODQ-ekimei-create/issues/28) | SNS共有で生成した駅名標画像を直接シェア | Web Share API 検討 |

### テスト

| 旧Issue | 内容 | v2.0 での対応 |
|---------|------|-------------|
| [#33](https://github.com/yoku8983/ODQ-ekimei-create/issues/33) | テスト設計（入力パターン・境界値・異常系） | Phase 2〜4 で段階的に実装 |
| [#34](https://github.com/yoku8983/ODQ-ekimei-create/issues/34) | E2E テスト自動化 | Phase 4 で Playwright 導入 |

### アーキテクチャ（設計決定済み）

| 旧Issue | 内容 | ステータス |
|---------|------|----------|
| [#45](https://github.com/yoku8983/ODQ-ekimei-create/issues/45) | アーキテクチャ再設計・ゼロベースリライト | 本リポジトリで実施中 |
| [#46](https://github.com/yoku8983/ODQ-ekimei-create/issues/46) | 技術選定: Svelte 5 + Vite | 採用決定 |
| [#47](https://github.com/yoku8983/ODQ-ekimei-create/issues/47) | Canvas描画パイプライン設計 | Issue #2, #3 で仕様化 |
| [#48](https://github.com/yoku8983/ODQ-ekimei-create/issues/48) | テスト戦略設計 | Vitest + Playwright 採用 |
| [#49](https://github.com/yoku8983/ODQ-ekimei-create/issues/49) | Cloudflare Pages デプロイ構成 | Issue #5 で仕様化 |
