# 調査1/4: フレームワーク選定

> 調査日: 2026-06-27
> 対象: 小田急電鉄風 駅名標画像生成 静的Webアプリ リライト

---

## 推奨案: Svelte 5（単体）+ Vite

**SvelteKit は使わない。** Svelte 5 を Vite テンプレート（`npm create vite@latest -- --template svelte-ts`）で直接使用する。

### 推奨理由

1. **Canvas再描画パターンとの最高の相性**
   — Svelte 5 の `$effect()` は依存する `$state` が変化すると自動で再実行される。Canvas の `bind:this` と組み合わせると、11項目のフォーム入力→Canvas再描画のパイプラインが宣言的に書ける。React系の `useEffect` + 依存配列の手動管理が不要。

2. **最小バンドルサイズ**
   — コンパイラベースのため、シンプルなアプリで gzip 後 3〜5KB。ランタイム部分は約 2〜3KB（min+gzip）。静的サイト配信で最も有利。

3. **フォーム→状態の双方向バインド**
   — `bind:value={stationName}` で入力とリアクティブ変数が直結。11項目 + 表示フラグのバインドがボイラープレートなしで完了する。

4. **テスト可能なモジュール分割**
   — Svelte 5 の Runes は `.svelte.ts` ファイルでも使えるため、描画ロジック・データモデル・バリデーションをコンポーネント外に切り出してユニットテスト可能。

5. **Cloudflare Pages との相性**
   — Vite ビルドで `dist/` を生成 → CF Pages に直接デプロイ。adapter-static や adapter-cloudflare などのメタフレームワーク設定は不要。

6. **SvelteKit を使わない理由**
   — ルーティング不要（SPA 1ページ）、SSR 不要、サーバーサイド処理なし。SvelteKit の adapter 設定・ファイルベースルーティング・SSR/hydration は全て不要なオーバーヘッド。

---

## 各候補 Pros / Cons 比較表

### バンドルサイズ

| 候補 | コアサイズ (min+gzip) | 実アプリ目安 | 評価 |
|------|----------------------|-------------|------|
| バニラJS + Vite | 0KB (フレームワークなし) | アプリコードのみ | ◎ |
| Svelte 5 + Vite | 2〜3KB | 3〜12KB | ◎ |
| Preact | 3KB (compat込 4〜5KB) | 8〜20KB | ○ |
| Solid.js | 7.6KB | 15〜25KB | ○ |
| SvelteKit (adapter-static) | 2〜3KB + Kit runtime | 15〜30KB | △ |

### Canvas API との相性

| 候補 | 再描画パターン | 特徴 |
|------|---------------|------|
| バニラJS + Vite | 手動イベントリスナー → redraw() | 最も直接的だが、入力数が増えると配線が煩雑 |
| Svelte 5 + Vite | `$effect(() => draw(ctx, state))` | **state変更で自動再描画。依存追跡がコンパイル時に解決** |
| Preact | `useEffect(() => draw(), [deps])` | 依存配列を手動管理。配列漏れで再描画されないバグが起きやすい |
| Solid.js | `createEffect(() => draw())` | 自動依存追跡（Svelteと同等）。JSX内でのcanvas ref取得が必要 |
| SvelteKit | Svelte 5 と同じ | 同上だがKit固有のライフサイクル（load等）が余分 |

### 状態管理（11項目 + 表示フラグ → 描画反映）

| 候補 | 仕組み | 複数コンポーネント間共有 |
|------|--------|----------------------|
| バニラJS + Vite | 自前実装（EventTarget / Proxy / pub-sub） | 手動配線 |
| Svelte 5 + Vite | `$state` / `$derived` runes | `.svelte.ts` ファイルで export → 任意コンポーネントから import |
| Preact | useState / Signals | Signals は first-party だが core 外。Context API で共有 |
| Solid.js | createSignal / createStore | createContext で共有。Store はネストオブジェクト対応 |
| SvelteKit | Svelte 5 と同じ + page data | load 関数は不要 |

### Cloudflare Pages との親和性

| 候補 | デプロイ方法 | 設定量 | 備考 |
|------|------------|--------|------|
| バニラJS + Vite | `vite build` → `dist/` | 最小 | ビルドコマンドと出力ディレクトリ指定のみ |
| Svelte 5 + Vite | 同上 | 最小 | 同上 |
| Preact + Vite | 同上 | 最小 | 同上 |
| Solid.js + Vite | 同上 | 最小 | 同上 |
| SvelteKit | adapter-static or adapter-cloudflare | 中 | svelte.config.js でアダプタ設定が必要 |

※ Svelte/Preact/Solid いずれも Vite テンプレート経由なら CF Pages へのデプロイ方法は同一。差は出ない。

### 学習コスト（AI生成 + 人間保守 前提）

| 候補 | 学習コスト | AI コード生成の品質 | 備考 |
|------|-----------|-------------------|------|
| バニラJS + Vite | 低（言語知識のみ） | 高 | ただし設計パターンを自力で決める必要あり |
| Svelte 5 + Vite | **低〜中** | **高** | .svelte は HTML の延長。Runes は少数の API。Svelte MCP が公式提供 |
| Preact | 中 | 高（React知識が流用可） | React との微妙な差異がバグ源になりうる |
| Solid.js | 中〜高 | 中 | React に似て非なる挙動（コンポーネント1回実行等）。AI が React パターンを混入しやすい |
| SvelteKit | 中 | 高 | ルーティング・ロード関数など不要概念の学習コストが無駄 |

### 将来拡張性

| 候補 | コンポーネント分割 | データモデル拡張 | 備考 |
|------|------------------|----------------|------|
| バニラJS + Vite | ESM でファイル分割は可能。UIコンポーネント化は手動 | JS オブジェクトで自由 | 規模が大きくなるとUI層の管理が困難 |
| Svelte 5 + Vite | **自然なコンポーネント境界。slot/snippet で合成可能** | **$state でリアクティブなネストオブジェクト対応** | 分岐駅・複数路線を子コンポーネントとして追加しやすい |
| Preact | React 同様のコンポーネントモデル | Context + Signals | エコシステムは大きいが Preact 固有の制約あり |
| Solid.js | コンポーネントモデルあり | createStore でネスト対応 | エコシステムが小さく UI ライブラリ選択肢が限られる |

---

## 各候補の詳細評価

### 1. バニラJS（ESM）+ Vite

**Pros**
- フレームワーク依存ゼロ。バンドルサイズ最小
- Canvas API を直接操作する現行コードとの親和性が高い
- Vite の HMR + ESM でモダンな開発体験は確保可能
- 学習コストなし（言語そのもの）

**Cons**
- リアクティブ状態管理を自前実装する必要がある（11入力 + フラグ → Canvas redraw の配線）
- UI コンポーネント化の仕組みがなく、DOM 操作が手続き的になる
- 現行コードの問題（全コードが1クロージャ内）を構造的に解決する道具が足りない
- テンプレート（HTML生成）層が貧弱。フォーム部分の記述量が多い

**総評: △** — 現行334行規模なら成立するが、分岐駅・複数路線への拡張時にUI層の管理が破綻しやすい。リアクティブ配線の自前実装はリライト動機の「状態管理層不在」を十分に解決しない。

### 2. Svelte 5 + Vite（★推奨）

**Pros**
- コンパイラ方式で最小クラスのバンドル（gzip 3〜5KB）
- `$state` + `$effect` による宣言的 Canvas 再描画が自然
- `bind:value` で11項目のフォームバインドがボイラープレートなし
- `.svelte.ts` でロジックをコンポーネント外に切り出し可能（テスト容易性）
- 開発者満足度 93%（State of JS 2025）、学習曲線が緩やか
- Svelte 5 は 2024年10月安定版リリース、2026年6月現在 v5.56.x で成熟
- Svelte MCP が公式提供され AI ツールとの統合も進んでいる

**Cons**
- npm エコシステムは React より小さい（ただし本プロジェクトでは外部UIライブラリ不要）
- Svelte 独自の構文（.svelte ファイル、Runes）への習熟が必要
- Canvas 操作自体は命令的 API のため、Svelte のテンプレート構文の恩恵は間接的

**総評: ◎** — プロジェクト特性（小規模SPA・Canvas中心・静的サイト・個人開発）に最もフィット。

### 3. Preact

**Pros**
- 3KB gzip で React 互換 API を提供
- React エコシステムの一部ライブラリを `preact/compat` 経由で利用可能
- Shopify が UI extensions で公式採用（実績あり）
- Signals が first-party ライブラリとして提供

**Cons**
- Preact 11 beta が進行中で安定版は 10.x 系。2026年1月にセキュリティパッチあり
- `preact/compat` を使うと 4〜5KB に膨張し、Svelte との差が縮まる
- React 19 の `use()` 等の新機能は非サポート
- Canvas パターンは `useEffect` + 依存配列の手動管理が必要
- preact-cli は非推奨化済み、preact-router も停滞中

**総評: ○** — 悪い選択ではないが、React 互換であることのメリットがこのプロジェクトではほぼ活きない（React ライブラリを使う場面がない）。

### 4. Solid.js

**Pros**
- 細粒度リアクティビティで Canvas 再描画との相性は Svelte と同等に良い
- 7.6KB gzip でバンドルサイズ小
- TypeScript 統合が優秀
- シグナルの概念を Angular 等に広めた影響力のあるフレームワーク

**Cons**
- エコシステムが小さい（npm 使用プロジェクト 1,283 件）
- Solid 2.0 が experimental 開発中で移行リスクあり
- JSX ベースのため、HTML に近い記述を好む場合は Svelte より冗長
- AI がReact パターンと混同しやすい（見た目が似て挙動が異なる）
- SolidStart (meta-framework) は alpha 段階

**総評: ○** — 技術的には優秀だが、エコシステムの小ささと Solid 2.0 移行の不確実性がリスク。

### 5. SvelteKit（adapter-static）

**Pros**
- Svelte 5 の全メリットを享受
- 公式 adapter-cloudflare / adapter-static で CF Pages 対応
- 将来ルーティングや SSR が必要になった場合にそのまま拡張可能

**Cons**
- 本プロジェクトではルーティング・SSR・サーバーサイドロード関数が全て不要
- アダプタ設定（svelte.config.js）、ファイルベースルーティング構造が冗長
- ビルドチェーンが Svelte + Vite 単体より複雑

**総評: △** — オーバーキル。SPA1ページのアプリに meta-framework は不要。

---

## 推奨案のプロジェクト構成例

```
odakyu-station-sign/
├── index.html                    # エントリポイント（Vite が処理）
├── vite.config.ts                # Vite 設定
├── tsconfig.json                 # TypeScript 設定
├── package.json
│
├── src/
│   ├── main.ts                   # アプリ起動（mount）
│   ├── App.svelte                # ルートコンポーネント
│   │
│   ├── components/
│   │   ├── StationSignCanvas.svelte   # Canvas 描画コンポーネント
│   │   ├── InputPanel.svelte          # フォーム入力パネル
│   │   ├── ExportControls.svelte      # ダウンロード・エクスポート
│   │   └── PreviewControls.svelte     # 表示フラグ切替
│   │
│   ├── lib/
│   │   ├── state.svelte.ts       # リアクティブ状態（$state）定義
│   │   ├── renderer.ts           # Canvas 描画ロジック（純粋関数、テスト可能）
│   │   ├── layout.ts             # レイアウト計算エンジン
│   │   ├── models.ts             # データモデル型定義
│   │   └── validators.ts         # 入力バリデーション
│   │
│   ├── styles/
│   │   └── global.css            # グローバルスタイル
│   │
│   └── assets/
│       └── fonts/                # 駅名標用フォント
│
├── tests/
│   ├── renderer.test.ts          # 描画ロジックのユニットテスト
│   ├── layout.test.ts            # レイアウト計算テスト
│   └── validators.test.ts        # バリデーションテスト
│
├── public/
│   └── favicon.svg
│
└── .github/
    └── workflows/
        └── deploy.yml            # GitHub Actions → CF Pages デプロイ
```

### 構成のポイント

**`src/lib/state.svelte.ts`** — アプリ全体の状態を一元管理。`.svelte.ts` 拡張子により Runes が使用可能。コンポーネントから import して参照・更新する。

```typescript
// src/lib/state.svelte.ts
import type { StationData } from './models';

export const stationData: StationData = $state({
  stationName: '',
  stationNameKana: '',
  stationNameRomaji: '',
  lineColor: '#1e44a3',
  prevStation: '',
  nextStation: '',
  // ... 残りの項目
});

export const displayFlags = $state({
  showPrevStation: true,
  showNextStation: true,
  showStationNumber: true,
});
```

**`src/lib/renderer.ts`** — Canvas 描画は純粋関数として実装。`$state` への依存なし。引数でデータを受け取り Canvas に描画するだけなので、Node.js 環境でもテスト可能。

```typescript
// src/lib/renderer.ts
import type { StationData, DisplayFlags } from './models';

export function drawStationSign(
  ctx: CanvasRenderingContext2D,
  data: StationData,
  flags: DisplayFlags,
  scale: number = 2  // Retina 対応
): void {
  // 描画ロジック（テスト可能な純粋関数）
}
```

**`StationSignCanvas.svelte`** — 状態と描画を接続するだけの薄いコンポーネント。

```svelte
<script lang="ts">
  import { stationData, displayFlags } from '$lib/state.svelte';
  import { drawStationSign } from '$lib/renderer';

  let canvas: HTMLCanvasElement;

  $effect(() => {
    const ctx = canvas.getContext('2d')!;
    const scale = window.devicePixelRatio ?? 2;
    drawStationSign(ctx, stationData, displayFlags, scale);
  });
</script>

<canvas bind:this={canvas}></canvas>
```

### デプロイ設定

**Cloudflare Pages:**
- Build command: `npm run build`
- Build output directory: `dist`
- Framework preset: なし（Vite 汎用）

**GitHub Actions (.github/workflows/deploy.yml):**
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          command: pages deploy dist --project-name=odakyu-station-sign
          apiToken: ${{ secrets.CF_API_TOKEN }}
```

---

## まとめ

| 評価軸 | 最適候補 |
|--------|---------|
| バンドルサイズ | バニラJS > Svelte 5 > Preact > Solid.js |
| Canvas API 相性 | Svelte 5 ≒ Solid.js > Preact > バニラJS |
| 状態管理 | Svelte 5 > Solid.js > Preact > バニラJS |
| CF Pages 親和性 | 全候補同等（Vite 経由） |
| 学習コスト | バニラJS > Svelte 5 > Preact > Solid.js |
| 将来拡張性 | Svelte 5 ≒ Preact ≒ Solid.js > バニラJS |
| **総合** | **Svelte 5 + Vite** |

Svelte 5（SvelteKit なし）+ Vite が、このプロジェクトの全評価軸でバランスよく最上位に位置する。
