import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { getSetting } from './db';

const Suggestion = z.object({
  name: z.string().describe('Short, specific item name a person would search for, e.g. "DeWalt 20V cordless drill"'),
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
        'Prefer concrete names with brand and model when visible on the item; never invent a brand you cannot see. ' +
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
