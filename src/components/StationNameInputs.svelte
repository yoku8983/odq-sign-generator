<script lang="ts">
  import { station } from '$lib/state.svelte';
</script>

<fieldset class="station-name-inputs">
  <legend>駅名</legend>
  <div class="input-grid">
    <div class="field">
      <label for="station-kanji">漢字</label>
      <input
        id="station-kanji"
        type="text"
        data-testid="station-name-kanji"
        bind:value={station.name.kanji}
        placeholder="例: 新宿"
      />
    </div>
    <div class="field">
      <label for="station-hiragana">ひらがな</label>
      <input
        id="station-hiragana"
        type="text"
        data-testid="station-name-hiragana"
        bind:value={station.name.hiragana}
        placeholder="例: しんじゅく"
      />
    </div>
    <div class="field">
      <label for="station-romaji">ローマ字</label>
      <input
        id="station-romaji"
        type="text"
        data-testid="station-name-romaji"
        bind:value={station.name.romaji}
        placeholder="例: Shinjuku"
      />
    </div>
  </div>
</fieldset>

<style>
  .input-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }

  @media (max-width: 768px) {
    .input-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
