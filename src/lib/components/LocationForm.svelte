<script lang="ts">
  import Icon from './Icon.svelte';
  import { COLORS, LOCATION_ICONS } from '$lib/icons';
  let { name = '', color = 'teal', icon = 'garage', notes = '' }: { name?: string; color?: string; icon?: string; notes?: string } = $props();
  let c = $state(color);
  let ic = $state(icon);
  let n = $state(name);
</script>

<div class="preview" data-color={c}>
  <span class="glyph"><Icon name={ic} size={34} stroke={2} /></span>
  <span class="pname">{n || 'New place'}</span>
</div>

<div class="group">
  <label class="row"><input class="left" name="name" bind:value={n} placeholder="Name, e.g. Garage" required maxlength="60" /></label>
</div>

<h3 class="group-label">Color</h3>
<div class="group pad">
  <div class="swatches" role="radiogroup" aria-label="Color">
    {#each COLORS as col}
      <label class="sw" data-color={col}>
        <input type="radio" name="color" value={col} bind:group={c} class="sr-only" />
        <span class="chip" class:on={c === col}></span>
        <span class="sr-only">{col}</span>
      </label>
    {/each}
  </div>
</div>

<h3 class="group-label">Icon</h3>
<div class="group pad">
  <div class="icons" role="radiogroup" aria-label="Icon">
    {#each LOCATION_ICONS as i}
      <label class="ic" class:on={ic === i} data-color={c}>
        <input type="radio" name="icon" value={i} bind:group={ic} class="sr-only" />
        <Icon name={i} size={24} />
        <span class="sr-only">{i}</span>
      </label>
    {/each}
  </div>
</div>

<h3 class="group-label">Notes</h3>
<div class="group"><label class="row"><textarea name="notes" placeholder="Optional" rows="2">{notes}</textarea></label></div>

<style>
  .preview { margin: 6px auto 18px; width: 150px; aspect-ratio: 1.12; border-radius: var(--r-tile); background: var(--loc-solid); color: #fff; position: relative; padding: 14px; display: flex; align-items: flex-end; box-shadow: var(--shadow-lift); transition: background 0.3s; }
  .preview[data-color='yellow'] { color: #2e2300; background: var(--loc); }
  .glyph { position: absolute; top: 13px; left: 13px; width: 48px; height: 48px; border-radius: 14px; background: rgba(255,255,255,.22); display: grid; place-items: center; }
  .pname { font: 600 18px/1.15 var(--font-display); overflow-wrap: anywhere; }
  .pad { padding: 14px; }
  .swatches { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; justify-items: center; }
  .sw { cursor: pointer; }
  .chip { display: block; width: 40px; height: 40px; border-radius: 50%; background: var(--loc); box-shadow: inset 0 0 0 3px var(--bg-2); outline: 3px solid transparent; transition: outline-color 0.2s; }
  .chip.on { outline-color: var(--loc); }
  .icons { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
  .ic { aspect-ratio: 1; border-radius: 12px; display: grid; place-items: center; color: var(--label-2); background: var(--fill); cursor: pointer; }
  .ic.on { background: var(--loc); color: #fff; }
</style>
