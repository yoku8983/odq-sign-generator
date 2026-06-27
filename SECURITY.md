# Security Policy

## Reporting Vulnerabilities

セキュリティに関する問題を見つけた場合は、GitHub Issues ではなく [Private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) を使用してください。

リポジトリの「Security」タブ → 「Report a vulnerability」から非公開で報告できます。

## セキュリティ上の考慮事項

### セキュリティヘッダー

Cloudflare Pages の `public/_headers` で以下を設定:

- `Content-Security-Policy: default-src 'self'` — 外部スクリプト・スタイル・フォント・接続を排除
- `X-Frame-Options: DENY` — クリックジャッキング防止
- `Strict-Transport-Security` — HTTPS強制（preload対応）
- `Permissions-Policy` — カメラ・マイク・位置情報・決済APIを全拒否
- `X-Content-Type-Options: nosniff` — MIMEスニッフィング防止

### 入力バリデーション

- ユーザー入力（駅名・ひらがな・ローマ字・駅番号）はCanvas 2D APIの `fillText` でのみ使用
- HTMLとしてレンダリングしないため、DOM injection / XSSのリスクなし

### サードパーティリソース

- 外部SDK・CDN・APIを一切使用しない完全自己完結型の静的サイト
- SNSシェアはintent URLとWeb Share APIのみ（外部JavaScriptの読み込みなし）
- CSP `default-src 'self'` によりサプライチェーン攻撃のリスクを最小化

### デプロイシークレット

- `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` はGitHub Actions Secretsで管理し、アプリケーションコードには含まれない

### 依存関係

- ランタイム依存なし（devDependenciesのみ）。ビルド成果物に脆弱なnpmパッケージが含まれるリスクは低い
- `npm audit` で定期的に脆弱性チェック
