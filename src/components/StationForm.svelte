<script lang="ts">
  import PatternSelector from './PatternSelector.svelte';
  import StationNameInputs from './StationNameInputs.svelte';
  import AdjacentInputs from './AdjacentInputs.svelte';
  import NumberingInputs from './NumberingInputs.svelte';
  import ActionButtons from './ActionButtons.svelte';
</script>

<form class="station-form" onsubmit={(e) => e.preventDefault()}>
  <PatternSelector />
  <StationNameInputs />
  <AdjacentInputs />
  <NumberingInputs />
  <ActionButtons />
</form>

<style>
  .station-form {
    background: #fff;
    border: 1px solid var(--border-gray);
    border-radius: 8px;
    padding: 24px;
    max-width: 800px;
    margin: 0 auto 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
</style>
