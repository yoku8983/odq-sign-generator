<script lang="ts">
  import { resetStation, getCanvasRef } from '$lib/state.svelte';
  import { canvasToBlob, downloadBlob, shareImage } from '$lib/canvas-utils';

  let saving = $state(false);
  let sharing = $state(false);

  const isMobile =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches;

  const canShareFiles =
    isMobile &&
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({
      files: [new File([], 'test.png', { type: 'image/png' })],
    });

  async function handleSave() {
    const canvas = getCanvasRef();
    if (!canvas || saving) return;
    saving = true;
    try {
      const blob = await canvasToBlob(canvas);
      downloadBlob(blob);
    } catch {
      alert('画像の保存に失敗しました');
    } finally {
      saving = false;
    }
  }

  async function handleShare() {
    const canvas = getCanvasRef();
    if (!canvas || sharing) return;
    sharing = true;
    try {
      const blob = await canvasToBlob(canvas);
      await shareImage(blob);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      alert('画像のシェアに失敗しました');
    } finally {
      sharing = false;
    }
  }

  function handleClearCanvas() {
    const canvas = getCanvasRef();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function handleClearForm() {
    resetStation();
  }
</script>

<div class="action-buttons">
  <button
    type="button"
    class="btn-primary"
    data-testid="save-button"
    disabled={saving}
    onclick={handleSave}
  >
    {saving ? '保存中...' : '画像を保存'}
  </button>
  {#if canShareFiles}
    <button
      type="button"
      class="btn-primary"
      data-testid="share-button"
      disabled={sharing}
      onclick={handleShare}
    >
      {sharing ? 'シェア中...' : '画像をシェア'}
    </button>
  {/if}
  <button
    type="button"
    class="btn-secondary"
    data-testid="clear-canvas-button"
    onclick={handleClearCanvas}
  >
    Canvasクリア
  </button>
  <button
    type="button"
    class="btn-secondary"
    data-testid="clear-form-button"
    onclick={handleClearForm}
  >
    フォームクリア
  </button>
</div>

<style>
  .action-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    padding-top: 16px;
  }

  @media (max-width: 480px) {
    .action-buttons {
      flex-direction: column;
    }

    .action-buttons button {
      width: 100%;
    }
  }
</style>
