import Link from "next/link";
import { getAdapter } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const adapter = getAdapter();
  let topUsers: Array<{ name: string; xp: number; level: number }> = [];
  let topCommands: Array<{ name: string; count: number }> = [];
  let totalCommands: number | null = null;
  try {
    topUsers = await adapter.getTopUsers();
  } catch {
    topUsers = [];
  }
  try {
    const stats = await adapter.getBotStatus();
    if (stats) {
      totalCommands = stats.totalCommands ?? stats.commandsTotal ?? null;
      if (Array.isArray(stats.topCommands)) {
        topCommands = stats.topCommands
          .map((c) => (typeof c === "string" ? { name: c, count: 0 } : { name: String(c?.name ?? ""), count: Number(c?.count) || 0 }))
          .filter((c) => c.name)
          .slice(0, 10);
      }
    }
  } catch {
    topCommands = [];
  }

  return (
    <div className="bg-bgsoft">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-fuchsia">Leaderboard</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Papan peringkat KANA</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
          Peringkat XP member dan perintah paling sering dipakai, dari data yang ditulis bot ke penyimpanan bersama.
          Nama ditampilkan tanpa nomor HP. Bila datanya masih kosong, halaman ini bilang apa adanya, tidak ada angka contoh.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <section className="rounded-3xl border border-line bg-panel p-7">
            <h2 className="text-2xl font-black tracking-tight">🏆 Top XP Member</h2>
            {topUsers.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-muted">
                Snapshot peringkat belum ditulis bot. Bot menulisnya berkala bersama statistik dashboard, jadi peringkat akan muncul di sini sesudah bot berjalan dengan versi terbaru dan ada member yang mengumpulkan XP.
              </p>
            ) : (
              <ol className="mt-5 space-y-2 text-sm">
                {topUsers.map((row, idx) => (
                  <li key={`${row.name}-${idx}`} className="flex items-center justify-between rounded-2xl bg-bgsoft px-4 py-3">
                    <span className="font-semibold">{idx + 1}. {row.name || "Member KANA"}</span>
                    <span className="font-bold text-violet">Lv {row.level}, {row.xp} XP</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded-3xl border border-line bg-panel p-7">
            <h2 className="text-2xl font-black tracking-tight">🔥 Perintah Terpopuler</h2>
            {totalCommands !== null ? <p className="mt-2 text-sm text-muted">Total perintah dijalankan sejauh ini: {totalCommands}</p> : null}
            {topCommands.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-muted">
                Hitungan per perintah belum tersedia. Bot versi terbaru mulai menghitung perintah terpopuler dan menuliskannya bersama statistik, jadi daftar ini terisi sesudah bot berjalan dan menerima perintah.
              </p>
            ) : (
              <ol className="mt-5 space-y-2 text-sm">
                {topCommands.map((row, idx) => (
                  <li key={row.name} className="flex items-center justify-between rounded-2xl bg-bgsoft px-4 py-3">
                    <span className="font-mono font-semibold">{idx + 1}. .{row.name}</span>
                    <span className="font-bold text-violet">{row.count}x</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/plugins" className="bg-gradient-brand rounded-full px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">Lihat Plugin Bot</Link>
          <Link href="/status" className="rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-violet">Status Bot</Link>
        </div>
      </div>
    </div>
  );
}
