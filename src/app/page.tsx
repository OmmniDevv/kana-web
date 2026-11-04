import Image from "next/image";
import Link from "next/link";
import { getPlugins } from "@/lib/plugins";

export const revalidate = 3600;

export default async function HomePage() {
  let pluginCount = 0;
  let categoryCount = 0;
  try {
    const plugins = await getPlugins();
    pluginCount = plugins.length;
    categoryCount = new Set(plugins.map((p) => p.category)).size;
  } catch {
    pluginCount = 0;
    categoryCount = 0;
  }

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="relative h-[520px] w-full overflow-hidden">
          <Image src="/banner.jpg" alt="Banner resmi KANA" fill priority className="hero-pan object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06090a] via-[#06090a]/55 to-transparent" />
          <div className="animate-glow absolute -left-20 top-24 h-72 w-72 rounded-full bg-[#3dff5e]/25 blur-3xl" />
          <div className="relative mx-auto flex h-full w-full max-w-[1200px] flex-col justify-end px-6 pb-14">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#a3ff5e]">Bot WhatsApp Moe</p>
            <h1 className="animate-fadeUp max-w-3xl text-5xl font-black leading-[1.02] tracking-tight sm:text-7xl">
              KANA siap bantu kamu di WhatsApp
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-[#cfe8d4]">
              Lihat semua plugin KANA yang selalu segar dari GitHub, lalu masuk ke dashboard untuk cek level, XP, limit, saldo, dan inventaris kamu.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/plugins" className="rounded-full bg-[#3dff5e] px-6 py-3 font-bold text-black hover:bg-[#a3ff5e]">Lihat Plugin</Link>
              <Link href="/dashboard" className="rounded-full border border-[#3dff5e] px-6 py-3 font-bold text-[#3dff5e] hover:bg-[#101a13]">Masuk Dashboard</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
            <p className="animate-popIn text-4xl font-black text-[#3dff5e]">{pluginCount}</p>
            <p className="mt-1 text-sm text-[#9db8a4]">Jumlah plugin dari katalog GitHub</p>
          </div>
          <div className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
            <p className="animate-popIn text-4xl font-black text-[#3dff5e]">{categoryCount}</p>
            <p className="mt-1 text-sm text-[#9db8a4]">Jumlah kategori plugin</p>
          </div>
          <div className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
            <p className="animate-popIn text-4xl font-black text-[#3dff5e]">10 menit</p>
            <p className="mt-1 text-sm text-[#9db8a4]">Masa berlaku kode login WhatsApp</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-6 py-10">
        <h2 className="text-3xl font-extrabold">Cara kerja login kode WhatsApp</h2>
        <p className="mt-2 max-w-2xl text-[#9db8a4]">Login dimulai dari web. Kamu tidak perlu mengetik perintah apa pun di bot.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="card-hover rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
            <p className="text-sm font-bold text-[#a3ff5e]">Langkah 1</p>
            <h3 className="mt-2 text-xl font-bold">Isi nomor di web</h3>
            <p className="mt-2 text-sm leading-6 text-[#9db8a4]">Buka halaman Masuk, isi nomor WhatsApp kamu, lalu minta kode. Server web membuat kode 6 digit dan menyimpannya dengan aman.</p>
          </div>
          <div className="card-hover rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
            <p className="text-sm font-bold text-[#a3ff5e]">Langkah 2</p>
            <h3 className="mt-2 text-xl font-bold">Bot mengirim kode</h3>
            <p className="mt-2 text-sm leading-6 text-[#9db8a4]">Bot KANA membaca permintaan pending, mengirim kode ke WhatsApp kamu, lalu menandai kode sebagai terkirim.</p>
          </div>
          <div className="card-hover rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
            <p className="text-sm font-bold text-[#a3ff5e]">Langkah 3</p>
            <h3 className="mt-2 text-xl font-bold">Masukkan kode di web</h3>
            <p className="mt-2 text-sm leading-6 text-[#9db8a4]">Ketik kode 6 digit di web. Bila cocok, sesi dibuat dan kamu langsung masuk ke dashboard.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1200px] items-center gap-8 px-6 py-14 md:grid-cols-2">
        <div className="animate-floaty relative h-[380px] overflow-hidden rounded-[20px] border border-[#1d2b20]">
          <Image src="/welcome.jpg" alt="Gambar sambutan KANA" fill className="object-cover" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold">Fitur utama KANA Web</h2>
          <ul className="mt-6 space-y-4 text-[#cfe8d4]">
            <li className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-5"><strong className="text-white">Katalog galeri.</strong> Semua plugin tampil sebagai kartu sampul besar per kategori, lengkap dengan tombol unduh dan salin kode.</li>
            <li className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-5"><strong className="text-white">Dashboard pribadi.</strong> Level, progres XP, limit harian, saldo, inventaris, pet, pekerjaan, dan riwayat klaim dalam satu halaman.</li>
            <li className="rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-5"><strong className="text-white">Panel owner.</strong> Total pengguna, papan peringkat XP, jumlah plugin, dan status bot tampil jujur sesuai data yang ada.</li>
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-6 pb-20">
        <div className="rounded-[20px] border border-[#3dff5e]/40 bg-[#0b120e] p-8 text-center">
          <h2 className="text-3xl font-extrabold">Siap masuk ke dashboard kamu?</h2>
          <p className="mx-auto mt-3 max-w-xl text-[#9db8a4]">Minta kode dari web, cek WhatsApp, lalu masuk. Cepat dan tanpa kata sandi baru.</p>
          <Link href="/login" className="mt-6 inline-block rounded-full bg-[#3dff5e] px-7 py-3 font-bold text-black hover:bg-[#a3ff5e]">Masuk Sekarang</Link>
        </div>
      </section>
    </div>
  );
}
