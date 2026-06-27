# 調査結果: Canvas描画の設計パターン

## プロジェクト概要

小田急電鉄風の駅名標画像をブラウザ上で生成する静的Webアプリをゼロベースでリライトするにあたり、Canvas描画の設計パターンについて調査を行った。

- 現行: バニラHTML/CSS/JS（script.js 334行）、Canvas 2D API直叩き
- 描画内容: 背景画像の上に、中央駅名（漢字・ひらがな・ローマ字）、左右の前後駅名（漢字・ローマ字）、路線記号＋駅番号の角丸矩形ナンバリングを配置
- カスタムフォント3種（日本語用、ローマ字用、ナンバリング用）
- Canvas解像度は現行1200px固定

### 現行の問題

- 全座標がLAYOUT定数にピクセル値ハードコード（`y: 115, fontSize: 100, maxWidth: 750`等）
- `POSITION_DIVISOR: 40`のような除算マジックナンバーで位置計算
- Canvas幅を変えると全座標が破綻
- テキスト自動縮小は1pxずつwhileループで縮小（非効率）
- drawText後のctx.font状態依存でバグポテンシャルあり

---

## 1. Canvas描画ライブラリの採用是非

### 結論: ライブラリ不採用。素のCanvas 2D API＋薄い自作ラッパーを推奨。

### 各ライブラリの特性と本プロジェクトとの適合性

| ライブラリ | バンドルサイズ (min+gzip) | 主な用途 | 週間DL数 |
|---|---|---|---|
| Konva.js v9.x | ~55 KB | インタラクティブUI、ダッシュボード | ~400K |
| Fabric.js v6.x | ~90-100 KB | デザインエディタ、画像編集 | ~500K |
| PixiJS v8.x | ~100 KB+ | WebGLゲーム、高パフォーマンス描画 | ~200K |

**Fabric.js** はCanvas上にオブジェクトモデルを提供し、SVGパース、ドラッグ＆ドロップ、リサイズ、画像フィルタ、テキスト編集に特化したデザインツール向けライブラリ。v6ではTypeScript定義がファーストクラスで同梱され、`import { Canvas, Rect } from "fabric"` によるツリーシェイキングも可能。

**Konva.js** はCanvas 2D APIの上にオブジェクトモデル、イベントバブリング付きのイベントシステム、ドラッグ＆ドロップ、リサイズ・回転ハンドル（Transformer）、シリアライズ機能を提供。React/Vue/Svelte/Angularの公式バインディングを持つ。

**PixiJS** はWebGLを使った高パフォーマンス2Dレンダラーで、ゲームやビジュアライゼーション向け。スプライト、フィルタ、パーティクルエフェクトに強い。

### なぜオーバースペックと判断するか

このプロジェクトの要件は「背景画像の上に10個程度のテキスト・図形を配置し、静的な画像1枚を生成する」というもの。ユーザーがキャンバス上のオブジェクトをドラッグしたりリサイズする必要はなく、フォーム入力→描画→画像出力というフロー。

Konva.jsが解決する問題は「Canvas上のインタラクティブな2Dグラフィクス」であり、ユーザーがクリック、ドラッグ、リサイズ、または図形を操作する必要がある場合に真価を発揮する。本プロジェクトではその機能が不要。

オープンソースのcanvas/描画ライブラリは高度にカスタマイズされたエディタを構築するためのものであり、洗練されたUI・ワークフロー・エディタロジックをゼロから構築する開発リソースがある場合に選択すべきで、静的な画像生成には大げさすぎる。

### 推奨: 薄い自作ラッパー（~150行程度）で十分

具体的に必要なのは以下だけ:

- レイアウト定義をJSONライクなオブジェクトとして宣言
- 正規化座標 → ピクセル座標への変換
- フォントサイズの自動調整
- Retina対応のCanvas初期化

これらは自作しても200行未満に収まり、バンドルサイズ増加もゼロ。

---

## 2. 宣言的レイアウトの実現方法

### 推奨アプローチ: 「設計座標系（Design Coordinate System）」パターン

Canvasには本来「モデル座標系」と「表示座標系」の2つの座標系がある。JavaScript描画コマンドが使うモデル座標と、ウェブページ上での表示サイズを分離することで、表示されるCanvasのサイズを変えてもモデル座標は影響を受けず、異なるデバイスサイズでも同じJavaScriptコードで駆動できる。

この考え方を発展させ、以下の3層構造にする。

### 層1: 正規化座標によるレイアウト定義（0〜1）

```js
// すべての座標を0〜1の比率で定義
const LAYOUT = {
  stationName: {
    x: 0.5,           // 中央 = Canvas幅の50%
    y: 0.38,           // 上から38%の位置
    fontSize: 0.083,   // Canvas幅の8.3% (= 現行100px/1200px)
    maxWidth: 0.625,   // Canvas幅の62.5% (= 現行750px/1200px)
    fontFamily: 'StationFont',
    textAlign: 'center',
    textBaseline: 'middle',
  },
  hiragana: {
    x: 0.5,
    y: 0.22,           // 駅名の上
    fontSize: 0.033,
    maxWidth: 0.5,
    fontFamily: 'StationFont',
  },
  romaji: {
    x: 0.5,
    y: 0.54,           // 駅名の下
    fontSize: 0.029,
    maxWidth: 0.5,
    fontFamily: 'RomajiFont',
  },
  prevStation: {
    x: 0.13,
    y: 0.38,
    fontSize: 0.025,
    maxWidth: 0.17,
  },
  nextStation: {
    x: 0.87,
    y: 0.38,
    fontSize: 0.025,
    maxWidth: 0.17,
  },
  numbering: {
    x: 0.12,            // 左寄り
    y: 0.72,
    width: 0.075,
    height: 0.11,
    cornerRadius: 0.015,
  },
};
```

### 層2: 座標変換ユーティリティ

```js
class LayoutResolver {
  constructor(canvasWidth, canvasHeight) {
    this.w = canvasWidth;
    this.h = canvasHeight;
  }
  
  // 正規化値 → ピクセル値
  x(ratio) { return ratio * this.w; }
  y(ratio) { return ratio * this.h; }
  
  // フォントサイズは幅基準で統一（アスペクト比固定前提）
  fontSize(ratio) { return ratio * this.w; }
  
  // レイアウト定義を一括解決
  resolve(elementDef) {
    return {
      x: this.x(elementDef.x),
      y: this.y(elementDef.y),
      fontSize: elementDef.fontSize ? this.fontSize(elementDef.fontSize) : undefined,
      maxWidth: elementDef.maxWidth ? this.x(elementDef.maxWidth) : undefined,
      width: elementDef.width ? this.x(elementDef.width) : undefined,
      height: elementDef.height ? this.y(elementDef.height) : undefined,
    };
  }
}
```

### 層3: 描画関数

```js
function renderSign(ctx, layout, resolver, data) {
  // 各要素を宣言的に描画
  const elements = [
    { def: layout.stationName, text: data.stationKanji, font: 'StationFont' },
    { def: layout.hiragana,    text: data.hiragana,     font: 'StationFont' },
    { def: layout.romaji,      text: data.romaji,       font: 'RomajiFont' },
    // ...
  ];
  
  for (const el of elements) {
    const resolved = resolver.resolve(el.def);
    drawFittedText(ctx, el.text, resolved, el.font);
  }
  
  // ナンバリング角丸矩形
  const numPos = resolver.resolve(layout.numbering);
  drawRoundedRect(ctx, numPos, data.lineColor);
  drawFittedText(ctx, data.stationNumber, numPos, 'NumberFont');
}
```

### Canvas幅変更時の自動スケーリング

```js
// Canvas幅を変えても描画コードは一切変更不要
function generateSign(width, data) {
  const aspectRatio = 400 / 1200; // 現行の高さ/幅比
  const height = width * aspectRatio;
  const resolver = new LayoutResolver(width, height);
  // ...あとは同じ描画コード
}

generateSign(1200, data); // 現行サイズ
generateSign(2400, data); // 2倍サイズ
generateSign(800, data);  // 小さめ
```

### 要素間の相対配置が必要な場合

ナンバリングの位置を駅名の幅に応じて動かす場合は、計算済みのメトリクスを参照する仕組みを追加する。

```js
function resolveRelativePositions(ctx, layout, resolver, data) {
  // 駅名の実測幅を取得
  const nameResolved = resolver.resolve(layout.stationName);
  const fittedSize = fitFontSize(ctx, data.stationKanji, 
    nameResolved.fontSize, nameResolved.maxWidth, 'StationFont');
  ctx.font = `${fittedSize}px StationFont`;
  const actualWidth = ctx.measureText(data.stationKanji).width;
  
  // ナンバリング位置を駅名の左端に合わせる
  const nameLeft = nameResolved.x - actualWidth / 2;
  return {
    ...layout,
    numbering: {
      ...layout.numbering,
      x: (nameLeft - resolver.x(layout.numbering.width) - resolver.x(0.02)) / resolver.w,
    },
  };
}
```

### このプロジェクト規模でのラインの考え方

正規化座標の定義と`LayoutResolver`だけで十分。フレックスボックス的な自動配置やコンストレイントソルバーは不要で、要素位置は固定的（駅名標のレイアウトは決まっている）なので、比率ベースの座標定義だけで全要件をカバーできる。

---

## 3. Retina対応

### ベストプラクティス: 3ステップ

確立された手法は、`devicePixelRatio`を使い、Canvasの内部描画サイズをCSSサイズ×DPRに設定し、`context.scale(dpr, dpr)`で描画操作をスケーリングし、CSSで元のサイズに表示を縮小するというもの。

MDNの公式ドキュメントでも、`canvas.width = Math.floor(size * scale)`、`canvas.height = Math.floor(size * scale)`でCanvasの実際のサイズをメモリ上で設定し、`ctx.scale(scale, scale)`で座標系を正規化する方法が示されている。

### 実装パターン

```js
function createHiDPICanvas(cssWidth, cssHeight, targetDPR = null) {
  const dpr = targetDPR || window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  
  // 内部解像度 = CSS表示サイズ × DPR
  canvas.width = Math.floor(cssWidth * dpr);
  canvas.height = Math.floor(cssHeight * dpr);
  
  // CSS表示サイズを固定
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  
  const ctx = canvas.getContext('2d');
  // 描画座標系をCSSピクセル基準に統一
  ctx.scale(dpr, dpr);
  
  return { canvas, ctx, dpr, cssWidth, cssHeight };
}
```

### 画像出力時の解像度選択

駅名標画像の出力では、表示用と出力用で異なるDPRを使い分けるのが実用的。

```js
function exportSignImage(data, layout, options = {}) {
  const {
    outputWidth = 1200,      // 出力画像の横幅
    pixelRatio = 2,          // 出力倍率（1x/2x/3x）
    format = 'image/png',
    quality = 1.0,
  } = options;
  
  const aspectRatio = 400 / 1200;
  const outputHeight = outputWidth * aspectRatio;
  
  // 出力専用Canvasを生成（CSS表示サイズとは無関係）
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth * pixelRatio;
  canvas.height = outputHeight * pixelRatio;
  
  const ctx = canvas.getContext('2d');
  ctx.scale(pixelRatio, pixelRatio);
  
  // 描画（outputWidth × outputHeight の座標系で描画）
  const resolver = new LayoutResolver(outputWidth, outputHeight);
  renderSign(ctx, layout, resolver, data);
  
  // Blob出力（大きな画像でも安全）
  return new Promise((resolve) => {
    canvas.toBlob(resolve, format, quality);
  });
}

// 使用例
const blob1x = await exportSignImage(data, LAYOUT, { pixelRatio: 1 }); // 1200×400
const blob2x = await exportSignImage(data, LAYOUT, { pixelRatio: 2 }); // 2400×800
const blob3x = await exportSignImage(data, LAYOUT, { pixelRatio: 3 }); // 3600×1200
```

### toDataURL vs toBlob

`toDataURL`は大きなCanvas画像ではbase64エンコードによりデータサイズが約33%増加し、URLの長さ制限を超えたりメモリを圧迫する問題がある。`toBlob`を使い`URL.createObjectURL(blob)`で一時URLを生成する方が堅牢。

### 表示用と出力用の分離パターン

```js
// 画面表示用: devicePixelRatioに追従
function initDisplayCanvas(containerEl) {
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = containerEl.clientWidth;
  const cssHeight = cssWidth * (400 / 1200);
  return createHiDPICanvas(cssWidth, cssHeight); // 自動DPR
}

// 画像出力用: ユーザーが選択した倍率
function initExportCanvas(outputWidth, pixelRatio) {
  const height = outputWidth * (400 / 1200);
  return createHiDPICanvas(outputWidth, height, pixelRatio);
}
```

### このプロジェクト規模でのライン

表示用Canvasでは`devicePixelRatio`に追従する初期化を1回やるだけで十分。出力用は`pixelRatio: 2`をデフォルトにしておけば、大半のケースでシャープな画像を得られる。DPR変化のリアルタイム監視（`matchMedia`でのDPR変化検知）は、この用途では不要。

---

## 4. テキスト描画の最適化

### 現行の問題

1pxずつデクリメントするwhileループは、探索範囲が100px→10pxの場合に最大90回の`measureText`呼び出しが発生する。

### 推奨: 二分探索アプローチ

二分探索を使うことでO(log n)の計算量で最適サイズを見つけられる。探索範囲の中間値で`measureText`を実行し、テキスト幅がmaxWidth以下なら大きいサイズを、超えたら小さいサイズを試す。

整数のフォントサイズで6pxから70pxの範囲を探索する場合でも最大6回のイテレーションで済み、0.25px精度のサブピクセル対応を追加しても2回のイテレーション追加だけ。

```js
/**
 * maxWidthに収まる最大フォントサイズを二分探索で求める
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {string} fontFamily
 * @param {number} maxWidth - 許容最大幅 (px)
 * @param {number} maxSize  - 試行する最大フォントサイズ (px)
 * @param {number} minSize  - 最小フォントサイズ (px)
 * @param {number} precision - 探索精度 (px)。1なら整数、0.5ならサブピクセル
 * @returns {number} 最適なフォントサイズ
 */
function fitFontSize(ctx, text, fontFamily, maxWidth, maxSize, minSize = 8, precision = 1) {
  let low = minSize;
  let high = maxSize;
  let best = minSize;
  
  while (high - low >= precision) {
    const mid = Math.floor((low + high) / 2 / precision) * precision;
    ctx.font = `${mid}px "${fontFamily}"`;
    const measured = ctx.measureText(text).width;
    
    if (measured <= maxWidth) {
      best = mid;
      low = mid + precision;
    } else {
      high = mid - precision;
    }
  }
  
  return best;
}

// 使用例: 最大100px, 最小8px, 整数精度
// → 最大 log2((100-8)/1) ≈ 7回のmeasureTextで完了
// 現行の1pxデクリメント: 最大92回
```

### さらなる最適化: 線形予測による初期値推定

フォントサイズとテキスト幅は概ね線形関係にあるため、1回の計測で初期推定値を得て探索範囲を絞れる。

```js
function fitFontSizeFast(ctx, text, fontFamily, maxWidth, idealSize) {
  // 1回目: idealSizeで計測
  ctx.font = `${idealSize}px "${fontFamily}"`;
  const measured = ctx.measureText(text).width;
  
  if (measured <= maxWidth) return idealSize; // そのまま収まった
  
  // 線形推定で初期値を計算
  const estimatedSize = Math.floor(idealSize * (maxWidth / measured));
  
  // 推定値を中心に狭い範囲で二分探索
  const searchMin = Math.max(8, estimatedSize - 5);
  const searchMax = estimatedSize + 5;
  
  return fitFontSize(ctx, text, fontFamily, maxWidth, searchMax, searchMin, 1);
  // → 通常3〜4回のmeasureTextで完了
}
```

### ctx.font状態依存バグの防止

`drawText`後に`ctx.font`が前の描画の状態のままになる問題は、描画関数を自己完結させることで解決する。

```js
function drawFittedText(ctx, text, resolved, fontFamily) {
  // save/restoreで状態を完全に隔離
  ctx.save();
  
  const fitted = fitFontSize(
    ctx, text, fontFamily, 
    resolved.maxWidth, resolved.fontSize
  );
  
  ctx.font = `${fitted}px "${fontFamily}"`;
  ctx.textAlign = resolved.textAlign || 'center';
  ctx.textBaseline = resolved.textBaseline || 'middle';
  ctx.fillStyle = resolved.color || '#000';
  ctx.fillText(text, resolved.x, resolved.y);
  
  ctx.restore(); // 呼び出し前の状態に完全復帰
}
```

### 日本語フォント＋ローマ字フォント混在時の注意点

FontFace APIを使って明示的にフォントをロードしてからCanvasで使用するのがベストプラクティス。`new FontFace("test", "url(x)")`で作成し、`.load()`のPromiseが解決してからCanvas描画に使う。

カスタムフォントが実際に読み込まれたかを検証するには、そのフォント名とフォールバックフォントで同一テキストを`measureText`し、幅が異なるかどうかを確認する方法が有効。

CJKフォントの検出にはテスト文字列に日本語文字を含めることが重要。CJKフォントのCanvasグリフレンダリングはLatinフォールバックと十分に異なる幅を生成するため、「abcdefghijklmnopqrstuvwxyz0123456789日本語テスト」のような混合文字列を使う。

```js
async function loadAllFonts() {
  const fonts = [
    new FontFace('StationFont', 'url(./fonts/station.woff2)'),
    new FontFace('RomajiFont', 'url(./fonts/romaji.woff2)'),
    new FontFace('NumberFont', 'url(./fonts/number.woff2)'),
  ];
  
  // 全フォントを並行ロード
  await Promise.all(fonts.map(f => {
    document.fonts.add(f);
    return f.load();
  }));
  
  // 追加の安全策: document.fonts.readyを待つ
  await document.fonts.ready;
}

// 描画開始前に必ず呼ぶ
await loadAllFonts();
renderSign(ctx, LAYOUT, resolver, data);
```

日本語フォントとローマ字フォントで`measureText`の精度に差が出ることはほぼないが、CJKフォントはファイルサイズが大きい（10MB超もありうる）ため、サブセット化やwoff2圧縮を検討すること。

---

## まとめ: このプロジェクト規模での推奨構成

| 項目 | 推奨 | 理由 |
|---|---|---|
| 描画ライブラリ | **不採用**（素のCanvas 2D API） | 要素10個、インタラクションなし。55KB〜100KBのバンドル追加は見合わない |
| レイアウト | **正規化座標（0〜1）＋LayoutResolver** | 自作50行で全座標をCanvas幅非依存に。マジックナンバー完全排除 |
| Retina対応 | **createHiDPICanvas関数（20行）** | devicePixelRatio × CSS表示サイズの標準パターン |
| テキスト最適化 | **二分探索（15行）＋ctx.save/restore** | 最大7回のmeasureTextで完了（現行の最大92回から改善） |
| 画像出力 | **toBlob ＋ pixelRatio選択** | 1x/2x/3x出力対応。toDataURLより安全 |
| フォント | **FontFace API＋Promise.all** | 3フォント並行ロード後に描画開始 |

全体で、自作ラッパー層は200行未満に収まり、外部依存ゼロのまま現行の全問題（ハードコード座標、スケーリング破綻、非効率なループ、状態依存バグ）を解消できる。

---

*調査日: 2026年6月27日*
