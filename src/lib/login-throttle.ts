import "server-only";
import { headers } from "next/headers";

/**
 * Brute-force throttling for the single admin login.
 *
 * There is exactly one account, so an attacker only has to guess one password —
 * bcrypt slows each try down, but nothing stopped them from trying forever.
 * This locks an IP out after a few failures, with a global backstop so the lock
 * can't simply be sidestepped by rotating source addresses.
 *
 * State is in-process: the site runs as a single instance, and a restart
 * clearing the counters is not a weakness an attacker can trigger.
 */

const MAX_ATTEMPTS_PER_IP = 5;
const IP_WINDOW_MS = 15 * 60 * 1000; // failures older than this are forgotten
const IP_LOCK_MS = 15 * 60 * 1000; // how long a locked-out IP stays out

// Backstop for attempts spread across many addresses.
const MAX_ATTEMPTS_GLOBAL = 30;
const GLOBAL_WINDOW_MS = 15 * 60 * 1000;
const GLOBAL_LOCK_MS = 5 * 60 * 1000;

type Bucket = { failures: number[]; lockedUntil: number };

const byIp = new Map<string, Bucket>();
const global: Bucket = { failures: [], lockedUntil: 0 };

/** Keeps the map from growing without bound on a long-running process. */
function sweep(now: number) {
  for (const [ip, b] of byIp) {
    const fresh = b.failures.filter((t) => now - t < IP_WINDOW_MS);
    if (fresh.length === 0 && b.lockedUntil < now) byIp.delete(ip);
    else b.failures = fresh;
  }
}

/**
 * Caller's address. Behind Caddy the real IP is the first X-Forwarded-For hop;
 * unknown sources share one bucket, which is the conservative choice.
 */
async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

export type ThrottleCheck = { allowed: true } | { allowed: false; retryAfterMin: number };

/** Call before checking a password. */
export async function checkLoginAllowed(): Promise<ThrottleCheck> {
  const now = Date.now();
  sweep(now);

  if (global.lockedUntil > now) {
    return { allowed: false, retryAfterMin: Math.ceil((global.lockedUntil - now) / 60000) };
  }
  const ip = await clientIp();
  const bucket = byIp.get(ip);
  if (bucket && bucket.lockedUntil > now) {
    return { allowed: false, retryAfterMin: Math.ceil((bucket.lockedUntil - now) / 60000) };
  }
  return { allowed: true };
}

/** Call after a failed password check. */
export async function recordLoginFailure(): Promise<void> {
  const now = Date.now();
  const ip = await clientIp();

  const bucket = byIp.get(ip) ?? { failures: [], lockedUntil: 0 };
  bucket.failures = bucket.failures.filter((t) => now - t < IP_WINDOW_MS);
  bucket.failures.push(now);
  if (bucket.failures.length >= MAX_ATTEMPTS_PER_IP) {
    bucket.lockedUntil = now + IP_LOCK_MS;
    bucket.failures = [];
  }
  byIp.set(ip, bucket);

  global.failures = global.failures.filter((t) => now - t < GLOBAL_WINDOW_MS);
  global.failures.push(now);
  if (global.failures.length >= MAX_ATTEMPTS_GLOBAL) {
    global.lockedUntil = now + GLOBAL_LOCK_MS;
    global.failures = [];
  }
}

/** Call after a successful login, so one good password clears the record. */
export async function clearLoginFailures(): Promise<void> {
  byIp.delete(await clientIp());
}
