import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse
} from '@simplewebauthn/server';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import { db, now } from './db';

export interface User { id: number; name: string; role: 'admin' | 'member'; webauthn_user_id: string }

const SESSION_DAYS = 180;
const RP_NAME = 'Storage';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

export function userCount(): number {
  return (db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }).c;
}

export function listUsers() {
  return db.prepare(`SELECT u.id, u.name, u.role, u.created_at,
    (SELECT COUNT(*) FROM credentials c WHERE c.user_id = u.id) AS passkeys,
    (SELECT COUNT(*) FROM recovery_codes r WHERE r.user_id = u.id AND r.used_at IS NULL) AS codes_left
    FROM users u ORDER BY u.created_at`).all() as unknown as { id: number; name: string; role: string; created_at: number; passkeys: number; codes_left: number }[];
}

export function createUser(name: string, role: 'admin' | 'member'): User {
  const r = db.prepare('INSERT INTO users (name, role, webauthn_user_id, created_at) VALUES (?, ?, ?, ?)').run(name, role, randomBytes(32).toString('base64url'), now());
  return db.prepare('SELECT * FROM users WHERE id = ?').get(Number(r.lastInsertRowid)) as unknown as User;
}

export function deleteUser(id: number) {
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

/* ---------- Sessions ---------- */

export function createSession(cookies: Cookies, userId: number, secure: boolean) {
  const token = randomBytes(32).toString('base64url');
  const t = now();
  db.prepare('INSERT INTO sessions (id_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(sha(token), userId, t, t + SESSION_DAYS * 864e5);
  cookies.set('sid', token, { path: '/', httpOnly: true, sameSite: 'lax', secure, maxAge: SESSION_DAYS * 86400 });
}

export function sessionUser(token: string | undefined): User | null {
  if (!token) return null;
  const row = db.prepare(`SELECT u.* , s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id_hash = ?`).get(sha(token)) as (User & { expires_at: number }) | undefined;
  if (!row || row.expires_at < now()) return null;
  // Sliding expiry so phones stay signed in.
  if (row.expires_at - now() < (SESSION_DAYS - 7) * 864e5) db.prepare('UPDATE sessions SET expires_at = ? WHERE id_hash = ?').run(now() + SESSION_DAYS * 864e5, sha(token));
  return { id: row.id, name: row.name, role: row.role, webauthn_user_id: row.webauthn_user_id };
}

export function destroySession(cookies: Cookies) {
  const token = cookies.get('sid');
  if (token) db.prepare('DELETE FROM sessions WHERE id_hash = ?').run(sha(token));
  cookies.delete('sid', { path: '/' });
}

/* ---------- Challenges ---------- */

function saveChallenge(challenge: string, purpose: string, userId: number | null): string {
  const id = randomUUID();
  db.prepare('DELETE FROM challenges WHERE expires_at < ?').run(now());
  db.prepare('INSERT INTO challenges (id, challenge, user_id, purpose, expires_at) VALUES (?, ?, ?, ?, ?)').run(id, challenge, userId, purpose, now() + 5 * 60e3);
  return id;
}

function takeChallenge(id: string, purpose: string): { challenge: string; user_id: number | null } | null {
  const row = db.prepare('SELECT challenge, user_id, expires_at FROM challenges WHERE id = ? AND purpose = ?').get(id, purpose) as { challenge: string; user_id: number | null; expires_at: number } | undefined;
  db.prepare('DELETE FROM challenges WHERE id = ?').run(id);
  if (!row || row.expires_at < now()) return null;
  return row;
}

/* ---------- Passkeys ---------- */

export interface RpInfo { rpID: string; origin: string }

export async function registrationOptions(user: User, rp: RpInfo) {
  const existing = db.prepare('SELECT id, transports FROM credentials WHERE user_id = ?').all(user.id) as { id: string; transports: string | null }[];
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rp.rpID,
    userName: user.name,
    userDisplayName: user.name,
    userID: Buffer.from(user.webauthn_user_id, 'base64url'),
    attestationType: 'none',
    excludeCredentials: existing.map((c) => ({ id: c.id, transports: c.transports ? JSON.parse(c.transports) : undefined })),
    authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' }
  });
  return { options, challengeId: saveChallenge(options.challenge, 'register', user.id) };
}

export async function verifyRegistration(challengeId: string, response: RegistrationResponseJSON, rp: RpInfo, deviceName: string) {
  const ch = takeChallenge(challengeId, 'register');
  if (!ch || !ch.user_id) throw new Error('That passkey request expired. Try again.');
  const v = await verifyRegistrationResponse({ response, expectedChallenge: ch.challenge, expectedOrigin: rp.origin, expectedRPID: rp.rpID, requireUserVerification: false });
  if (!v.verified || !v.registrationInfo) throw new Error('The passkey could not be verified.');
  const c = v.registrationInfo.credential;
  db.prepare('INSERT INTO credentials (id, user_id, public_key, counter, transports, device_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(c.id, ch.user_id, c.publicKey, c.counter, JSON.stringify(c.transports ?? []), deviceName, now());
  return ch.user_id;
}

export async function authenticationOptions(rp: RpInfo) {
  const options = await generateAuthenticationOptions({ rpID: rp.rpID, userVerification: 'preferred', allowCredentials: [] });
  return { options, challengeId: saveChallenge(options.challenge, 'login', null) };
}

export async function verifyAuthentication(challengeId: string, response: AuthenticationResponseJSON, rp: RpInfo): Promise<number> {
  const ch = takeChallenge(challengeId, 'login');
  if (!ch) throw new Error('That sign-in request expired. Try again.');
  const cred = db.prepare('SELECT * FROM credentials WHERE id = ?').get(response.id) as { id: string; user_id: number; public_key: Uint8Array; counter: number; transports: string | null } | undefined;
  if (!cred) throw new Error('This passkey is not registered here. Use a recovery code or ask for a new invite.');
  const v = await verifyAuthenticationResponse({
    response, expectedChallenge: ch.challenge, expectedOrigin: rp.origin, expectedRPID: rp.rpID, requireUserVerification: false,
    credential: { id: cred.id, publicKey: new Uint8Array(cred.public_key), counter: cred.counter, transports: cred.transports ? JSON.parse(cred.transports) : undefined }
  });
  if (!v.verified) throw new Error('The passkey could not be verified.');
  db.prepare('UPDATE credentials SET counter = ?, last_used_at = ? WHERE id = ?').run(v.authenticationInfo.newCounter, now(), cred.id);
  return cred.user_id;
}

export function listPasskeys(userId: number) {
  return db.prepare('SELECT id, device_name, created_at, last_used_at FROM credentials WHERE user_id = ? ORDER BY created_at').all(userId) as unknown as { id: string; device_name: string | null; created_at: number; last_used_at: number | null }[];
}

export function removePasskey(userId: number, id: string) {
  db.prepare('DELETE FROM credentials WHERE user_id = ? AND id = ?').run(userId, id);
}

/* ---------- Recovery codes ---------- */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function issueRecoveryCodes(userId: number): string[] {
  db.prepare('DELETE FROM recovery_codes WHERE user_id = ?').run(userId);
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const bytes = randomBytes(10);
    let s = '';
    for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
    const code = `${s.slice(0, 5)}-${s.slice(5)}`;
    codes.push(code);
    db.prepare('INSERT INTO recovery_codes (user_id, code_hash) VALUES (?, ?)').run(userId, sha(code));
  }
  return codes;
}

export function useRecoveryCode(code: string): number | null {
  const norm = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (norm.length !== 10) return null;
  const formatted = `${norm.slice(0, 5)}-${norm.slice(5)}`;
  const row = db.prepare('SELECT id, user_id FROM recovery_codes WHERE code_hash = ? AND used_at IS NULL').get(sha(formatted)) as { id: number; user_id: number } | undefined;
  if (!row) return null;
  db.prepare('UPDATE recovery_codes SET used_at = ? WHERE id = ?').run(now(), row.id);
  return row.user_id;
}

/* ---------- Invites ---------- */

export function createInvite(createdBy: number, role: 'admin' | 'member'): string {
  const token = randomBytes(24).toString('base64url');
  db.prepare('INSERT INTO invites (token_hash, role, created_by, expires_at) VALUES (?, ?, ?, ?)').run(sha(token), role, createdBy, now() + 7 * 864e5);
  return token;
}

export function checkInvite(token: string): { role: 'admin' | 'member' } | null {
  const row = db.prepare('SELECT role, expires_at, used_at FROM invites WHERE token_hash = ?').get(sha(token)) as { role: 'admin' | 'member'; expires_at: number; used_at: number | null } | undefined;
  if (!row || row.used_at || row.expires_at < now()) return null;
  return { role: row.role };
}

export function consumeInvite(token: string) {
  db.prepare('UPDATE invites SET used_at = ? WHERE token_hash = ?').run(now(), sha(token));
}

/* ---------- Simple rate limit for sign-in attempts ---------- */

const attempts = new Map<string, { n: number; reset: number }>();
export function rateLimited(key: string, max = 10, windowMs = 10 * 60e3): boolean {
  const t = now();
  const a = attempts.get(key);
  if (!a || a.reset < t) {
    attempts.set(key, { n: 1, reset: t + windowMs });
    return false;
  }
  a.n++;
  return a.n > max;
}
