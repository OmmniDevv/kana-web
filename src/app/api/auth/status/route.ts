import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/data";
import { normalizePhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("phone") || "";
  const phone = normalizePhone(raw);
  if (!phone) {
    return NextResponse.json({ status: "none" });
  }
  const adapter = getAdapter();
  try {
    const record = await adapter.getLoginRequest(phone);
    if (!record) return NextResponse.json({ status: "none" });
    if (record.expiresAt && Date.now() > new Date(record.expiresAt).getTime() && record.status !== "used") {
      const expired = { ...record, status: "expired" as const };
      await adapter.putLoginRequest(phone, expired);
      return NextResponse.json({ status: "expired" });
    }
    return NextResponse.json({ status: record.status });
  } catch {
    return NextResponse.json({ status: "none" });
  }
}
