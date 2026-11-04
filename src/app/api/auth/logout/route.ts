import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });
  const opts = sessionCookieOptions(req);
  res.cookies.set(SESSION_COOKIE, "", { ...opts, maxAge: 0 });
  return res;
}
