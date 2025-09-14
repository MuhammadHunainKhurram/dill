// lib/google.ts
import { google } from "googleapis";
import { cookies } from "next/headers";

type CookieOpts = Parameters<ReturnType<typeof cookies>["set"]>[2];

function cookieOpts(maxAgeSeconds: number): CookieOpts {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
    secure: process.env.NODE_ENV === "production",
  };
}

export function getOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Google OAuth env vars missing");
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

export function getAuthUrl(state?: string) {
  const client = getOAuthClient();
  const scopes =
    (process.env.GOOGLE_SCOPES ||
      "https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive.file")
      .split(/\s+/)
      .filter(Boolean);

  // offline + consent: allows issuing a refresh_token (first consent per user+client)
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state,
  });
}

export async function setTokensFromCode(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  const jar = cookies();

  if (tokens.access_token) {
    jar.set("g_at", tokens.access_token, cookieOpts(60 * 60)); // ~1h
  }
  if (tokens.refresh_token) {
    jar.set("g_rt", tokens.refresh_token, cookieOpts(60 * 60 * 24 * 30)); // 30 days
  }
  if (tokens.expiry_date) {
    // store as epoch ms
    jar.set("g_exp", String(tokens.expiry_date), cookieOpts(60 * 60 * 24 * 30));
  }
}

function readTokenCookies() {
  const jar = cookies();
  const access = jar.get("g_at")?.value || "";
  const refresh = jar.get("g_rt")?.value || "";
  const expStr = jar.get("g_exp")?.value || "";
  const expiry = expStr ? Number(expStr) : 0;
  return { access, refresh, expiry };
}

/**
 * Returns a google client set up with any tokens we have.
 * - If access token looks expired AND no refresh token is present -> throws {code:'NEED_AUTH'}
 * - If refresh token exists, we'll try to refresh and update the cookie (but never crash if it fails)
 */
export async function getAuthorizedGoogle() {
  const { access, refresh, expiry } = readTokenCookies();
  const client = getOAuthClient();

  client.setCredentials({
    access_token: access || undefined,
    refresh_token: refresh || undefined,
    expiry_date: expiry || undefined,
  });

  // If we have a refresh token, let the library refresh silently if needed.
  if (refresh) {
    try {
      const t = await client.getAccessToken(); // may refresh
      if (t?.token) {
        cookies().set("g_at", t.token, cookieOpts(60 * 60));
        // we don't get a new expiry here reliably; ignore and rely on retries
      }
    } catch (err) {
      // don't throw; we can still attempt the call and return a nice error if it fails
      console.warn("Google token refresh failed:", (err as any)?.message);
    }
  } else {
    // No refresh token. If we look expired (now >= expiry - 30s), require re-auth.
    const now = Date.now();
    if (expiry && now >= expiry - 30_000) {
      const e: any = new Error("Google auth required");
      e.code = "NEED_AUTH";
      throw e;
    }
  }

  google.options({ auth: client });
  return google;
}
