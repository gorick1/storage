import type { RpInfo } from './auth';

/** Relying party = the host the person is actually using. Passkeys are bound to it, so pick the final domain before inviting people. */
export function rpFor(url: URL, request: Request): RpInfo {
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host') ?? url.host;
  const rpID = process.env.RP_ID || host.split(':')[0];
  return { rpID, origin: process.env.ORIGIN || `${proto}://${host}` };
}

export function isSecure(url: URL, request: Request) {
  return (request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '')) === 'https';
}
