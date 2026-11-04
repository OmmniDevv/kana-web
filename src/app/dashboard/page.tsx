import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAdapter, isDemoMode } from "@/lib/data";
import { defaultProfile } from "@/lib/data/types";
import { formatDateValue, limitLeftToday, xpProgress } from "@/lib/profile";
import { getPlugins } from "@/lib/plugins";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const adapter = getAdapter();
  const demo = isDemoMode();
  const profile = (await adapter.getUserProfile(session.phone)) ?? defaultProfile();
  const progress = xpProgress(profile.xp);
  const limitLeft = limitLeftToday(profile);
  const inventoryEntries = Object.entries(profile.inventory || {});

  let ownerPanel: React.ReactNode = null;
  if (session.role === "owner") {
    let totalUsers = 0;
    let leaderboard: Array<{ phone: string; name: string; xp: number; level: number }> = [];
    let pluginCount = 0;
    let botStatus: Awaited<ReturnType<typeof adapter.getBotStatus>> = null;
    try {
      const keys = (await adapter.listUserKeys()).filter((k) => /^\d+$/.test(k));
      totalUsers = keys.length;
      const rows = await Promise.all(
        keys.map(async (key) => {
          const p = await adapter.getUserProfile(key);
          const xp = p?.xp ?? 0;
          return { phone: key, name: p?.name || "", xp, level: Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1 };
        })
      );
      rows.sort((a, b) => b.xp - a.xp);
      leaderboard = rows.slice(0, 10);
    } catch {
      totalUsers = 0;
      leaderboard = [];
    }
    try {
      const plugins = await getPlugins();
      pluginCount = plugins.length;
    } catch {
      pluginCount = 0;
    }
    try {
      botStatus = await adapter.getBotStatus();
    } catch {
      botStatus = null;
    }

    ownerPanel = (
      <section className="mt-10">
        <h2 className="text-2xl font-extrabold">Panel Owner, Statistik Bot</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
            <p className="animate-popIn text-4xl font-black text-[#3dff5e]">{totalUsers}</p>
            <p className="mt-1 text-sm text-[#9db8a4]">Total pengguna terdaftar</p>
          </div>
          <div className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
            <p className="animate-popIn text-4xl font-black text-[#3dff5e]">{pluginCount}</p>
            <p className="mt-1 text-sm text-[#9db8a4]">Jumlah plugin aktif di katalog</p>
          </div>
          <div className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
            <p className="animate-popIn text-2xl font-black text-[#3dff5e]">{botStatus ? String(botStatus.commandsTotal ?? "Ada data") : "Menunggu data bot"}</p>
            <p className="mt-1 text-sm text-[#9db8a4]">{botStatus ? "Total perintah dari heartbeat bot" : "Bot belum menulis heartbeat, metrik ini menunggu data bot"}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
            <h3 className="font-bold">Papan Peringkat XP Top 10</h3>
            {leaderboard.length === 0 ? (
              <p className="mt-3 text-sm text-[#9db8a4]">Belum ada data pengguna.</p>
            ) : (
              <ol className="mt-4 space-y-2 text-sm">
                {leaderboard.map((row, idx) => (
                  <li key={row.phone} className="flex items-center justify-between rounded-xl bg-[#101a13] px-4 py-3">
                    <span>{idx + 1}. {row.name || row.phone} <span className="text-[#9db8a4]">({row.phone})</span></span>
                    <span className="font-bold text-[#a3ff5e]">Lv {row.level}, {row.xp} XP</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
            <h3 className="font-bold">Status Bot</h3>
            {botStatus ? (
              <div className="mt-4 space-y-2 text-sm text-[#cfe8d4]">
                <p>Online sejak: {formatDateValue(botStatus.onlineSince)}</p>
                <p>Terakhir terlihat: {formatDateValue(botStatus.lastSeen)}</p>
                <p>Total perintah: {String(botStatus.commandsTotal ?? "-")}</p>
                {botStatus.topCommands ? <p>Perintah teratas: {JSON.stringify(botStatus.topCommands)}</p> : null}
                {botStatus.scraperHealth ? (
                  <div>
                    <p className="mt-3 font-bold">Kesehatan Scraper</p>
                    <pre className="mt-2 overflow-auto rounded-xl bg-black/50 p-3 text-xs">{JSON.stringify(botStatus.scraperHealth, null, 2)}</pre>
                  </div>
                ) : <p>Kesehatan scraper: menunggu data bot</p>}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#9db8a4]">Menunggu data bot. Bot belum menulis heartbeat ke namespace bot_status, jadi metrik status langsung belum tersedia. Total pengguna dan papan peringkat tetap dihitung dari data pengguna.</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  const petText = profile.pet
    ? typeof profile.pet === "object"
      ? JSON.stringify(profile.pet)
      : String(profile.pet)
    : "Belum punya pet. Mainkan fitur RPG di bot untuk adopsi pet pertama kamu yaa~";

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-12">
      {demo ? (
        <div className="mb-6 rounded-[20px] border border-[#ffd23d] bg-[#ffd23d]/15 p-4 text-center font-bold text-[#ffd23d]">MODE DEMO, data contoh. Halaman ini memakai data fiktif karena database belum terhubung.</div>
      ) : null}

      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a3ff5e]">{session.role === "owner" ? "Dashboard Owner" : "Dashboard Member"}</p>
      <h1 className="mt-3 text-4xl font-black">Halo, {profile.name || session.phone}~</h1>
      <p className="mt-2 text-[#9db8a4]">Nomor {session.phone} {profile.banned ? ", status akun diblokir" : ""}</p>
      {!profile.registeredAt ? <p className="mt-2 text-sm text-[#9db8a4]">Catatan: profil bot belum ditemukan, jadi yang tampil adalah profil default kosong. Chat bot KANA sekali agar profilmu dibuat.</p> : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
          <p className="animate-popIn text-4xl font-black text-[#3dff5e]">Lv {progress.level}</p>
          <p className="mt-1 text-sm text-[#9db8a4]">Level kamu</p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/60">
            <div className="h-full rounded-full bg-[#3dff5e]" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-[#9db8a4]">{progress.xpInLevel} dari {progress.xpNeeded} XP menuju level {progress.level + 1} ({progress.percent}%)</p>
        </div>
        <div className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
          <p className="animate-popIn text-4xl font-black text-[#3dff5e]">{profile.xp}</p>
          <p className="mt-1 text-sm text-[#9db8a4]">Total XP</p>
        </div>
        <div className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
          <p className="animate-popIn text-4xl font-black text-[#3dff5e]">{limitLeft}</p>
          <p className="mt-1 text-sm text-[#9db8a4]">Limit tersisa hari ini dari 30</p>
        </div>
        <div className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
          <p className="animate-popIn text-4xl font-black text-[#3dff5e]">{profile.balance}</p>
          <p className="mt-1 text-sm text-[#9db8a4]">Saldo</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
          <h2 className="font-bold">Profil</h2>
          <div className="mt-4 space-y-2 text-sm text-[#cfe8d4]">
            <p>Nama: {profile.name || "Belum diisi"}</p>
            <p>Pekerjaan: {profile.job || "Belum ada"}</p>
            <p>Klan: {profile.clanId || "Belum bergabung"}</p>
            <p>Terdaftar sejak: {formatDateValue(profile.registeredAt)}</p>
          </div>
          <h3 className="mt-6 font-bold">Pet</h3>
          <p className="mt-2 break-words text-sm text-[#cfe8d4]">{petText}</p>
        </div>
        <div className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
          <h2 className="font-bold">Inventaris</h2>
          {inventoryEntries.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-[#9db8a4]">Tas kamu masih kosong nih~ Main di bot KANA dulu ya biar dapat item seru.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {inventoryEntries.map(([item, count]) => (
                <li key={item} className="flex justify-between rounded-xl bg-[#101a13] px-4 py-3"><span>{item}</span><span className="font-bold text-[#a3ff5e]">x{String(count)}</span></li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
          <h2 className="font-bold">Riwayat Klaim</h2>
          <div className="mt-4 space-y-2 text-sm text-[#cfe8d4]">
            <p>Klaim harian terakhir: {formatDateValue(profile.lastDaily)}</p>
            <p>Klaim per jam terakhir: {formatDateValue(profile.lastHourly)}</p>
            <p>Klaim mingguan terakhir: {formatDateValue(profile.lastWeekly)}</p>
          </div>
        </div>
      </div>

      {ownerPanel}
    </div>
  );
}
