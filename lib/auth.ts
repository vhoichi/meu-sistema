import crypto from "crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./sessionCookie";

export { SESSION_COOKIE };
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable.");
  }
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: string): string {
  return base64url(
    crypto.createHmac("sha256", getSecret()).update(payload).digest()
  );
}

/** Create a signed session token for the given email. */
export function createSessionToken(email: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = base64url(JSON.stringify({ email, exp }));
  return `${payload}.${sign(payload)}`;
}

/** Verify a session token; returns the email if valid, otherwise null. */
export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  // Constant-time comparison to avoid timing attacks.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64").toString("utf8")
    ) as { email: string; exp: number };
    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded.email;
  } catch {
    return null;
  }
}

/** Validate submitted credentials against the configured env credentials. */
export function checkCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.APP_USER;
  const expectedPassword = process.env.APP_PASSWORD;
  if (!expectedEmail || !expectedPassword) {
    throw new Error("Missing APP_USER or APP_PASSWORD environment variables.");
  }
  // Length-independent constant-time-ish comparison.
  const emailOk =
    email.length === expectedEmail.length &&
    crypto.timingSafeEqual(Buffer.from(email), Buffer.from(expectedEmail));
  const passwordOk =
    password.length === expectedPassword.length &&
    crypto.timingSafeEqual(
      Buffer.from(password),
      Buffer.from(expectedPassword)
    );
  return emailOk && passwordOk;
}

/** Read the current session (email) from the request cookies, or null. */
export function getSession(): string | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
