import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAdapter } from "@/lib/data";
import { levelFromXp } from "@/lib/profile";
import { getPlugins } from "@/lib/plugins";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Belum masuk" }, { status: 401 });
  }
  if (session.role !== "owner") {
    return NextResponse.json({ ok: false, error: "Hanya owner" }, { status: 403 });
  }
  const adapter = getAdapter();
  const keys = (await adapter.listUserKeys()).filter((k) => /^\d+$/.test(k));
  const rows = await Promise.all(
    keys.map(async (key) => {
      const p = await adapter.getUserProfile(key);
      const xp = p?.xp ?? 0;
      return { phone: key, name: p?.name || "", xp, level: levelFromXp(xp) };
    })
  );
  rows.sort((a, b) => b.xp - a.xp);
  const leaderboard = rows.slice(0, 10);
  let pluginCount = 0;
  try {
    pluginCount = (await getPlugins()).length;
  } catch {
    pluginCount = 0;
  }
  let botStatus = null;
  try {
    botStatus = await adapter.getBotStatus();
  } catch {
    botStatus = null;
  }
  return NextResponse.json({
    totalUsers: keys.length,
    leaderboard,
    pluginCount,
    botStatus,
    botStatusNote: botStatus ? undefined : "menunggu data bot",
    generatedAt: new Date().toISOString(),
  });
}
