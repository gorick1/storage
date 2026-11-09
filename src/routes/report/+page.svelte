<script lang="ts">
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { formatMoney, CONDITION_LABEL } from '$lib/money';
  import { displayCode } from '$lib/codes';
  let { data } = $props();
  const value = (r: (typeof data.rows)[number]) => (r.purchase_price_cents ?? r.msrp_cents ?? 0) * (r.track_quantity ? r.quantity : 1);
</script>

<svelte:head><title>Insurance Report · Storage</title></svelte:head>
<div class="page wide">
  <div class="screen-only">
    <PageHeader title="Insurance Report" back={{ href: '/settings', label: 'Settings' }} />
    <div class="tools">
      <select class="field" value={data.locationNumber ?? ''} onchange={(e) => goto(`/report${(e.target as HTMLSelectElement).value ? `?location=${(e.target as HTMLSelectElement).value}` : ''}`)} aria-label="Place">
        <option value="">Everything</option>
        {#each data.locations as l}<option value={l.number}>{l.name}</option>{/each}
      </select>
      <button class="btn" onclick={() => window.print()}><Icon name="printer" size={18} /> Save as PDF</button>
      <a class="btn gray" href={`/report/csv${data.locationNumber ? `?location=${data.locationNumber}` : ''}`} download><Icon name="copy" size={18} /> CSV</a>
    </div>
    <p class="footnote muted hint">“Save as PDF” opens the print sheet; choose Save to Files (iPhone) or Save as PDF (Mac).</p>
  </div>

  <article class="report">
    <header>
      <h1>Household inventory{data.location ? ` · ${data.location}` : ''}</h1>
      <p class="num">{data.rows.length} items · estimated value {formatMoney(data.total, { whole: true })} · {new Date(data.generated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </header>
    {#each data.rows as r (r.id)}
      <section class="entry">
        {#if r.cover}<img src={`/photos/${r.cover}.jpg`} alt="" loading="lazy" />{:else}<div class="noimg">No photo</div>{/if}
        <div class="info">
          <h2>{r.name}{#if r.track_quantity} <span class="muted">×{r.quantity}</span>{/if}</h2>
          <dl>
            {#if r.brand || r.model}<dt>Make / model</dt><dd>{[r.brand, r.model].filter(Boolean).join(' ')}</dd>{/if}
            {#if r.serial_number}<dt>Serial</dt><dd class="mono">{r.serial_number}</dd>{/if}
            {#if r.condition}<dt>Condition</dt><dd>{CONDITION_LABEL[r.condition] ?? r.condition}</dd>{/if}
            {#if r.purchase_price_cents != null}<dt>Paid</dt><dd class="num">{formatMoney(r.purchase_price_cents)}{r.purchase_date ? ` on ${r.purchase_date}` : ''}</dd>{/if}
            {#if r.msrp_cents != null}<dt>MSRP</dt><dd class="num">{formatMoney(r.msrp_cents)}</dd>{/if}
            <dt>Location</dt><dd>{[r.location_name, r.box_name].filter(Boolean).join(' › ') || 'Not put away'}</dd>
            <dt>Record</dt><dd class="mono">{displayCode('item', r.number)}</dd>
          </dl>
        </div>
        <div class="val num">{value(r) ? formatMoney(value(r)) : '—'}</div>
      </section>
    {:else}
      <p class="muted">No items yet.</p>
    {/each}
  </article>
</div>

<style>
  .wide { max-width: 980px; }
  .tools { display: flex; gap: 10px; flex-wrap: wrap; }
  .tools .field { flex: 1; min-width: 180px; }
  .hint { margin: 8px 4px 18px; }
  .report { background: #fff; color: #111; border-radius: 22px; padding: 28px; box-shadow: var(--shadow); }
  .report header { border-bottom: 1px solid #ddd; padding-bottom: 14px; margin-bottom: 8px; }
  .report h1 { font: 700 24px/1.2 var(--font-display); margin: 0; }
  .report header p { margin: 4px 0 0; color: #555; }
  .entry { display: grid; grid-template-columns: 96px 1fr auto; gap: 16px; padding: 14px 0; border-bottom: 1px solid #eee; break-inside: avoid; }
  .entry img, .noimg { width: 96px; height: 96px; border-radius: 10px; object-fit: cover; background: #f2f2f2; display: grid; place-items: center; font-size: 12px; color: #888; }
  .entry h2 { font-size: 17px; margin: 0 0 6px; }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; margin: 0; font-size: 14px; }
  dt { color: #777; }
  dd { margin: 0; }
  .mono { font-family: var(--mono); font-size: 13px; }
  .val { font-weight: 600; white-space: nowrap; }
  @media (max-width: 560px) { .entry { grid-template-columns: 64px 1fr; } .entry img, .noimg { width: 64px; height: 64px; } .val { grid-column: 2; } .report { padding: 18px; } }
  @media print {
    :global(.sidebar), :global(.dock), :global(.toasts), :global(.pill), .screen-only { display: none !important; }
    :global(body) { background: #fff; }
    :global(.shell) { display: block !important; }
    .page { padding: 0; max-width: none; }
    .report { box-shadow: none; border-radius: 0; padding: 0; }
  }
</style>
