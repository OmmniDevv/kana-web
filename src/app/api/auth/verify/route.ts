import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/data";
import { normalizePhone } from "@/lib/phone";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { phone?: string; code?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body tidak valid" }, { status: 400 });
  }
  const phone = normalizePhone(body.phone || "");
  const code = String(body.code || "").trim();
  if (!phone || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "Nomor atau kode tidak valid" }, { status: 400 });
  }

  const adapter = getAdapter();
  try {
    const record = await adapter.getLoginRequest(phone);
    if (!record) {
      return NextResponse.json({ ok: false, error: "Belum ada permintaan kode untuk nomor ini" }, { status: 401 });
    }
    if (record.expiresAt && Date.now() > new Date(record.expiresAt).getTime()) {
      await adapter.putLoginRequest(phone, { ...record, status: "expired" });
      return NextResponse.json({ ok: false, error: "Kode sudah kedaluwarsa, minta kode baru ya" }, { status: 401 });
    }
    if (record.status === "used") {
      return NextResponse.json({ ok: false, error: "Kode sudah dipakai, minta kode baru ya" }, { status: 401 });
    }
    if ((record.attempts ?? 0) >= 5) {
      return NextResponse.json({ ok: false, error: "Percobaan terlalu banyak, minta kode baru ya" }, { status: 401 });
    }

    const hash = createHash("sha256").update(code).digest("hex");
    let match = false;
    try {
      const a = Buffer.from(hash, "utf-8");
      const b = Buffer.from(record.codeHash || "", "utf-8");
      match = a.length === b.length && timingSafeEqual(a, b);
    } catch {
      match = false;
    }

    if (!match) {
      const attempts = (record.attempts ?? 0) + 1;
      await adapter.putLoginRequest(phone, { ...record, attempts });
      return NextResponse.json({ ok: false, error: "Kode salah, periksa lagi ya" }, { status: 401 });
    }

    const usedRecord = { ...record, status: "used" as const };
    delete (usedRecord as Record<string, unknown>).codePlain;
    await adapter.putLoginRequest(phone, usedRecord as typeof record);

    const ownerNumber = (process.env.OWNER_NUMBER || "").replace(/\D/g, "");
    const role = ownerNumber && phone === ownerNumber ? "owner" as const : "member" as const;
    const token = createSessionToken(phone, role);
    const res = NextResponse.json({ ok: true, role });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(req));
    return res;
  } catch (err) {
    console.error("verify error", err);
    return NextResponse.json({ ok: false, error: "Server gagal memverifikasi kode" }, { status: 500 });
  }
}
