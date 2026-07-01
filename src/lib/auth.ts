import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { JWTPayload } from "jose";
import { COOKIE_NAME, SESSION_MAX_AGE, signSession, verifyToken } from "@/lib/session";

/** Verify a login attempt against the single env-configured admin account. */
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const expectedUser = process.env.ADMIN_USERNAME;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedUser || !hash) return false;
  // Always run bcrypt so a wrong username doesn't return noticeably faster.
  const passwordMatch = await bcrypt.compare(password, hash);
  return username === expectedUser && passwordMatch;
}

export async function createSession(): Promise<void> {
  const token = await signSession({ role: "admin", sub: process.env.ADMIN_USERNAME });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getSession(): Promise<JWTPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Guard for server actions/pages: redirect to login unless a valid admin session. */
export async function requireAdmin(): Promise<JWTPayload> {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/area-da-nic");
  return session;
}
