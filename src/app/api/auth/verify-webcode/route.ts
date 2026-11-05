import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/data";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

// Verifikasi jalur .webcode: user hanya memasukkan KODE, tanpa nomor HP.
// Bot menyimpan satu record per nomor di namespace web_login dengan hanya
// hash kodenya, jadi server memindai record aktif dan mencocokkan hash
// (meniru verifyWebCode di kana-md persis: cocok berarti record dihapus
// karena sekali pakai, kedaluwarsa berarti record dihapus dan ditolak).
// Semua kegagalan menjawab pesan generik yang sama supaya tidak membocorkan
// apakah sebuah kode benar-benar ada.
// Alfabet kode bot membuang karakter ambigu (0, O, 1, l, I).
const CODE_PATTERN = /^[A-HJ-NP-Za-km-z2-9]{6}$/;
const GENERIC_ERROR = "Kode tidak cocok atau sudah kedaluwarsa. Minta kode baru lewat .webcode di WhatsApp ya.";

function parseExpiresMs(value: number | string): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return NaN;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return Date.parse(trimmed);
}

export async function POST(req: Request) {
  let body: { code?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body tidak valid" }, { status: 400 });
  }
  const code = String(body.code || "").trim();
  if (!CODE_PATTERN.test(code)) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }

  const adapter = getAdapter();
  try {
    const hash = createHash("sha256").update(code).digest("hex");
    const candidate = Buffer.from(hash, "utf-8");
    const entries = await adapter.listWebLoginCodes();

    let matchedPhone: string | null = null;
    let matchedExpired = false;
    for (const entry of entries) {
      const expected = Buffer.from(entry.record.codeHash || "", "utf-8");
      if (expected.length !== candidate.length) continue;
      if (!timingSafeEqual(expected, candidate)) continue;
      matchedPhone = entry.phone;
      const expiresMs = parseExpiresMs(entry.record.expiresAt);
      matchedExpired = !Number.isFinite(expiresMs) || Date.now() >= expiresMs;
      break;
    }

    if (!matchedPhone) {
      return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
    }
    if (matchedExpired) {
      await adapter.deleteWebLoginCode(matchedPhone);
      return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
    }

    // Sekali pakai: record dihapus sebelum sesi dibuat.
    await adapter.deleteWebLoginCode(matchedPhone);

    const ownerNumber = (process.env.OWNER_NUMBER || "").replace(/\D/g, "");
    const role = ownerNumber && matchedPhone === ownerNumber ? "owner" as const : "member" as const;
    const token = createSessionToken(matchedPhone, role);
    const res = NextResponse.json({ ok: true, role });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(req));
    return res;
  } catch (err) {
    console.error("verify-webcode error", err);
    return NextResponse.json({ ok: false, error: "Server gagal memverifikasi kode" }, { status: 500 });
  }
}
