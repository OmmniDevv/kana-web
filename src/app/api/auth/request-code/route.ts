import { createHash, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/data";
import { normalizePhone } from "@/lib/phone";
import { wibDateString } from "@/lib/profile";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { phone?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body tidak valid" }, { status: 400 });
  }
  const phone = normalizePhone(body.phone || "");
  if (!phone) {
    return NextResponse.json({ ok: false, error: "Nomor tidak valid. Gunakan format 62812xxxx atau 0812xxxx." }, { status: 400 });
  }

  const adapter = getAdapter();

  try {
    const existing = await adapter.getLoginRequest(phone);
    if (existing && existing.createdAt) {
      const created = new Date(existing.createdAt).getTime();
      if (!Number.isNaN(created) && Date.now() - created < 2 * 60 * 1000 && existing.status !== "used") {
        return NextResponse.json({ ok: false, error: "Kode baru saja diminta. Tunggu 2 menit sebelum minta lagi ya." }, { status: 429 });
      }
    }

    const dateKey = wibDateString();
    const dailyCount = await adapter.getDailyCount(phone, dateKey);
    if (dailyCount >= 5) {
      return NextResponse.json({ ok: false, error: "Batas minta kode hari ini sudah habis (5 kali). Coba lagi besok ya." }, { status: 429 });
    }

    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    const codeHash = createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const record = {
      codeHash,
      codePlain: code,
      expiresAt,
      status: "pending" as const,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };
    await adapter.putLoginRequest(phone, record);
    await adapter.bumpDailyCount(phone, dateKey);

    if (adapter.mode === "demo") {
      return NextResponse.json({ ok: true, expiresAt, demo: true, demoCode: code });
    }
    return NextResponse.json({ ok: true, expiresAt });
  } catch (err) {
    console.error("request-code error", err);
    return NextResponse.json({ ok: false, error: "Server gagal membuat kode. Coba lagi sebentar lagi." }, { status: 500 });
  }
}
