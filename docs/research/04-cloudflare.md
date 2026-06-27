# 調査4/4: Cloudflare Pagesデプロイ構成

> 調査日: 2026-06-27
> 対象プロジェクト: 小田急電鉄風 駅名標画像生成 静的Webアプリ
> 移行元: Azure Static Web Apps → 移行先: Cloudflare Pages
> カスタムドメイン: `odq-stasigin-gen.net`

---

## 重要な前提: Cloudflare Pagesのプラットフォーム状況（2026年6月時点）

2025年4月、Cloudflareは公式にCloudflare Pagesのメンテナンスモード移行を発表し、今後の新機能開発はすべてCloudflare Workers（Static Assets）に集中すると表明した。Workers Tech LeadのKenton Varda氏は「Pagesを廃止するのではなく、Pages固有の機能をWorkersの汎用機能として統合している」と説明している。

2026年6月現在の状況は以下の通り。

- Cloudflare Pagesは引き続き動作し、メンテナンスはされている
- 新機能（Secrets Store、Workflows、Containers等）はWorkers限定
- WorkersはPagesと同等の静的アセット配信・カスタムドメイン機能を持つ
- 強制移行の期限は未発表だが、将来的に自動移行が予定されている
- 静的サイト用途であればPagesは現時点でも安定して利用可能

**本調査での推奨方針:** 当プロジェクトは純粋な静的サイトであり、サーバーサイド処理を必要としない。Cloudflare Pagesは静的サイトホスティングとしては依然として最もシンプルなセットアップであり、`_headers`/`_redirects`によるゼロコード設定、PRごとの自動プレビューデプロイ、GitHub連携といった機能は引き続き完全に動作する。Workersへの移行パスも確立されているため、まずはPagesで移行し、将来必要になった時点でWorkersへ移行するアプローチが合理的である。

以降の調査内容ではCloudflare Pagesを前提に解説するが、Workers移行を見据えた補足も随所に記載する。

---

## 1. Cloudflare Pagesの基本構成

### 1.1 デプロイ方法

Cloudflare Pagesには大きく2つのデプロイ方法がある。

**方法A: Git連携（GitHub / GitLab直接連携）**

CloudflareダッシュボードからGitHubリポジトリを接続し、pushのたびにCloudflare側でビルド・デプロイが自動実行される方式。ビルドコマンドと出力ディレクトリを指定するだけで動作する。ビルド不要の場合は`exit 0`をビルドコマンドに指定する。

**方法B: Direct Upload（Wrangler CLI / GitHub Actions経由）**

ローカルまたはCI環境で事前にビルドし、`wrangler pages deploy`コマンドでビルド成果物をCloudflareに直接アップロードする方式。GitHub Actions等のCI/CDパイプラインと組み合わせて使用する。

**ビルドありの場合（本プロジェクト該当）:**

```
ビルドコマンド: npm run build（または該当するコマンド）
出力ディレクトリ: dist/（フレームワーク依存）
```

**ビルドなしの場合:**

```
ビルドコマンド: exit 0
出力ディレクトリ: プロジェクトルート or 任意の静的ファイルディレクトリ
```

### 1.2 GitHub連携方式の比較

| 観点 | Git直接連携 | GitHub Actions経由（Direct Upload） |
|------|-----------|--------------------------------------|
| セットアップ | ダッシュボードからワンクリック | ワークフローYAML作成が必要 |
| ビルド環境 | Cloudflareのビルドインフラ（無料） | GitHubのRunnerを使用（月間無料枠あり） |
| ビルド柔軟性 | 限定的（Node.jsバージョン指定程度） | 完全に自由（任意のステップ追加可） |
| テスト統合 | ビルド前後にスクリプトを挟む程度 | lint、テスト、E2Eなど自由に構成可 |
| プレビューデプロイ | 自動（PR単位で自動生成） | branch名指定で手動制御 |
| デプロイ速度 | 高速（専用インフラ） | Runner起動分やや遅い |
| プロジェクト変更不可制限 | Git連携→Direct Uploadへの変更不可 | 制限なし |
| 将来のWorkers移行 | 再構成が必要 | ワークフロー修正で対応可能 |

**推奨: GitHub Actions経由（Direct Upload）**

理由は以下の通り。

- Azure SWA時代に確立したCI/CDのノウハウ（ビルド→テスト→デプロイ）をそのまま活用できる
- Git直接連携はDirect Uploadへ後から変更できないという制約がある
- 将来Workers移行する際もワークフローの修正だけで対応可能
- テスト・lint・セキュリティチェック等の追加ステップを自由に組み込める

### 1.3 プレビューデプロイの仕組み

Cloudflare Pagesでは、production以外のブランチへのデプロイは自動的にプレビューデプロイとして扱われる。

- PRを作成すると一意のプレビューURL（`<hash>.<project>.pages.dev`）が生成される
- ブランチ名のエイリアスURL（`<branch>.<project>.pages.dev`）も同時に作成され、同ブランチへの追加コミットで自動更新される
- プレビューデプロイには自動的に`X-Robots-Tag: noindex`が付与され、検索エンジンにインデックスされない
- Cloudflare Accessと連携してプレビューURLへのアクセス制限も可能
- GitHub Actions経由の場合、`branch`パラメータでproductionかpreviewかを制御する

GitHub Actions経由の場合は、`wrangler pages deploy`コマンドの`--branch`オプションを利用する。mainブランチは本番、それ以外はプレビューとなる。

---

## 2. ヘッダー・リダイレクト設定の移植

### 2.1 Azure SWA → Cloudflare Pages の設定対応

Azure SWAでは`staticwebapp.config.json`で一括管理していた設定を、Cloudflare Pagesでは以下の2ファイルに分離して管理する。

| Azure SWA | Cloudflare Pages |
|-----------|-----------------|
| `staticwebapp.config.json` の `responseOverrides` | `_headers` ファイル |
| `staticwebapp.config.json` の `routes` (リダイレクト) | `_redirects` ファイル |
| `staticwebapp.config.json` の `routes` (wwwリダイレクト) | Bulk Redirects（ダッシュボード設定） |

### 2.2 ファイル配置場所

`_headers`と`_redirects`はビルド出力ディレクトリのルートに配置する。フレームワークを使用している場合は`public/`ディレクトリに配置すると、ビルド時に出力ディレクトリへコピーされる。

```
project-root/
├── public/
│   ├── _headers      ← ここに配置
│   ├── _redirects     ← ここに配置
│   └── favicon.ico
├── src/
└── package.json
```

### 2.3 `_headers` ファイルの書式

```
# URLパターン
#   ヘッダー名: 値

# 複数行ブロックで定義
/secure/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff

# ワイルドカード（splat）でパス全体にマッチ
/*
  Referrer-Policy: no-referrer

# ヘッダーの除去（先頭に ! を付ける）
/public/*
  ! X-Frame-Options
```

制限事項として、最大100ルール、1行あたり最大2,000文字、Pages Functionsのレスポンスには適用されない点がある。

### 2.4 `_redirects` ファイルの書式

```
# 書式: ソースURL  ターゲットURL  [ステータスコード]
/old-path  /new-path  301
/blog/*  https://blog.example.com/:splat  301
```

制限事項として、静的リダイレクト最大2,000件、動的リダイレクト最大100件、合計2,100件が上限である。

### 2.5 現行設定のCloudflare Pages変換例

#### `_headers` ファイル（完全版）

```
# ===========================================
# Cloudflare Pages _headers
# プロジェクト: 小田急駅名標ジェネレータ
# ===========================================

# ------------------------------------------
# pages.dev ドメインの検索エンジン除外
# ------------------------------------------
https://:project.pages.dev/*
  X-Robots-Tag: noindex

# ------------------------------------------
# 全ページ共通: セキュリティヘッダー
# ------------------------------------------
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Content-Security-Policy: default-src 'self'; script-src 'self' https://platform.twitter.com https://connect.facebook.net; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src https://platform.twitter.com https://www.facebook.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests

# ------------------------------------------
# HTML: キャッシュなし（常に最新を取得）
# ------------------------------------------
/*.html
  Cache-Control: no-cache

/
  Cache-Control: no-cache

# ------------------------------------------
# フォント: 長期キャッシュ（1年）
# ------------------------------------------
/fonts/*
  Cache-Control: public, max-age=31536000, immutable

# ------------------------------------------
# 画像: 長期キャッシュ（1年）
# ------------------------------------------
/images/*
  Cache-Control: public, max-age=31536000, immutable

/*.png
  Cache-Control: public, max-age=31536000, immutable

/*.jpg
  Cache-Control: public, max-age=31536000, immutable

/*.svg
  Cache-Control: public, max-age=31536000, immutable

/*.webp
  Cache-Control: public, max-age=31536000, immutable

/*.ico
  Cache-Control: public, max-age=31536000, immutable

# ------------------------------------------
# JS/CSS: 中期キャッシュ（1週間）
# ハッシュ付きファイル名の場合はimmutableに変更可
# ------------------------------------------
/*.js
  Cache-Control: public, max-age=604800

/*.css
  Cache-Control: public, max-age=604800

# ------------------------------------------
# Early Hints 用 Link ヘッダー（オプション）
# ------------------------------------------
/
  Link: </css/main.css>; rel=preload; as=style
  Link: </js/app.js>; rel=preload; as=script
```

**CSPに関する補足:** Azure SWAで設定済みの`unsafe-inline`排除を維持している。外部SNSスクリプト（Twitter・Facebook）は`script-src`と`frame-src`でホワイトリスト指定している。実際のCSPは使用する外部リソースに応じて調整が必要。

**キャッシュ制御の補足:** ビルド時にファイル名にコンテンツハッシュを付与している場合（例: `app.a1b2c3d4.js`）、JS/CSSも`immutable`付きの長期キャッシュに変更可能。

#### `_redirects` ファイル

```
# ===========================================
# Cloudflare Pages _redirects
# ===========================================

# pages.dev → カスタムドメインへのリダイレクト（SEO対策）
# ※ pages.devドメインからのアクセスをカスタムドメインに誘導
# https://<project>.pages.dev/*  https://odq-stasigin-gen.net/:splat  301
```

#### www→apex リダイレクト（Bulk Redirects）

Cloudflare Pagesの`_redirects`ファイルではドメインレベルのリダイレクトが正しく動作しない場合があるため、www→apexリダイレクトにはCloudflareダッシュボードのBulk Redirects機能を使用する。

設定手順:

1. Cloudflareダッシュボードで「Bulk Redirects」に移動
2. 新しいBulk Redirect Listを作成（名前例: `www-to-apex`）
3. 以下のルールを追加:
   - ソースURL: `https://www.odq-stasigin-gen.net`
   - ターゲットURL: `https://odq-stasigin-gen.net`
   - ステータスコード: `301`
   - オプション: 「Preserve query string」「Subpath matching」「Preserve path suffix」すべてON
4. Bulk Redirect Ruleを作成し、作成したリストを関連付けて「Save and Deploy」

前提として、`www`サブドメインのDNSレコード（AAAA `100::` または A `192.0.2.1` 等のダミーIP、Proxy有効）が必要。

### 2.6 Cloudflare固有のヘッダー最適化

**Early Hints（103レスポンス）**

Cloudflare Pagesでは`pages.dev`ドメインおよびカスタムドメインの両方でEarly Hintsが自動的に有効になる。Early Hintsは、ブラウザがHTMLの完全なレスポンスを待つ間に、CSSやフォントなどの重要なリソースの先行読み込みを指示する103レスポンスを送信する機能である。

活用方法は2つある。

**方法1: `_headers`ファイルでLinkヘッダーを定義**

```
/
  Link: </css/main.css>; rel=preload; as=style
  Link: </fonts/OdakyuFont.woff2>; rel=preload; as=font; crossorigin
```

**方法2: HTMLの`<link>`要素から自動生成**

HTMLに含まれる`<link rel="preload">`や`<link rel="preconnect">`要素から、Cloudflareが自動的にLinkヘッダーを生成してEarly Hintsとして送信する。ただし`fetchpriority`や`crossorigin`等の追加属性がある`<link>`は自動生成の対象外。

**その他のCloudflare標準機能:**

- Tiered Cache: Pagesプロジェクトの静的アセットは自動的にTiered Cacheで配信される（追加設定不要）
- ETag: 200 OKレスポンスに自動付与され、ブラウザキャッシュの検証に使用される
- 自動HTTPS: SSL証明書の自動プロビジョニング・更新

---

## 3. カスタムドメイン移行

### 3.1 前提条件の確認

現状の構成:
- ドメイン: `odq-stasigin-gen.net`
- 現在のDNS: Azure SWAに紐付け
- Cloudflare: 別のWebアプリで既に利用中（= Cloudflareアカウント＋別ゾーンが存在）

重要な確認事項:
- `odq-stasigin-gen.net`のネームサーバーが既にCloudflareを向いているか、別のDNSプロバイダーを使用しているか
- 既にCloudflareを利用中であるため、アカウント作成は不要

### 3.2 移行手順（ダウンタイム最小化戦略）

#### Phase 1: 準備（Azure並行稼働中に実施）

**Step 1: Cloudflare Pagesプロジェクトの作成とデプロイ**

```bash
# ローカルでビルドしてDirect Uploadでデプロイ
npm run build
npx wrangler pages project create odq-stasigin-gen
npx wrangler pages deploy dist --project-name=odq-stasigin-gen
```

これにより`odq-stasigin-gen.pages.dev`でサイトが公開される。この時点で動作確認を完了させる。

**Step 2: `_headers`と`_redirects`の設定確認**

`pages.dev`ドメインでセキュリティヘッダーやキャッシュ設定が正しく適用されているか確認する。

```bash
curl -I https://odq-stasigin-gen.pages.dev
```

**Step 3: GitHub ActionsのCI/CDパイプラインを構築**

後述のワークフローを設定し、mainブランチへのpushで自動デプロイが動作することを確認する。

#### Phase 2: DNSの移行

**ケースA: ネームサーバーが既にCloudflareの場合**

1. Cloudflareダッシュボードで`odq-stasigin-gen.net`のゾーンに移動
2. 既存のAzure SWA向けDNSレコード（CNAMEなど）を確認
3. Pages プロジェクト → Custom domains → 「Set up a custom domain」で`odq-stasigin-gen.net`を追加
4. Cloudflareが自動でCNAMEレコードを作成（既存レコードの更新確認が求められる場合がある）
5. SSL証明書が自動プロビジョニングされる（通常5-15分）

**ケースB: ネームサーバーがCloudflare以外の場合**

1. Cloudflareダッシュボードでゾーンを追加: `odq-stasigin-gen.net`
2. Cloudflareが既存のDNSレコードを自動スキャン → 手動で漏れを確認
3. レジストラでネームサーバーをCloudflare指定のものに変更
   - DNSSECが有効な場合は先に無効化する（これを怠るとドメインが解決不能になる）
4. ネームサーバー変更の反映を待つ（通常数分〜最大24時間）
5. ゾーンのステータスが「Active」になったら、Pages Custom domainsで`odq-stasigin-gen.net`を追加

#### Phase 3: 切替確認とAzure SWA停止

1. カスタムドメインでのアクセスを確認: `curl -I https://odq-stasigin-gen.net`
2. SSL証明書が有効であることを確認
3. セキュリティヘッダーの確認
4. www → apex リダイレクトの動作確認
5. すべてOKであればAzure SWAのリソースを停止・削除

### 3.3 ダウンタイムの見積もり

ネームサーバーが既にCloudflareの場合、DNSレコードの切替は即座に反映されるため、SSL証明書のプロビジョニング時間（5-15分）を除けばほぼゼロダウンタイムで移行可能。

ネームサーバーの変更を伴う場合はDNS伝播時間（最大24時間）が必要になるが、TTLを事前に短縮しておくことでダウンタイムを最小化できる。

### 3.4 SSL/TLS設定

Cloudflare Pagesではカスタムドメインに対してUniversal SSL証明書が自動的にプロビジョニングされる。

- 証明書の発行・更新はCloudflareが完全に自動管理
- Full (Strict) SSLモードが推奨（ただしPagesはオリジンサーバーがCloudflare自身なので設定不要）
- HSTSは`_headers`ファイルで設定（前述の設定例を参照）

---

## 4. CI/CD構成

### 4.1 デプロイ方式の比較

| 観点 | wrangler CLIを直接使用 | cloudflare/wrangler-action（公式） | cloudflare/pages-action |
|------|----------------------|----------------------------------|------------------------|
| 推奨度 | ○ | ◎（推奨） | ×（非推奨・v1.5.0で開発終了） |
| メンテナンス | npm install が必要 | Action側で管理 | wrangler-actionへの移行を推奨 |
| Pages対応 | `wrangler pages deploy` | `command`で指定 | 専用だが廃止予定 |
| Workers対応 | 対応 | 対応（統一ツール） | Pages専用 |
| 出力変数 | 手動パース | deployment-url等を自動提供 | 豊富だが移行推奨 |
| バージョン管理 | package.jsonで固定 | wranglerVersion入力で指定可 | wranglerVersion入力で指定可 |

**推奨: `cloudflare/wrangler-action@v3`**

`pages-action`は非推奨（deprecated）であり、Cloudflare公式が`wrangler-action`への移行を推奨している。`wrangler-action`はPagesとWorkers両方に対応しており、将来のWorkers移行時にもそのまま使用可能。

### 4.2 GitHub Actionsワークフロー（推奨構成）

#### シークレットの準備

以下の2つをGitHubリポジトリのSecretsに設定する。

1. `CLOUDFLARE_API_TOKEN`: Cloudflareダッシュボードで作成（権限: Cloudflare Pages: Edit）
2. `CLOUDFLARE_ACCOUNT_ID`: Cloudflareダッシュボードのアカウント概要ページで確認

```bash
# GitHub CLIでの設定例
gh secret set CLOUDFLARE_API_TOKEN --body "your-api-token-here"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "your-account-id-here"
```

#### ワークフローファイル: `.github/workflows/deploy.yml`

```yaml
name: Build & Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  deployments: write
  pull-requests: write

jobs:
  # -----------------------------------------------
  # Job 1: Lint & Test
  # -----------------------------------------------
  lint-and-test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint --if-present

      - name: Type check
        run: npm run type-check --if-present

      - name: Test
        run: npm test --if-present

  # -----------------------------------------------
  # Job 2: Build & Deploy
  # -----------------------------------------------
  deploy:
    needs: lint-and-test
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Cloudflare Pages
        id: deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=odq-stasigin-gen --branch=${{ github.head_ref || github.ref_name }}

      - name: Output deployment URL
        run: echo "Deployed to ${{ steps.deploy.outputs.deployment-url }}"

      # PR へのコメント（プレビューURLを通知）
      - name: Comment preview URL on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployed: ${{ steps.deploy.outputs.deployment-url }}`
            })
```

**ワークフローの解説:**

- `push`でmainブランチにマージされるとproduction deploymentとなる
- `pull_request`で作成・更新されるとpreview deploymentとなる
- `--branch=${{ github.head_ref || github.ref_name }}`により、PRのブランチ名が自動的にCloudflare Pagesに渡される。mainの場合はproduction、それ以外はpreviewとして扱われる
- `deployment-url`出力を使用してPRにプレビューURLをコメントする
- lint→test→build→deploy の順序でパイプラインが実行され、前段で失敗すると後段は実行されない

### 4.3 出力ディレクトリの対応表

| フレームワーク | ビルドコマンド | 出力ディレクトリ |
|------------|-------------|--------------|
| Vite | `npm run build` | `dist` |
| Next.js (static) | `npm run build` | `out` |
| Create React App | `npm run build` | `build` |
| Vanilla (ビルドなし) | `exit 0` | `.`（プロジェクトルート） |

ワークフローの`dist`部分を実際の出力ディレクトリに合わせて変更すること。

---

## 5. 設定ファイル一覧（まとめ）

### 最終的なプロジェクト構成

```
project-root/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions ワークフロー
├── public/
│   ├── _headers                    # セキュリティ・キャッシュヘッダー
│   ├── _redirects                  # リダイレクトルール（必要に応じて）
│   ├── fonts/                      # Webフォント
│   ├── images/                     # 静的画像
│   ├── favicon.ico
│   └── robots.txt
├── src/                            # アプリケーションソース
├── package.json
└── README.md
```

### Cloudflareダッシュボードでの手動設定項目

| 設定項目 | 場所 | 内容 |
|---------|------|------|
| Pagesプロジェクト作成 | Workers & Pages | Direct Upload方式で作成 |
| カスタムドメイン | Pages → Custom domains | `odq-stasigin-gen.net` を追加 |
| www → apex リダイレクト | Account → Bulk Redirects | `www.odq-stasigin-gen.net` → `https://odq-stasigin-gen.net` (301) |
| www DNS レコード | DNS → Records | `www` AAAA `100::` (Proxied) |
| プレビューアクセス制御 | Pages → Settings → General | Cloudflare Access（必要に応じて） |

---

## 6. 将来のWorkers移行に備えた考慮事項

Cloudflare PagesからWorkersへの移行は、公式のマイグレーションガイドが整備されている。移行時の主な変更点は以下の通り。

**設定ファイルの変更:**

```jsonc
// wrangler.jsonc（Workers版）
{
  "name": "odq-stasigin-gen",
  "compatibility_date": "2026-06-01",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}
```

**`_headers`と`_redirects`:** Workers Static Assetsでも同じ`_headers`/`_redirects`ファイルが使用可能。

**GitHub Actionsの変更:** `wrangler pages deploy`を`wrangler deploy`に変更するだけで基本的に対応可能。`wrangler-action`を使用していればActionの変更も最小限で済む。

**プレビューURL:** Workers版でも2025年7月以降、ブランチごとのプレビューURL機能が追加されており、Pages同等の開発体験が得られる。

---

## 7. チェックリスト

### 移行前

- [ ] Cloudflare Pagesプロジェクトを作成（Direct Upload方式）
- [ ] `_headers`ファイルを作成し、セキュリティヘッダーを設定
- [ ] `pages.dev`ドメインで動作確認
- [ ] GitHub Actionsワークフローを作成・テスト
- [ ] PRでのプレビューデプロイが動作することを確認

### DNS移行時

- [ ] DNSSECが有効な場合は無効化
- [ ] ネームサーバーがCloudflareでない場合は変更
- [ ] ゾーンのステータスが「Active」になるまで待機
- [ ] Pagesプロジェクトにカスタムドメインを追加
- [ ] SSL証明書のプロビジョニングを確認
- [ ] www用のDNSレコード追加（AAAA `100::` Proxied）
- [ ] Bulk Redirectsでwww→apexリダイレクトを設定

### 移行後

- [ ] `https://odq-stasigin-gen.net` で正常にアクセスできること
- [ ] `https://www.odq-stasigin-gen.net` が `https://odq-stasigin-gen.net` に301リダイレクトされること
- [ ] セキュリティヘッダーが正しく付与されていること（`curl -I`で確認）
- [ ] CSP違反がないこと（ブラウザのDevToolsコンソールで確認）
- [ ] キャッシュヘッダーがリソースタイプごとに正しく設定されていること
- [ ] Early Hintsが動作していること（Chrome DevTools → Network → Timingで確認）
- [ ] Azure SWAのリソースを削除

---

## 参考リンク

- Cloudflare Pages ドキュメント: https://developers.cloudflare.com/pages/
- _headers 設定: https://developers.cloudflare.com/pages/configuration/headers/
- _redirects 設定: https://developers.cloudflare.com/pages/configuration/redirects/
- カスタムドメイン: https://developers.cloudflare.com/pages/configuration/custom-domains/
- プレビューデプロイ: https://developers.cloudflare.com/pages/configuration/preview-deployments/
- Early Hints: https://developers.cloudflare.com/pages/configuration/early-hints/
- www リダイレクト: https://developers.cloudflare.com/pages/how-to/www-redirect/
- Direct Upload + CI: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
- wrangler-action: https://github.com/cloudflare/wrangler-action
- Pages → Workers移行: https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
