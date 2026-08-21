import type { GameSaveData } from '../managers/SaveManager.ts';

/** Phiên bản envelope localStorage — tách khỏi SAVE_VERSION nội dung game. */
export const SAVE_ENVELOPE_VERSION = 1;

export interface SignedSaveEnvelope {
  envelopeVersion: typeof SAVE_ENVELOPE_VERSION;
  /** JSON canonical đã ký — nguồn sự thật khi load. */
  payloadJson?: string;
  /** @deprecated Envelope cũ — migrate sang payloadJson khi load. */
  payload?: GameSaveData;
  sig: string;
}

/** Pepper client-side — chặn sửa JSON thô, không chống reverse engineer. */
const SAVE_HMAC_SECRET = 'VoDichDaoTam|save-integrity|v1';

let cryptoReady = false;

/** Bỏ key undefined — JSON.stringify/parse làm lệch chữ ký nếu không chuẩn hóa. */
export function stripUndefinedDeep<T>(value: T): T {
  if (value === undefined) return value;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((entry) => stripUndefinedDeep(entry)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (entry !== undefined) {
      out[key] = stripUndefinedDeep(entry);
    }
  }
  return out as T;
}

/** JSON ổn định (sort key) để ký/verify nhất quán. */
export function stableStringify(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

export function canonicalizeSavePayload(payload: GameSaveData): string {
  return stableStringify(stripUndefinedDeep(payload));
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function importHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(SAVE_HMAC_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function hmacHex(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await importHmacKey();
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return toHex(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Gọi một lần trước khi game load save (warm-up Web Crypto). */
export async function initSaveIntegrity(): Promise<void> {
  if (cryptoReady) return;
  if (!globalThis.crypto?.subtle) {
    console.warn('[saveIntegrity] Web Crypto unavailable — saves will not be signed.');
    return;
  }
  await hmacHex('vddt-init');
  cryptoReady = true;
}

export function isSignedEnvelope(raw: unknown): raw is SignedSaveEnvelope {
  if (!raw || typeof raw !== 'object') return false;
  const env = raw as SignedSaveEnvelope;
  if (env.envelopeVersion !== SAVE_ENVELOPE_VERSION || typeof env.sig !== 'string') return false;
  return typeof env.payloadJson === 'string' || !!env.payload;
}

export function isLegacySavePayload(raw: unknown): raw is GameSaveData {
  if (!raw || typeof raw !== 'object') return false;
  const data = raw as GameSaveData & { envelopeVersion?: unknown };
  if (data.envelopeVersion === SAVE_ENVELOPE_VERSION) return false;
  return typeof data.version === 'number' && typeof data.savedAt === 'number' && !!data.inventory;
}

export async function signCanonicalJson(payloadJson: string): Promise<string> {
  if (!globalThis.crypto?.subtle) return '';
  return hmacHex(payloadJson);
}

export async function verifyCanonicalJson(payloadJson: string, sig: string): Promise<boolean> {
  if (!sig || !globalThis.crypto?.subtle) return false;
  const expected = await signCanonicalJson(payloadJson);
  return timingSafeEqual(expected, sig);
}

export async function buildSignedEnvelope(payload: GameSaveData): Promise<SignedSaveEnvelope> {
  const payloadJson = canonicalizeSavePayload(payload);
  return {
    envelopeVersion: SAVE_ENVELOPE_VERSION,
    payloadJson,
    sig: await signCanonicalJson(payloadJson),
  };
}

/** Trích payload từ envelope đã parse (không verify). */
export function extractPayloadFromEnvelope(env: SignedSaveEnvelope): GameSaveData | null {
  if (env.payloadJson) {
    try {
      return JSON.parse(env.payloadJson) as GameSaveData;
    } catch {
      return env.payload ?? null;
    }
  }
  return env.payload ?? null;
}

export async function verifySignedEnvelope(env: SignedSaveEnvelope): Promise<boolean> {
  if (env.payloadJson) {
    return verifyCanonicalJson(env.payloadJson, env.sig);
  }
  if (env.payload) {
    const canonical = canonicalizeSavePayload(env.payload);
    return verifyCanonicalJson(canonical, env.sig);
  }
  return false;
}
