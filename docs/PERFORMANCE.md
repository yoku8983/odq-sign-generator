# パフォーマンス検証結果

## 測定日

2026-06-27

## バンドルサイズ

Vite v8.1.0 プロダクションビルド出力:

| 資産 | サイズ | gzip |
|------|--------|------|
| JS (`index-*.js`) | 77.14 kB | 25.12 kB |
| CSS (`index-*.css`) | 4.35 kB | 1.32 kB |
| HTML (`index.html`) | 1.35 kB | 0.59 kB |
| **JS + CSS + HTML 合計** | **82.84 kB** | **27.03 kB** |

## 静的アセット

| 資産 | サイズ | 備考 |
|------|--------|------|
| Mplus2c-Medium.woff2 | 455 kB | 日本語フォント（サブセット済み） |
| VialogLT-Regular.woff2 | 24 kB | ラテン文字フォント |
| Frutiger-Bold.woff2 | 20 kB | ラテン文字フォント |
| background.png | 1.4 kB | 駅名標背景 |
| badgelogo.png | 20 kB | OGP画像 |
| favicon.ico | 6.6 kB | ファビコン |
| **アセット合計** | **527 kB** | |

## ページ総サイズ

| 項目 | サイズ |
|------|--------|
| dist/ 全体 | 607 kB (12ファイル) |
| 初回ロード転送量（推定） | ~555 kB |

gzip転送を考慮した初回ロード内訳:
- JS/CSS/HTML: ~27 kB (gzip)
- フォント3種: ~499 kB (woff2は既に圧縮済み、追加gzipの効果は限定的)
- 背景画像: ~1.4 kB
- favicon: ~6.6 kB
- badgelogo.png: ページ表示には不要（OGP用のみ）

## 最適化施策と効果

| 施策 | 効果 |
|------|------|
| フォント woff2 化 + サブセット | TTF 1.43 MB → woff2 498 KB（**65% 削減**） |
| `<link rel="preload">` (fonts + background) | フォントロード並列化、LCP 改善 |
| FontFace API 非同期ロード | レンダリングブロック回避 |
| ES2023 ビルドターゲット | 不要なポリフィル除去 |
| modulePreload polyfill 除去 | 余計な JS 除去 |
| console / debugger 除去 | 本番バンドル軽量化 |
| immutable キャッシュ (fonts/assets) | リピートアクセスで転送量ゼロ（1年間） |
| HTML `no-cache` | 常に最新版を配信 |
| 二分探索フォントサイズ最適化 | Canvas 描画の `measureText` 呼び出し 最大92回 → 3〜7回 |
| `toBlob`（`toDataURL` 廃止） | 画像保存時のメモリ効率改善（Base64 の 33% 増加を回避） |

## パフォーマンス特性の評価

### 良好な点

- **JS バンドル 25 kB gzip** — SPA としては極めて軽量。React/Vue の一般的なアプリ（100〜300 kB gzip）と比較して 1/4 以下
- **外部依存ゼロ** — Canvas ライブラリ、UI フレームワーク CDN、SNS SDK 不使用。CSP `default-src 'self'` でサードパーティリソース完全排除
- **CLS リスク最小** — Canvas は固定アスペクト比、レイアウトは静的 HTML フォーム。レイアウトシフトの要因なし
- **TBT リスク最小** — JS 実行量が少なく、Canvas 描画は `requestAnimationFrame` で非ブロッキング
- **リピートアクセス高速** — フォント・画像・JS/CSS すべて `immutable` 1年キャッシュ。2回目以降は HTML（~0.6 kB gzip）のみ転送

### 注意点

- **フォント 499 kB** がページ重量の 90% を占める。Mplus2c（日本語フォント）455 kB が大部分
  - 既にサブセット化済み（TTF 1.01 MB → woff2 455 kB）
  - 駅名標に必要な漢字セットのため、これ以上の削減は表示品質とトレードオフ
- **Canvas 描画完了がフォントロード依存** — フォントが未ロードの状態で Canvas に描画するとフォールバックフォントで表示される。`loadFonts()` で `await document.fonts.ready` してから描画開始することで対応済み

## PageSpeed Insights 手動測定手順

PSI API のクォータ制限により自動測定不可。以下の手順で手動測定を推奨:

1. [PageSpeed Insights](https://pagespeed.web.dev/) にアクセス
2. URL `https://odq-stasigin-gen.net` を入力して分析
3. デスクトップ / モバイル両方のスコアを確認

### 期待されるスコア

| 指標 | デスクトップ（期待値） | モバイル（期待値） |
|------|----------------------|-------------------|
| Performance | 90〜100 | 80〜95 |
| FCP | < 1.0s | < 2.0s |
| LCP | < 1.5s | < 3.0s |
| TBT | < 50ms | < 200ms |
| CLS | ≈ 0 | ≈ 0 |

期待値の根拠:
- JS 25 kB gzip + CSS 1.3 kB gzip は FCP/TBT に対して非常に軽量
- フォント 499 kB は preload ヒントにより並列ダウンロード、LCP への影響は限定的
- Cloudflare Pages CDN によるエッジ配信で物理的遅延を最小化

## バンドル分析

`npm run analyze` で `dist/bundle-stats.html` を生成し、モジュール別サイズを確認可能。

```bash
npm run analyze    # dist/bundle-stats.html を生成
```
