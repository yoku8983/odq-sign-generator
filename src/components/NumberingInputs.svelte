<script lang="ts">
  import { station, flags } from '$lib/state.svelte';
</script>

<div class="numbering-inputs">
  {#if station.currentNumbering}
    <fieldset class="numbering-group">
      <legend>現在駅ナンバリング</legend>
      <div class="numbering-row">
        <div class="field">
          <label for="current-symbol">路線記号</label>
          <input
            id="current-symbol"
            type="text"
            class="small-input"
            data-testid="current-numbering-symbol"
            bind:value={station.currentNumbering.symbol}
            placeholder="OH"
          />
        </div>
        <div class="field">
          <label for="current-number">駅番号</label>
          <input
            id="current-number"
            type="text"
            class="small-input"
            data-testid="current-numbering-number"
            bind:value={station.currentNumbering.number}
            placeholder="01"
          />
        </div>
        <label class="checkbox-label">
          <input
            type="checkbox"
            data-testid="hide-current-numbering"
            bind:checked={flags.hideCurrentNumbering}
          />
          非表示
        </label>
      </div>
    </fieldset>
  {/if}

  {#if station.nextNumbering}
    <fieldset class="numbering-group">
      <legend>次駅ナンバリング</legend>
      <div class="numbering-row">
        <div class="field">
          <label for="next-symbol">路線記号</label>
          <input
            id="next-symbol"
            type="text"
            class="small-input"
            data-testid="next-numbering-symbol"
            bind:value={station.nextNumbering.symbol}
            placeholder="OH"
          />
        </div>
        <div class="field">
          <label for="next-number">駅番号</label>
          <input
            id="next-number"
            type="text"
            class="small-input"
            data-testid="next-numbering-number"
            bind:value={station.nextNumbering.number}
            placeholder="02"
          />
        </div>
        <label class="checkbox-label">
          <input
            type="checkbox"
            data-testid="hide-next-numbering"
            bind:checked={flags.hideNextNumbering}
          />
          非表示
        </label>
      </div>
    </fieldset>
  {/if}
</div>

<style>
  .numbering-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .numbering-row {
    display: flex;
    gap: 12px;
    align-items: flex-end;
  }

  .small-input {
    width: 80px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    padding-bottom: 4px;
  }

  @media (max-width: 768px) {
    .numbering-inputs {
      grid-template-columns: 1fr;
    }
  }
</style>
