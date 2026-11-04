import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type Role = "owner" | "member";

export interface SessionPayload {
  phone: string;
  role: Role;
  exp: number;
}

const COOKIE_NAME = "kana_session";
export const SESSION_COOKIE = COOKIE_NAME;

type GlobalSecret = { __kanaSessionSecret?: string };
const globalStore = globalThis as unknown as GlobalSecret;

// Fallback deterministik khusus pengembangan lokal dan mode demo.
// Bundle halaman dan route handler Next berjalan di konteks modul terpisah,
// jadi nilai acak per proses tidak konsisten antar bundle dan sesi gagal
// diverifikasi di halaman. Production wajib mengisi SESSION_SECRET.
const DEV_FALLBACK_SECRET = "kana-web-dev-only-secret-ganti-di-production";

function getSecret(): string {
  const envSecret = process.env.SESSION_SECRET;
  if (envSecret && envSecret.length > 0) return envSecret;
  if (!globalStore.__kanaSessionSecret) globalStore.__kanaSessionSecret = DEV_FALLBACK_SECRET;
  return globalStore.__kanaSessionSecret;
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("hex");
}

export function createSessionToken(phone: string, role: Role): string {
  const payload: SessionPayload = {
    phone,
    role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  const expected = sign(encoded);
  try {
    const a = Buffer.from(signature, "utf-8");
    const b = Buffer.from(expected, "utf-8");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as SessionPayload;
    if (!payload.phone || !payload.exp) return null;
    if (Date.now() > payload.exp) return null;
    if (payload.role !== "owner" && payload.role !== "member") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export function cookieSecureForRequest(req: Request): boolean {
  try {
    const host = req.headers.get("host") || "";
    if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) return false;
    const proto = req.headers.get("x-forwarded-proto");
    if (proto) return proto.includes("https");
    const url = new URL(req.url);
    if (url.protocol === "https:") return true;
    if (process.env.NODE_ENV === "production") return true;
    return false;
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export function sessionCookieOptions(req: Request) {
  return {
    httpOnly: true,
    secure: cookieSecureForRequest(req),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  };
}
