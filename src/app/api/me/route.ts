import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAdapter } from "@/lib/data";
import { defaultProfile } from "@/lib/data/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Belum masuk" }, { status: 401 });
  }
  const adapter = getAdapter();
  let profile = defaultProfile();
  let hasProfile = false;
  try {
    const found = await adapter.getUserProfile(session.phone);
    if (found) {
      profile = found;
      hasProfile = true;
    }
  } catch {
    hasProfile = false;
  }
  return NextResponse.json({
    phone: session.phone,
    role: session.role,
    profile,
    hasProfile,
    note: hasProfile ? undefined : "Profil bot belum ditemukan, menampilkan profil default kosong.",
    mode: adapter.mode,
  });
}
