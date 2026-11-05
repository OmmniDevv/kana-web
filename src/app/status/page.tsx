import Link from "next/link";
import { getAdapter } from "@/lib/data";
import type { BotStatus } from "@/lib/data";
import { formatDateValue } from "@/lib/profile";
import { countCommands, getPlugins } from "@/lib/plugins";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";

function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="rounded-3xl border border-line bg-panel p-6">
      <p className="animate-popIn text-gradient break-words text-4xl font-black">{value}</p>
      <p className="mt-1 text-sm font-semibold">{label}</p>
      {sub ? <p className="mt-1 text-xs leading-5 text-muted">{sub}</p> : null}
    </div>
  );
}

export default async function StatusPage() {
  const adapter = getAdapter();
  let botStats: BotStatus | null = null;
  try {
    botStats = await adapter.getBotStatus();
  } catch {
    botStats = null;
  }
  let catalogPlugins = 0;
  let catalogCommands = 0;
  try {
    const plugins = await getPlugins();
    catalogPlugins = plugins.length;
    catalogCommands = countCommands(plugins);
  } catch {
    catalogPlugins = 0;
    catalogCommands = 0;
  }

  const updatedAt = botStats?.updatedAt ?? botStats?.lastSeen ?? null;
  const updatedMs = typeof updatedAt === "number" ? updatedAt : updatedAt ? Date.parse(String(updatedAt)) : NaN;
  const fresh = Number.isFinite(updatedMs) ? Date.now() - updatedMs < 5 * 60 * 1000 : false;
  const online = Boolean(botStats) && fresh;

  return (
    <div className="bg-bgsoft">
      <AutoRefresh seconds={60} />
      <div className="mx-auto w-full max-w-[1200px] px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-fuchsia">Status Bot</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">KANA lagi online atau tidak?</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
          Status ini dibaca dari statistik yang ditulis bot sendiri ke penyimpanan bersama. Bot dianggap online bila statistiknya diperbarui dalam 5 menit terakhir.
          Halaman ini menyegarkan datanya sendiri tiap 60 detik.
        </p>

        <div className="mt-8 rounded-3xl border border-line bg-panel p-8">
          <p className="flex items-center gap-3 text-2xl font-black">
            <span className={`inline-block h-4 w-4 rounded-full ${online ? "bg-violet" : "bg-warn"}`} />
            {botStats ? (online ? "Online" : "Tidak terdeteksi online") : "Data status belum tersedia"}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            {botStats
              ? online
                ? "Bot aktif menulis statistik, jadi KANA sedang berjalan."
                : "Statistik terakhir sudah lewat dari 5 menit. Bot mungkin sedang mati, restart, atau jembatan datanya lagi bermasalah."
              : "Bot belum pernah menulis statistik ke penyimpanan bersama, jadi statusnya belum bisa dipastikan dari web."}
          </p>
          <div className="mt-5 space-y-2 text-sm">
            <p>Bot mulai berjalan: {formatDateValue(botStats?.startedAt ?? botStats?.onlineSince)}</p>
            <p>Statistik terakhir diperbarui: {formatDateValue(updatedAt)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard value={String(botStats?.pluginCount ?? catalogPlugins)} label="Plugin aktif" sub={`${catalogPlugins} plugin di katalog GitHub`} />
          <StatCard value={String(catalogCommands)} label="Perintah di katalog" sub="Termasuk alias, dari metadata plugin repo" />
          <StatCard value={botStats?.totalUsers !== undefined && botStats?.totalUsers !== null ? String(botStats.totalUsers) : "Belum tersedia"} label="Member terdaftar" sub="Dari statistik bot" />
          <StatCard
            value={botStats?.totalCommands !== undefined && botStats?.totalCommands !== null ? String(botStats.totalCommands) : botStats?.commandsTotal !== undefined && botStats?.commandsTotal !== null ? String(botStats.commandsTotal) : "Belum tersedia"}
            label="Total perintah dijalankan"
            sub="Kumulatif sejak bot mulai berjalan"
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/leaderboard" className="bg-gradient-brand rounded-full px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">Lihat Leaderboard</Link>
          <Link href="/plugins" className="rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-violet">Katalog Plugin</Link>
        </div>
      </div>
    </div>
  );
}
