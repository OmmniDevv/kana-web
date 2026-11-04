import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getAdapter, isDemoMode } from "@/lib/data";
import type { BotStatus, UserProfile } from "@/lib/data";
import { formatDateValue, levelFromXp, limitLeftToday, xpProgress } from "@/lib/profile";
import { countCommands, getPlugins } from "@/lib/plugins";

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

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const adapter = getAdapter();
  const demo = isDemoMode();

  let profile: UserProfile | null = null;
  try {
    profile = await adapter.getUserProfile(session.phone);
  } catch {
    profile = null;
  }
  const hasProfile = profile !== null;
  const mp = profile as UserProfile;

  let ownerPanel: React.ReactNode = null;
  if (session.role === "owner") {
    let registeredUsers = 0;
    let leaderboard: Array<{ phone: string; name: string; xp: number; level: number }> = [];
    let catalogPlugins = 0;
    let catalogCommands = 0;
    let botStats: BotStatus | null = null;
    try {
      const keys = (await adapter.listUserKeys()).filter((k) => /^\d+$/.test(k));
      const rows = await Promise.all(
        keys.map(async (key) => {
          const p = await adapter.getUserProfile(key);
          return { phone: key, name: p?.name || "", xp: p?.xp ?? 0, registered: p?.registered ?? false };
        })
      );
      registeredUsers = rows.filter((r) => r.registered).length;
      rows.sort((a, b) => b.xp - a.xp);
      leaderboard = rows.slice(0, 10).map((r) => ({ phone: r.phone, name: r.name, xp: r.xp, level: levelFromXp(r.xp) }));
    } catch {
      registeredUsers = 0;
      leaderboard = [];
    }
    try {
      const plugins = await getPlugins();
      catalogPlugins = plugins.length;
      catalogCommands = countCommands(plugins);
    } catch {
      catalogPlugins = 0;
      catalogCommands = 0;
    }
    try {
      botStats = await adapter.getBotStatus();
    } catch {
      botStats = null;
    }

    const totalUsersDisplay = botStats?.totalUsers ?? registeredUsers;
    const totalCommandsDisplay = botStats?.totalCommands ?? botStats?.commandsTotal ?? null;
    const pluginCountDisplay = botStats?.pluginCount ?? catalogPlugins;
    const topCommand = Array.isArray(botStats?.topCommands) && botStats.topCommands.length > 0 ? botStats.topCommands[0] : null;
    const topCommandText = topCommand
      ? typeof topCommand === "string"
        ? topCommand
        : `${topCommand.name} (${topCommand.count}x)`
      : "Belum tersedia";
    const statsFresh = botStats?.updatedAt ? Date.now() - botStats.updatedAt < 5 * 60 * 1000 : false;

    ownerPanel = (
      <section className="mt-12">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-fuchsia">Panel Owner</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Statistik Bot</h2>
        {!botStats ? (
          <div className="mt-5 rounded-3xl border border-line bg-panel p-6">
            <p className="font-bold">Data statistik bot belum tersedia</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Bot belum menulis statistik ke penyimpanan bersama (namespace kv, key bot_stats), jadi angka dari sisi bot belum bisa ditampilkan. Ini biasanya terjadi bila bot berjalan dengan driver penyimpanan lokal, bukan database yang sama dengan web. Angka katalog GitHub di bawah tetap asli dari repo kana-md.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <StatCard value={String(catalogPlugins)} label="Plugin di katalog GitHub" sub="Dihitung langsung dari repo OmmniDevv/kana-md" />
              <StatCard value={String(catalogCommands)} label="Perintah di katalog GitHub" sub="Termasuk alias, dari metadata plugin repo" />
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard value={String(totalUsersDisplay)} label="Member terdaftar" sub="Dari bot_stats, cocok dengan hitungan profil terdaftar" />
              <StatCard value={totalCommandsDisplay !== null ? String(totalCommandsDisplay) : "Belum tersedia"} label="Total perintah dijalankan" sub="Kumulatif sejak bot mulai berjalan" />
              <StatCard value={String(pluginCountDisplay)} label="Plugin aktif di bot" sub={`${catalogPlugins} plugin dan ${catalogCommands} perintah di katalog GitHub`} />
              <StatCard value={topCommandText} label="Fitur terpopuler" sub={topCommand ? "Perintah paling sering dipakai" : "Bot belum menulis data perintah terpopuler ke bot_stats"} />
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-line bg-panel p-6">
                <h3 className="font-bold">Status Bot</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${statsFresh ? "bg-violet" : "bg-warn"}`} />
                    {statsFresh ? "Data statistik segar, bot aktif menulis data" : "Data statistik tidak diperbarui dalam 5 menit terakhir"}
                  </p>
                  <p>Bot mulai berjalan: {formatDateValue(botStats.startedAt ?? botStats.onlineSince)}</p>
                  <p>Statistik diperbarui: {formatDateValue(botStats.updatedAt ?? botStats.lastSeen)}</p>
                  <p className="leading-6 text-muted">Catatan jujur: bot_stats menyimpan total perintah kumulatif, bukan hitungan per hari, jadi metrik perintah hari ini belum tersedia dari data bot saat ini.</p>
                  {botStats.scraperHealth ? (
                    <div>
                      <p className="mt-3 font-bold">Kesehatan Scraper</p>
                      <pre className="mt-2 overflow-auto rounded-2xl bg-codebg p-3 font-mono text-xs text-codeink">{JSON.stringify(botStats.scraperHealth, null, 2)}</pre>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="rounded-3xl border border-line bg-panel p-6">
                <h3 className="font-bold">Papan Peringkat XP Top 10</h3>
                {leaderboard.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">Belum ada data pengguna di penyimpanan bersama.</p>
                ) : (
                  <ol className="mt-4 space-y-2 text-sm">
                    {leaderboard.map((row, idx) => (
                      <li key={row.phone} className="flex items-center justify-between rounded-2xl bg-bgsoft px-4 py-3">
                        <span>{idx + 1}. {row.name || row.phone} <span className="text-muted">({row.phone})</span></span>
                        <span className="font-bold text-violet">Lv {row.level}, {row.xp} XP</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    );
  }

  return (
    <div className="bg-bgsoft">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-12">
        {demo ? (
          <div className="mb-6 rounded-3xl border border-warn bg-warnbg p-4 text-center font-bold text-warn">MODE DEMO, data contoh. Halaman ini memakai data fiktif karena database belum terhubung.</div>
        ) : null}

        <p className="text-xs font-bold uppercase tracking-[0.25em] text-fuchsia">{session.role === "owner" ? "Dashboard Owner" : "Dashboard Member"}</p>

        {!hasProfile ? (
          <section className="mt-6 rounded-3xl border border-line bg-panel p-8">
            <h1 className="text-3xl font-black tracking-tight">Profil bot kamu belum ditemukan</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Nomor {session.phone} sudah masuk ke web, tapi bot KANA belum punya profil untuk nomor ini di penyimpanan bersama, jadi belum ada level, XP, limit, atau saldo yang bisa ditampilkan. KANA tidak mengarang angka, ya.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Cara mengisinya: chat bot KANA di WhatsApp, lakukan pendaftaran dengan perintah <span className="font-mono font-bold text-ink">.daftar</span>, lalu mainkan fitur bot seperti biasa. Setelah bot berjalan dengan penyimpanan yang sama dengan web, statistik kamu akan muncul di sini.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/plugins" className="bg-gradient-brand rounded-full px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">Lihat Plugin Bot</Link>
              <Link href="/" className="rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-violet">Kembali ke Beranda</Link>
            </div>
          </section>
        ) : (
          <>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Halo, {mp.name || session.phone}~</h1>
            <p className="mt-2 text-muted">
              Nomor {session.phone}
              {mp.registered ? ", member terdaftar" : ", belum terdaftar di bot"}
              {mp.banned ? ", status akun diblokir" : ""}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-line bg-panel p-6">
                <p className="animate-popIn text-gradient text-4xl font-black">Lv {xpProgress(mp.xp).level}</p>
                <p className="mt-1 text-sm font-semibold">Level kamu</p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-panel2">
                  <div className="bg-gradient-brand h-full rounded-full" style={{ width: `${xpProgress(mp.xp).percent}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted">{xpProgress(mp.xp).xpInLevel} dari {xpProgress(mp.xp).xpNeeded} XP menuju level {xpProgress(mp.xp).level + 1} ({xpProgress(mp.xp).percent}%)</p>
              </div>
              <StatCard value={String(mp.xp)} label="Total XP" />
              <StatCard value={String(limitLeftToday(mp))} label="Limit tersisa hari ini" sub="Dari kuota harian 30 perintah" />
              <StatCard value={String(mp.balance)} label="Saldo" sub="Saldo ekonomi bot KANA" />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-line bg-panel p-6">
                <h2 className="font-bold">Profil</h2>
                <div className="mt-4 space-y-2 text-sm">
                  <p>Nama: {mp.name || "Belum diisi"}</p>
                  <p>Pekerjaan: {mp.job || "Belum ada"}</p>
                  <p>Klan: {mp.clanId || "Belum bergabung"}</p>
                  <p>Terdaftar sejak: {formatDateValue(mp.registeredAt)}</p>
                  <p>Terakhir aktif: {formatDateValue(mp.lastSeen)}</p>
                </div>
                <h3 className="mt-6 font-bold">Pet</h3>
                <p className="mt-2 break-words text-sm text-muted">
                  {mp.pet
                    ? typeof mp.pet === "object"
                      ? JSON.stringify(mp.pet)
                      : String(mp.pet)
                    : "Belum punya pet. Mainkan fitur RPG di bot untuk adopsi pet pertama kamu yaa~"}
                </p>
              </div>
              <div className="rounded-3xl border border-line bg-panel p-6">
                <h2 className="font-bold">Inventaris</h2>
                {Object.entries(mp.inventory || {}).length === 0 ? (
                  <p className="mt-4 text-sm leading-6 text-muted">Tas kamu masih kosong nih~ Main di bot KANA dulu ya biar dapat item seru.</p>
                ) : (
                  <ul className="mt-4 space-y-2 text-sm">
                    {Object.entries(mp.inventory || {}).map(([item, count]) => (
                      <li key={item} className="flex justify-between rounded-2xl bg-bgsoft px-4 py-3"><span>{item}</span><span className="font-bold text-violet">x{String(count)}</span></li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-3xl border border-line bg-panel p-6">
                <h2 className="font-bold">Riwayat Klaim</h2>
                <div className="mt-4 space-y-2 text-sm">
                  <p>Klaim harian terakhir: {formatDateValue(mp.lastDaily)}</p>
                  <p>Klaim per jam terakhir: {formatDateValue(mp.lastHourly)}</p>
                  <p>Klaim mingguan terakhir: {formatDateValue(mp.lastWeekly)}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {ownerPanel}
      </div>
    </div>
  );
}
