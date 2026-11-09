// Home Assistant writes add-on options to /data/options.json. Map them to env, then start the server.
import { readFileSync, existsSync } from 'node:fs';

const file = '/data/options.json';
if (existsSync(file)) {
  const o = JSON.parse(readFileSync(file, 'utf8'));
  if (o.public_url) {
    process.env.ORIGIN ??= o.public_url.replace(/\/+$/, '');
    process.env.RP_ID ??= new URL(o.public_url).hostname;
  }
  if (o.anthropic_api_key) process.env.ANTHROPIC_API_KEY ??= o.anthropic_api_key;
}
// Behind Cloudflared / Nginx Proxy Manager, trust the forwarded client address for rate limiting.
process.env.ADDRESS_HEADER ??= 'x-forwarded-for';
process.env.XFF_DEPTH ??= '1';
await import('./build/index.js');
