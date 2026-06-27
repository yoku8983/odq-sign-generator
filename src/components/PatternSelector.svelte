<script lang="ts">
  import { applyPattern } from '$lib/state.svelte';
  import { STATION_PATTERNS } from '$lib/station-patterns';
  import type { StationPatternEntry } from '$lib/models';

  let selectedIndex = $state(-1);

  const lineGroups: { code: string; label: string; patterns: { index: number; entry: StationPatternEntry }[] }[] = (() => {
    const groups = [
      { code: 'OH', label: '小田原線（OH）', patterns: [] as { index: number; entry: StationPatternEntry }[] },
      { code: 'OE', label: '江ノ島線（OE）', patterns: [] as { index: number; entry: StationPatternEntry }[] },
      { code: 'OT', label: '多摩線（OT）', patterns: [] as { index: number; entry: StationPatternEntry }[] },
    ];
    STATION_PATTERNS.forEach((entry, index) => {
      const group = groups.find((g) => g.code === entry.line);
      group?.patterns.push({ index, entry });
    });
    return groups;
  })();

  function handleFill() {
    if (selectedIndex >= 0) {
      applyPattern(STATION_PATTERNS[selectedIndex]);
    }
  }
</script>

<div class="pattern-selector">
  <label for="pattern-select">駅名パターン</label>
  <div class="selector-row">
    <select
      id="pattern-select"
      data-testid="pattern-select"
      bind:value={selectedIndex}
    >
      <option value={-1} disabled>駅名パターンを選択</option>
      {#each lineGroups as group}
        <optgroup label={group.label}>
          {#each group.patterns as { index, entry }}
            <option value={index}>{entry.label}</option>
          {/each}
        </optgroup>
      {/each}
    </select>
    <button
      type="button"
      class="btn-primary"
      data-testid="pattern-fill-button"
      disabled={selectedIndex < 0}
      onclick={handleFill}
    >
      入力補完
    </button>
  </div>
</div>

<style>
  .pattern-selector {
    margin-bottom: 20px;
  }

  .selector-row {
    display: flex;
    gap: 8px;
    align-items: stretch;
  }

  .selector-row select {
    flex: 1;
  }

  .selector-row button {
    white-space: nowrap;
  }
</style>
