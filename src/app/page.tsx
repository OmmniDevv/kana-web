import Image from "next/image";
import Link from "next/link";
import { countCommands, getPlugins } from "@/lib/plugins";

export const revalidate = 3600;

export default async function HomePage() {
  let pluginCount = 0;
  let commandCount = 0;
  let categoryCount = 0;
  try {
    const plugins = await getPlugins();
    pluginCount = plugins.length;
    commandCount = countCommands(plugins);
    categoryCount = new Set(plugins.map((p) => p.category)).size;
  } catch {
    pluginCount = 0;
    commandCount = 0;
    categoryCount = 0;
  }

  return (
    <div className="bg-bgsoft">
      <section className="mx-auto w-full max-w-[1200px] px-6 pt-12">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-3xl lg:col-span-2 lg:row-span-2">
            <div className="relative h-[420px] w-full overflow-hidden lg:h-full lg:min-h-[520px]">
              <Image src="/banner.jpg" alt="Banner resmi KANA" fill priority className="hero-pan object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              <div className="animate-glow absolute -left-16 top-16 h-64 w-64 rounded-full bg-fuchsia/30 blur-3xl" />
              <div className="relative flex h-full flex-col justify-end p-8 sm:p-10">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-fuchsia">Bot WhatsApp Moe</p>
                <h1 className="animate-fadeUp max-w-xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
                  KANA siap bantu kamu di <span className="text-gradient">WhatsApp</span>
                </h1>
                <p className="mt-4 max-w-lg text-base leading-7 text-white/85">
                  Lihat semua plugin KANA yang selalu segar dari GitHub, lalu masuk ke dashboard untuk cek level, XP, limit, dan saldo kamu.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/plugins" className="bg-gradient-brand rounded-full px-6 py-3 font-bold text-white hover:opacity-90">Lihat Plugin</Link>
                  <Link href="/dashboard" className="rounded-full border border-white/60 px-6 py-3 font-bold text-white hover:bg-white/10">Masuk Dashboard</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-panel p-7">
            <p className="animate-popIn text-gradient text-5xl font-black">{commandCount}</p>
            <p className="mt-2 text-sm text-muted">Total perintah bot dari katalog GitHub, termasuk alias</p>
          </div>
          <div className="rounded-3xl border border-line bg-panel p-7">
            <p className="animate-popIn text-5xl font-black">{pluginCount}</p>
            <p className="mt-2 text-sm text-muted">Plugin aktif dalam {categoryCount} kategori</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-fuchsia">Cara Masuk</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Login kode WhatsApp, tanpa kata sandi baru</h2>
        <p className="mt-2 max-w-2xl text-muted">Login selalu dimulai dari web. Kamu tidak perlu mengetik perintah apa pun di bot.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="card-hover rounded-3xl border border-line bg-panel p-7">
            <p className="font-mono text-sm font-bold text-violet">01</p>
            <h3 className="mt-3 text-xl font-bold">Isi nomor di web</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Buka halaman Masuk, isi nomor WhatsApp kamu, lalu minta kode. Server web membuat kode 6 digit dan menyimpannya dengan aman.</p>
          </div>
          <div className="card-hover rounded-3xl border border-line bg-panel p-7">
            <p className="font-mono text-sm font-bold text-violet">02</p>
            <h3 className="mt-3 text-xl font-bold">Bot mengirim kode</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Bot KANA membaca permintaan yang menunggu, mengirim kode ke WhatsApp kamu, lalu menandai kode sebagai terkirim.</p>
          </div>
          <div className="card-hover rounded-3xl border border-line bg-panel p-7">
            <p className="font-mono text-sm font-bold text-violet">03</p>
            <h3 className="mt-3 text-xl font-bold">Masukkan kode di web</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Ketik kode 6 digit di web. Bila cocok, sesi dibuat dan kamu langsung masuk ke dashboard. Kode berlaku 10 menit dan hanya sekali pakai.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1200px] items-stretch gap-4 px-6 pb-14 md:grid-cols-2">
        <div className="animate-floaty relative min-h-[320px] overflow-hidden rounded-3xl border border-line">
          <Image src="/welcome.jpg" alt="Gambar sambutan KANA" fill className="object-cover" />
        </div>
        <div className="grid gap-4">
          <div className="card-hover rounded-3xl border border-line bg-panel p-7">
            <h3 className="text-xl font-bold">Katalog plugin lengkap</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Setiap plugin punya halaman detail berisi daftar perintah dengan tombol salin, cara pakai, contoh, plus tombol unduh dan salin kode sumber. Pemilik bot lain bisa mengambil update plugin dari web.</p>
          </div>
          <div className="card-hover rounded-3xl border border-line bg-panel p-7">
            <h3 className="text-xl font-bold">Dashboard member dan owner</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Member melihat level, progres XP, limit harian, saldo, inventaris, dan tanggal daftar. Owner melihat total member terdaftar, total perintah, dan status bot, semuanya dari data bot yang asli.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-6 pb-20">
        <div className="bg-gradient-brand rounded-3xl p-10 text-center text-white">
          <h2 className="text-3xl font-extrabold tracking-tight">Siap masuk ke dashboard kamu?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">Minta kode dari web, cek WhatsApp, lalu masuk. Cepat dan tanpa kata sandi baru.</p>
          <Link href="/login" className="mt-6 inline-block rounded-full bg-white px-7 py-3 font-bold text-violet hover:opacity-90">Masuk Sekarang</Link>
        </div>
      </section>
    </div>
  );
}
