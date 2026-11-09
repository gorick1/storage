import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { getSetting } from './db';

const Suggestion = z.object({
  name: z.string().describe('Short, specific item name a person would search for, e.g. "DeWalt 20V cordless drill"'),
  brand: z.string().describe('Brand or manufacturer exactly as printed on the item; empty string if not visible'),
  model: z.string().describe('Model name or number if legible on the item or its label; empty string if not visible'),
  category: z.string().describe('One broad household category in Title Case, e.g. "Power Tools", "Camping", "Holiday Decor", "Kitchen", "Electronics", "Clothing", "Toys & Games", "Hardware", "Sports"'),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor', 'unknown']).describe('Visible condition; "new" only if still sealed or tagged'),
  description: z.string().describe('One or two plain sentences: what it is, notable details (brand, size, color, condition)'),
  tags: z.array(z.string()).describe('2-5 lowercase category tags, e.g. "tools", "camping", "christmas"'),
  keywords: z.array(z.string()).describe('Extra search words and synonyms people might type, e.g. "driver", "power drill"'),
  quantity: z.number().int().describe('How many identical units are visible; 1 if a single item'),
  confident: z.boolean().describe('false if the photo is too blurry or ambiguous to identify the item')
});
export type Suggestion = z.infer<typeof Suggestion>;

function apiKey() {
  return getSetting('anthropic_api_key') || process.env.ANTHROPIC_API_KEY || '';
}

export function aiConfigured() {
  return !!apiKey();
}

export async function identify(imageBase64: string, mediaType: 'image/jpeg' | 'image/png' | 'image/webp', hint: string): Promise<Suggestion> {
  const key = apiKey();
  if (!key) throw new Error('Add your Anthropic API key in Settings to use photo suggestions.');
  const client = new Anthropic({ apiKey: key, timeout: 45_000, maxRetries: 1 });
  const response = await client.messages.parse(
    {
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      output_config: { effort: 'low', format: zodOutputFormat(Suggestion) },
      // Re-run on a fallback model server-side if a safety classifier declines the request.
      fallbacks: 'default',
      system:
        'You catalog household storage. From one photo of an item, write the record a person would want when searching for it later. ' +
        'Prefer concrete names with brand and model when visible on the item; never invent a brand or model number you cannot see. ' +
        'Keep the description factual and short. If several different items are in frame, describe the most prominent one.',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: hint ? `The person adds: ${hint}` : 'Identify this item.' }
          ]
        }
      ]
    },
    { headers: { 'anthropic-beta': 'server-side-fallback-2026-07-01' } }
  );
  if (response.stop_reason === 'refusal') throw new Error('The AI declined this photo. Fill in the details yourself.');
  if (!response.parsed_output) throw new Error('The AI reply could not be read. Try another photo.');
  return response.parsed_output;
}

/* ---------- Whole-box capture ---------- */

const BoxContents = z.object({
  items: z.array(z.object({
    name: z.string().describe('Short, specific name a person would search for'),
    brand: z.string().describe('Brand if printed and legible on the item; empty string otherwise'),
    model: z.string().describe('Model if legible; empty string otherwise'),
    category: z.string().describe('Broad household category in Title Case'),
    quantity: z.number().int().describe('How many identical units are visible'),
    description: z.string().describe('One short factual sentence')
  })).describe('Every distinct item visible, largest or most valuable first. Group identical units into one entry with a quantity.')
});
export type BoxContents = z.infer<typeof BoxContents>;

export async function identifyMany(imageBase64: string, mediaType: 'image/jpeg' | 'image/png' | 'image/webp'): Promise<BoxContents> {
  const key = apiKey();
  if (!key) throw new Error('Add your Anthropic API key in Settings to use photo suggestions.');
  const client = new Anthropic({ apiKey: key, timeout: 60_000, maxRetries: 1 });
  const response = await client.messages.parse(
    {
      model: 'claude-opus-5-5',
      max_tokens: 8000,
      output_config: { effort: 'low', format: zodOutputFormat(BoxContents) },
      fallbacks: 'default',
      system:
        'You catalog household storage. The photo shows the open contents of one storage box or shelf. List each distinct item so a person can find it later. ' +
        'Never invent brands or model numbers you cannot read. Skip packing material, the box itself, and anything unidentifiable. At most 30 items.',
      messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } }, { type: 'text', text: 'List the items in this box.' }] }]
    },
    { headers: { 'anthropic-beta': 'server-side-fallback-2026-07-01' } }
  );
  if (response.stop_reason === 'refusal') throw new Error('The AI declined this photo.');
  if (!response.parsed_output) throw new Error('The AI reply could not be read. Try another photo.');
  return { items: response.parsed_output.items.slice(0, 30) };
}

/* ---------- MSRP lookup ---------- */

export interface PriceResult {
  found: boolean;
  msrp_usd: number | null;
  source_url: string | null;
  source_name: string | null;
  note: string;
}

// A strict custom tool is how the model hands back its answer after searching.
const reportTool: Anthropic.Tool = {
  name: 'report_price',
  description: 'Report the manufacturer suggested retail price (MSRP) you found for the item. Call this exactly once, after searching.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['found', 'msrp_usd', 'source_url', 'source_name', 'note'],
    properties: {
      found: { type: 'boolean', description: 'true only if a price for this specific product was found on a reliable page' },
      msrp_usd: { type: ['number', 'null'], description: 'MSRP or typical new retail price in US dollars, per single unit' },
      source_url: { type: ['string', 'null'], description: 'URL of the page the price came from' },
      source_name: { type: ['string', 'null'], description: 'Short name of the source, e.g. "DeWalt.com" or "Home Depot"' },
      note: { type: 'string', description: 'One short sentence: what was matched and whether it is MSRP, list price, or a current typical price' }
    }
  }
};

export async function lookupMsrp(item: { name: string; brand: string; model: string; category: string; description: string }): Promise<PriceResult> {
  const key = apiKey();
  if (!key) throw new Error('Add your Anthropic API key in Settings to look up prices.');
  const client = new Anthropic({ apiKey: key, timeout: 120_000, maxRetries: 1 });
  const describe = [
    `Item: ${item.name}`,
    item.brand && `Brand: ${item.brand}`,
    item.model && `Model: ${item.model}`,
    item.category && `Category: ${item.category}`,
    item.description && `Description: ${item.description}`
  ].filter(Boolean).join('\n');

  const messages: Anthropic.MessageParam[] = [{
    role: 'user',
    content: `Find the manufacturer's suggested retail price (MSRP) in US dollars for this household item, as if replacing it new today.\n\n${describe}\n\n` +
      'Search the web. Prefer the manufacturer\'s own site, then major retailers. Match the exact brand and model when given; if only a close equivalent exists, say so in the note. ' +
      'Ignore used, refurbished and marketplace listings. If the item is generic or unbranded and no specific product can be matched, report found=false. Then call report_price.'
  }];

  for (let turn = 0; turn < 6; turn++) {
    const response = await client.messages.create(
      {
        model: 'claude-opus-5-5',
        max_tokens: 8000,
        output_config: { effort: 'low' },
        // @ts-expect-error fallbacks is a beta field not yet typed on messages.create
        fallbacks: 'default',
        tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4, user_location: { type: 'approximate', country: 'US' } }, reportTool],
        messages
      },
      { headers: { 'anthropic-beta': 'server-side-fallback-2026-07-01' } }
    );
    if (response.stop_reason === 'refusal') throw new Error('The AI declined this lookup.');
    const call = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'report_price');
    if (call) {
      const r = call.input as PriceResult;
      const ok = r.found && typeof r.msrp_usd === 'number' && r.msrp_usd > 0 && r.msrp_usd < 1_000_000;
      return { ...r, found: ok, msrp_usd: ok ? Math.round(r.msrp_usd! * 100) / 100 : null };
    }
    // Server-side search paused mid-turn: send it back unchanged and the API resumes.
    if (response.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: response.content });
      continue;
    }
    // Finished without reporting: ask once for the tool call.
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: 'Call report_price now with what you found (found=false if nothing reliable).' });
  }
  throw new Error('The price lookup did not finish. Try again.');
}
