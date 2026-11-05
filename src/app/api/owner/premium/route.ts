import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAdapter } from "@/lib/data";
import type { AccessRecord } from "@/lib/data";
import { normalizePhone } from "@/lib/phone";
import { nextExpiresAt, recordStatus } from "@/lib/premium";

export const dynamic = "force-dynamic";

// Panel premium dan sewa untuk owner di web. Menulis namespace yang sama
// dengan bot ("premium" dan "sewa_bot" di bot.kv) dengan bentuk record
// yang sama dengan service bot, jadi perubahan dari web langsung dibaca
// bot lewat jembatan REST dan sebaliknya. Semua aksi memeriksa sesi
// role owner di server.

async function requireOwner() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ ok: false, error: "Belum masuk" }, { status: 401 }) };
  if (session.role !== "owner") return { error: NextResponse.json({ ok: false, error: "Hanya owner" }, { status: 403 }) };
  return { session };
}

function withStatus(key: string, record: AccessRecord) {
  const status = recordStatus(record);
  return {
    key,
    record,
    active: status.active,
    expired: status.expired,
    permanent: status.permanent,
    expiresAt: status.expiresAt,
  };
}

export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const adapter = getAdapter();
  try {
    const [premium, sewa] = await Promise.all([adapter.listPremium(), adapter.listSewa()]);
    return NextResponse.json({
      ok: true,
      premium: premium.map((r) => withStatus(r.key, r.record)),
      sewa: sewa.map((r) => withStatus(r.key, r.record)),
    });
  } catch (err) {
    console.error("owner premium list error", err);
    return NextResponse.json({ ok: false, error: "Gagal membaca data premium" }, { status: 500 });
  }
}

interface Body {
  action?: string;
  phone?: string;
  target?: string;
  kind?: string;
  days?: number | null;
  permanent?: boolean;
}

function parseDays(body: Body): number | null | "invalid" {
  if (body.permanent) return null;
  const days = body.days === undefined || body.days === null ? 30 : Number(body.days);
  if (!Number.isFinite(days) || days <= 0 || days > 3650) return "invalid";
  return Math.floor(days);
}

export async function POST(req: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const session = auth.session!;
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Body tidak valid" }, { status: 400 });
  }
  const adapter = getAdapter();
  const action = String(body.action || "");

  try {
    if (action === "addPremium" || action === "deletePremium") {
      const phone = normalizePhone(body.phone || "");
      if (!phone) return NextResponse.json({ ok: false, error: "Nomor tidak valid" }, { status: 400 });
      if (action === "deletePremium") {
        await adapter.deletePremium(phone);
        return NextResponse.json({ ok: true });
      }
      const days = parseDays(body);
      if (days === "invalid") return NextResponse.json({ ok: false, error: "Durasi tidak valid" }, { status: 400 });
      const existing = await adapter.getPremiumRecord(phone);
      const record: AccessRecord = {
        expiresAt: nextExpiresAt(existing, days),
        addedBy: session.phone,
        addedAt: Date.now(),
        note: "panel web",
      };
      await adapter.putPremium(phone, record);
      return NextResponse.json({ ok: true, entry: withStatus(phone, record) });
    }

    if (action === "addSewa" || action === "deleteSewa") {
      const kind = body.kind === "jadibot" ? "jadibot" : "group";
      let key = String(body.target || "").trim();
      if (kind === "jadibot") {
        const phone = normalizePhone(key);
        if (!phone) return NextResponse.json({ ok: false, error: "Nomor jadibot tidak valid" }, { status: 400 });
        key = phone;
      } else if (!/^[\w-]+@g\.us$/.test(key)) {
        return NextResponse.json({ ok: false, error: "JID grup tidak valid, contoh 120363xxxx@g.us" }, { status: 400 });
      }
      if (action === "deleteSewa") {
        await adapter.deleteSewa(key);
        return NextResponse.json({ ok: true });
      }
      const days = parseDays(body);
      if (days === "invalid") return NextResponse.json({ ok: false, error: "Durasi tidak valid" }, { status: 400 });
      const existing = await adapter.getSewaRecord(key);
      const record: AccessRecord = {
        expiresAt: nextExpiresAt(existing, days),
        addedBy: session.phone,
        addedAt: Date.now(),
        type: kind,
        note: "panel web",
      };
      await adapter.putSewa(key, record);
      return NextResponse.json({ ok: true, entry: withStatus(key, record) });
    }

    return NextResponse.json({ ok: false, error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (err) {
    console.error("owner premium action error", err);
    return NextResponse.json({ ok: false, error: "Server gagal menyimpan perubahan" }, { status: 500 });
  }
}
