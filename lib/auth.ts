import "server-only";
import { SignJWT } from "jose";
import { cookies, headers } from "next/headers";
import { supabase } from "./supabase";

export const SESSION_COOKIE = "session";
const MAX_ATTEMPTS = 3;
const WINDOW_MIN = 15;

export function sessionSecret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not configured");
  return new TextEncoder().encode(s);
}

export async function startSession() {
  const token = await new SignJWT({ ok: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(sessionSecret());
  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Best-effort client IP from proxy headers; falls back to "local" in dev. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") || "local";
}

/** True when this IP is still under the limit (i.e. allowed to try). */
export async function underRateLimit(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
  const { count } = await supabase
    .from("auth_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);
  return (count ?? 0) < MAX_ATTEMPTS;
}

export async function recordFailedAttempt(ip: string) {
  await supabase.from("auth_attempts").insert({ ip });
}

export async function clearAttempts(ip: string) {
  await supabase.from("auth_attempts").delete().eq("ip", ip);
}
