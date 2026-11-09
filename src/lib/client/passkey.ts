import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { api } from './api';

// Safari only shows the passkey sheet if WebAuthn starts right inside the tap.
// So the server's options are fetched ahead of time, and the tap goes straight to the browser.

type Prepared = { options: any; challengeId: string; at: number };
const FRESH_MS = 4 * 60e3; // server challenges last 5 minutes

function preparer(url: string) {
  let ready: Prepared | null = null;
  let pending: Promise<Prepared> | null = null;
  const load = () => {
    pending = api<{ options: any; challengeId: string }>(url, { step: 'options' }).then((r) => (ready = { ...r, at: Date.now() }));
    pending.catch(() => (pending = null));
    return pending;
  };
  return {
    prefetch() {
      if (!ready || Date.now() - ready.at > FRESH_MS) load();
    },
    /** Returns options synchronously when prefetched; otherwise null (caller should prefetch and retry). */
    take(): Prepared | null {
      const r = ready && Date.now() - ready.at < FRESH_MS ? ready : null;
      ready = null;
      load(); // next attempt gets fresh options
      return r;
    },
    wait: () => pending
  };
}

const reg = preparer('/api/auth/register');
const auth = preparer('/api/auth/login');

export const prefetchRegistration = () => reg.prefetch();
export const prefetchLogin = () => auth.prefetch();

export function describeError(e: unknown): string {
  const err = e as Error;
  if (err?.name === 'NotAllowedError') return 'The passkey prompt was closed or timed out. Tap the button again.';
  if (err?.name === 'InvalidStateError') return 'This device already has a passkey for Storage. Use “Sign in with passkey”.';
  return err?.message || 'Something went wrong with the passkey.';
}

/** Call directly from a click handler, with no awaits before it. */
export async function registerPasskey(deviceName: string) {
  let p = reg.take();
  if (!p) {
    await reg.wait();
    throw new Error('Getting ready, tap again.');
  }
  const response = await startRegistration({ optionsJSON: p.options });
  await api('/api/auth/register', { step: 'verify', challengeId: p.challengeId, response, deviceName });
}

export async function loginWithPasskey() {
  const p = auth.take();
  if (!p) {
    await auth.wait();
    throw new Error('Getting ready, tap again.');
  }
  const response = await startAuthentication({ optionsJSON: p.options });
  await api('/api/auth/login', { step: 'verify', challengeId: p.challengeId, response });
}
