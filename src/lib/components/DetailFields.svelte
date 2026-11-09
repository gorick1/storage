<script lang="ts">
  import { CONDITION_LABEL } from '$lib/money';
  // Shared by Add and Edit. Values are bindable so the AI can fill them in.
  let {
    brand = $bindable(''), model = $bindable(''), category = $bindable(''), condition = $bindable(''),
    serial_number = $bindable(''), purchase_price = $bindable(''), purchase_date = $bindable(''),
    categories = []
  }: { brand?: string; model?: string; category?: string; condition?: string; serial_number?: string; purchase_price?: string; purchase_date?: string; categories?: string[] } = $props();
</script>

<div class="group">
  <label class="row"><span class="lbl">Brand</span><input name="brand" bind:value={brand} placeholder="DeWalt" autocomplete="off" /></label>
  <label class="row"><span class="lbl">Model</span><input name="model" bind:value={model} placeholder="DCD771C2" autocomplete="off" autocapitalize="characters" /></label>
  <label class="row"><span class="lbl">Category</span><input name="category" bind:value={category} placeholder="Power Tools" list="category-list" autocomplete="off" /></label>
  <label class="row"><span class="lbl">Condition</span>
    <select name="condition" bind:value={condition}>
      <option value="">Not set</option>
      {#each Object.entries(CONDITION_LABEL) as [v, l]}<option value={v}>{l}</option>{/each}
    </select>
  </label>
</div>
<datalist id="category-list">{#each categories as c}<option value={c}></option>{/each}</datalist>

<h3 class="group-label">Purchase</h3>
<div class="group">
  <label class="row"><span class="lbl">Price paid</span><input name="purchase_price" bind:value={purchase_price} placeholder="$0.00" inputmode="decimal" /></label>
  <label class="row"><span class="lbl">Date</span><input name="purchase_date" type="date" bind:value={purchase_date} /></label>
  <label class="row"><span class="lbl">Serial number</span><input name="serial_number" bind:value={serial_number} placeholder="Optional" autocomplete="off" autocapitalize="characters" /></label>
</div>
