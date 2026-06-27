<script lang="ts">
  import { station, flags, setCanvasRef } from '$lib/state.svelte';
  import { loadFonts } from '$lib/fonts';
  import { loadBackgroundImage, renderStationSign } from '$lib/renderer';
  import { setupHiDPICanvas } from '$lib/canvas-utils';
  import { LAYOUT } from '$lib/layout';

  let canvas: HTMLCanvasElement;
  let ready = $state(false);
  let error = $state('');
  let bgImage: HTMLImageElement | null = $state(null);

  const CSS_WIDTH = 800;
  const CSS_HEIGHT = CSS_WIDTH * LAYOUT.aspectRatio;

  $effect(() => {
    if (ready) return;
    Promise.all([loadFonts(), loadBackgroundImage()])
      .then(([, img]) => {
        bgImage = img;
        ready = true;
      })
      .catch((err) => {
        error = err instanceof Error ? err.message : 'リソースの読み込みに失敗しました';
      });
  });

  $effect(() => {
    const s = $state.snapshot(station);
    const f = $state.snapshot(flags);

    if (!ready || !canvas || !bgImage) return;

    const frameId = requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const resolver = setupHiDPICanvas(
        canvas,
        CSS_WIDTH,
        CSS_HEIGHT,
        window.devicePixelRatio || 2,
      );
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      renderStationSign(ctx, resolver, bgImage!, s, f);
    });

    return () => cancelAnimationFrame(frameId);
  });

  $effect(() => {
    if (canvas) {
      setCanvasRef(canvas);
    }
  });
</script>

<div class="preview-container">
  {#if error}
    <p class="preview-error">{error}</p>
  {:else if !ready}
    <p class="preview-loading">読み込み中...</p>
  {/if}
  <canvas
    bind:this={canvas}
    class="sign-canvas"
    class:hidden={!ready || !!error}
  ></canvas>
</div>

<style>
  .preview-container {
    text-align: center;
    margin-bottom: 24px;
  }

  .sign-canvas {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    height: auto;
  }

  .sign-canvas.hidden {
    display: none;
  }

  .preview-error {
    color: #d32f2f;
    text-align: center;
    padding: 20px;
  }

  .preview-loading {
    color: #888;
    text-align: center;
    padding: 20px;
  }
</style>
