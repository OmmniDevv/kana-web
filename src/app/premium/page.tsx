import Link from "next/link";
import { getPlugins } from "@/lib/plugins";
import { LIMIT_GROUPS } from "@/lib/premium";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

function ownerWaLink(): string | null {
  const owner = (process.env.OWNER_NUMBER || "").replace(/\D/g, "");
  if (!owner) return null;
  const text = encodeURIComponent("Halo, aku mau tanya soal Premium / Sewa bot KANA yaa~");
  return `https://wa.me/${owner}?text=${text}`;
}

export default async function PremiumPage() {
  const session = await getSession();
  const plugins = await getPlugins();
  const premiumPlugins = plugins.filter((p) => p.premium);
  const limitPlugins = plugins.filter((p) => p.limitGroup);
  const wa = ownerWaLink();

  const products = [
    {
      title: "💎 Premium Personal",
      body: "Membuka semua fitur premium untuk nomor kamu sendiri, di chat pribadi maupun di grup mana pun. Kuota download berat naik jadi 50 kali sehari dan upscale jadi 20 kali sehari.",
      points: ["Semua fitur bertanda 💎 terbuka untuk nomor kamu", "Limit download 50/hari, upscale 20/hari", "Tetap aktif walau pindah grup"],
    },
    {
      title: "🏠 Sewa Grup",
      body: "Satu grup menyewa bot, dan semua member di grup itu ikut menikmati fitur premium selama masa sewa, khusus di dalam grup tersebut.",
      points: ["Fitur premium terbuka untuk semua member di grup itu", "Limit premium berlaku untuk pemakaian di grup itu", "Tidak membuka jadibot personal"],
    },
    {
      title: "🤖 Sewa Jadibot",
      body: "Menyewa hak memakai perintah .jadibot untuk nomor kamu sendiri, supaya nomor kamu bisa jadi bot lewat KANA selama masa sewa.",
      points: ["Membuka .jadibot personal untuk nomor kamu", "Terpisah dari premium personal dan sewa grup", "Berhenti otomatis saat masa sewa berakhir"],
    },
  ];

  return (
    <div className="bg-bgsoft">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-fuchsia">Premium dan Sewa</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">Fitur premium KANA, aktivasi manual oleh owner</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
          KANA punya tiga produk berbayar yang diaktivasi manual oleh owner lewat WhatsApp. Tidak ada payment gateway dan tidak ada harga yang dipasang di halaman ini:
          soal harga dan masa aktif, tanya langsung ke owner ya. Fitur gratis tetap gratis, fitur berat yang tidak dikunci premium dibatasi kuota harian yang adil untuk semua orang.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer" className="bg-gradient-brand rounded-full px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">Tanya Owner di WhatsApp</a>
          ) : null}
          {session ? (
            <Link href="/dashboard" className="rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-violet">Cek Statusku di Dashboard</Link>
          ) : (
            <Link href="/login" className="rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-violet">Masuk untuk Cek Status</Link>
          )}
          <Link href="/plugins" className="rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-violet">Lihat Katalog Plugin</Link>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {products.map((p) => (
            <section key={p.title} className="card-hover rounded-3xl border border-line bg-panel p-7">
              <h2 className="text-2xl font-black tracking-tight">{p.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{p.body}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {p.points.map((pt) => (
                  <li key={pt} className="rounded-2xl bg-bgsoft px-4 py-3">{pt}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="text-3xl font-extrabold tracking-tight">Kuota limit harian</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Fitur download berat dan upscale tidak dikunci premium. Semua orang bisa memakai, dibatasi kuota harian yang reset tengah malam WIB.
            Premium personal dan sewa grup menaikkan kuotanya seperti tabel ini.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {Object.entries(LIMIT_GROUPS).map(([group, cfg]) => (
              <div key={group} className="rounded-3xl border border-line bg-panel p-6">
                <p className="font-bold">⏳ {cfg.label}</p>
                <p className="mt-2 text-sm text-muted">Gratis: {cfg.free} kali sehari</p>
                <p className="text-sm text-muted">Premium / sewa grup: {cfg.paid} kali sehari</p>
                <p className="mt-2 text-xs text-muted">{limitPlugins.filter((p) => p.limitGroup === group).length} plugin di grup limit ini</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-extrabold tracking-tight">Fitur premium saat ini ({premiumPlugins.length} plugin)</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Daftar ini diambil langsung dari katalog plugin repo kana-md, dari tanda premium di config tiap plugin. Bukan daftar karangan.</p>
          {premiumPlugins.length === 0 ? (
            <p className="mt-5 rounded-3xl border border-line bg-panel p-6 text-sm text-muted">Belum ada plugin bertanda premium di katalog saat ini.</p>
          ) : (
            <div className="mt-5 flex flex-wrap gap-2">
              {premiumPlugins.map((p) => (
                <Link key={p.path} href={`/plugins/${p.slug}`} className="rounded-full border border-line bg-panel px-4 py-2 text-sm font-bold hover:border-violet">
                  💎 .{p.name} <span className="font-normal text-muted">({p.category})</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12 rounded-3xl border border-line bg-panel p-8">
          <h2 className="text-2xl font-black tracking-tight">Cara aktivasi</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted">
            <li>Hubungi owner lewat WhatsApp dan sebutkan produk yang kamu mau: premium personal, sewa grup, atau sewa jadibot.</li>
            <li>Owner mengaktifkan manual dari bot (perintah owner) atau dari panel owner web. Tidak ada pembayaran otomatis di web ini.</li>
            <li>Cek statusmu kapan saja di dashboard web sesudah masuk, atau lewat perintah .cekprem dan .ceksewa di bot.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
