import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/**
 * Edge-safe session primitives (JWT sign/verify only — no bcrypt, no
 * next/headers). Importable by both middleware (edge runtime) and server code.
 */
export const COOKIE_NAME = "nic_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const ALG = "HS256";

function key(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key());
    return payload;
  } catch {
    return null;
  }
}
