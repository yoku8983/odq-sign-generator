<script lang="ts">
  import { station } from '$lib/state.svelte';
</script>

<div class="adjacent-inputs">
  <fieldset class="adjacent-group">
    <legend>前の駅</legend>
    <div class="field">
      <label for="prev-kanji">漢字</label>
      <input
        id="prev-kanji"
        type="text"
        data-testid="prev-station-kanji"
        bind:value={station.prev.kanji}
        placeholder="例: 南新宿"
      />
    </div>
    <div class="field">
      <label for="prev-romaji">ローマ字</label>
      <input
        id="prev-romaji"
        type="text"
        data-testid="prev-station-romaji"
        bind:value={station.prev.romaji}
        placeholder="例: Minami-Shinjuku"
      />
    </div>
  </fieldset>

  <fieldset class="adjacent-group">
    <legend>次の駅</legend>
    <div class="field">
      <label for="next-kanji">漢字</label>
      <input
        id="next-kanji"
        type="text"
        data-testid="next-station-kanji"
        bind:value={station.next.kanji}
        placeholder="例: 代々木八幡"
      />
    </div>
    <div class="field">
      <label for="next-romaji">ローマ字</label>
      <input
        id="next-romaji"
        type="text"
        data-testid="next-station-romaji"
        bind:value={station.next.romaji}
        placeholder="例: Yoyogi-Hachiman"
      />
    </div>
  </fieldset>
</div>

<style>
  .adjacent-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  @media (max-width: 768px) {
    .adjacent-inputs {
      grid-template-columns: 1fr;
    }
  }
</style>
