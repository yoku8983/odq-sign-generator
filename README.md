# 小田急駅名標ジェネレーター

小田急電鉄風の駅名標画像をブラウザ上で生成する静的Webアプリ。

https://odq-stasigin-gen.net

旧リポジトリ [ODQ-ekimei-create](https://github.com/yoku8983/ODQ-ekimei-create) のゼロベースリライト（Svelte 5 + Canvas 2D API）。

## 機能

- 小田急全70駅のプリセットから選択、またはカスタム入力
- リアルタイムプレビュー（入力と同時にCanvasを再描画）
- 高解像度画像の保存（HiDPI / Retina対応）
- 駅ナンバリング（OH / OE / OT）の表示・非表示切替
- SNSシェア（X / LINE / Facebook + Web Share API）
- モバイル対応（レスポンシブ）
- 完全静的サイト（サーバー不要、APIキー不要）

## 開発

### セットアップ

```bash
npm install
```

### 開発サーバー

```bash
npm run dev    # localhost:3000
```

### テスト

```bash
npm test              # ユニットテスト（Vitest）
npm run test:watch    # ウォッチモード
npm run test:coverage # カバレッジ
npm run test:e2e      # E2E + VRT（Playwright）
npm run test:e2e:update # VRTベースライン更新
```

### ビルド

```bash
npm run build     # プロダクションビルド（dist/）
npm run preview   # ビルド結果のプレビュー
```

### コード品質

```bash
npm run check    # Svelte型チェック（svelte-check）
```

## 技術スタック

- Svelte 5 + Vite（SvelteKit不使用、SPA）
- Canvas 2D API（ライブラリなし、正規化座標 + LayoutResolver）
- TypeScript（strict mode）
- Vitest（ユニットテスト）+ Playwright（E2E / VRT）
- Cloudflare Pages（GitHub Actions経由のDirect Upload）

## デプロイ

mainブランチへのpushで Cloudflare Pages に自動デプロイ。PRごとにプレビュー環境が自動作成される。

### 必要なGitHub設定

| 種類 | 名前 | 用途 |
|------|------|------|
| Secret | `CLOUDFLARE_API_TOKEN` | Cloudflare APIトークン（Pages編集権限） |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | CloudflareアカウントID |

### 手動デプロイ

```bash
npm run build
npx wrangler pages deploy dist --project-name=odq-sign-generator
```

### CI/CD パイプライン

| ワークフロー | トリガー | 内容 |
|------------|---------|------|
| `ci.yml` | push / PR to main | svelte-check + vitest |
| `deploy.yml` | push / PR to main | build + Cloudflare Pages デプロイ（PRはプレビュー環境） |

## アーキテクチャ

詳細は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照。

- **正規化座標 + LayoutResolver**: 全座標を0-1比率で定義し、Canvasサイズに依存しない描画
- **二分探索フォントサイズ最適化**: `measureText`呼び出しを最大92回から3-7回に削減
- **Svelte 5 Runes状態管理**: `$state` / `$effect`によるリアルタイムプレビュー自動再描画

## ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 技術アーキテクチャ |
| [docs/ROADMAP.md](docs/ROADMAP.md) | 開発ロードマップ |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md) | パフォーマンス検証結果 |
| [docs/research/](docs/research/) | 技術調査ドキュメント |
| [SECURITY.md](SECURITY.md) | セキュリティポリシー |

## ライセンス

ソースコードは [MIT](LICENSE) ライセンスで提供されます。

フォントファイル（`public/fonts/`, `fonts-src/`）は各フォントのライセンスに従います。
