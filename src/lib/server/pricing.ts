import { aiConfigured, lookupMsrp } from './ai';
import { itemById, saveMsrp, setPriceStatus } from './records';

const running = new Set<number>();

/** Look up MSRP in the background; the item page shows progress via price_status. */
export function queuePriceLookup(itemId: number, opts: { onlyIfBranded?: boolean } = {}) {
  const item = itemById(itemId);
  if (!item || !aiConfigured() || running.has(itemId)) return false;
  // Generic things (zip ties, "box of cables") rarely have a meaningful MSRP; skip unless asked.
  if (opts.onlyIfBranded && !item.brand.trim()) return false;
  running.add(itemId);
  setPriceStatus(itemId, 'pending');
  lookupMsrp(item)
    .then((r) => saveMsrp(itemId, { cents: r.msrp_usd != null ? Math.round(r.msrp_usd * 100) : null, url: r.source_url, source: r.source_name, note: r.note }, r.found ? 'found' : 'not_found'))
    .catch((e) => {
      console.error(`Price lookup failed for item ${itemId}:`, (e as Error).message);
      saveMsrp(itemId, { cents: item.msrp_cents, url: item.msrp_source_url, source: item.msrp_source_name, note: (e as Error).message }, 'error');
    })
    .finally(() => running.delete(itemId));
  return true;
}
