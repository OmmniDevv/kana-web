import Link from "next/link";
import { notFound } from "next/navigation";
import { getPluginBySlug } from "@/lib/plugins";
import CopyTextButton from "@/components/CopyTextButton";

export const revalidate = 3600;

export default async function PluginDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plugin = await getPluginBySlug(slug);
  if (!plugin) notFound();

  const sizeKb = plugin.size ? `${(plugin.size / 1024).toFixed(1)} KB` : "Tidak diketahui";

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-12">
      <Link href="/plugins" className="text-sm font-bold text-violet hover:underline">
        Kembali ke katalog plugin
      </Link>

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-fuchsia">{plugin.category}</p>
      <h1 className="mt-3 break-words text-5xl font-black tracking-tight">{plugin.name}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{plugin.description}</p>
      {plugin.descriptionEn ? <p className="mt-2 max-w-2xl text-sm text-muted">{plugin.descriptionEn}</p> : null}
      {plugin.premium || plugin.limitGroup ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {plugin.premium ? (
            <span className="bg-gradient-brand rounded-full px-3 py-1.5 text-xs font-bold text-white">💎 Premium</span>
          ) : null}
          {plugin.limitGroup ? (
            <span className="rounded-full border border-violet px-3 py-1.5 text-xs font-bold text-violet">⏳ Limit {plugin.limitGroup}</span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-line bg-panel p-5">
          <p className="font-mono text-sm font-bold text-violet">{plugin.path}</p>
          <p className="mt-1 text-xs text-muted">Lokasi file di repo kana-md</p>
        </div>
        <div className="rounded-3xl border border-line bg-panel p-5">
          <p className="text-2xl font-black">{plugin.commandCount}</p>
          <p className="mt-1 text-xs text-muted">Perintah termasuk alias</p>
        </div>
        <div className="rounded-3xl border border-line bg-panel p-5">
          <p className="text-2xl font-black">{sizeKb}</p>
          <p className="mt-1 text-xs text-muted">Ukuran file sumber</p>
        </div>
        <div className="rounded-3xl border border-line bg-panel p-5">
          <p className="text-2xl font-black">{plugin.updatedAt ? new Date(plugin.updatedAt).toLocaleDateString("id-ID") : "Belum tersedia"}</p>
          <p className="mt-1 text-xs text-muted">Update terakhir{plugin.sha ? `, commit ${plugin.sha}` : ""}</p>
        </div>
      </div>

      <section className="mt-10 rounded-3xl border border-line bg-panel p-6 sm:p-8">
        <h2 className="text-2xl font-extrabold">Daftar perintah</h2>
        <p className="mt-2 text-sm text-muted">Ketuk tombol salin untuk menyalin perintah, lalu tempel di chat WhatsApp bot KANA.</p>
        <div className="mt-6 space-y-4">
          {plugin.commands.map((cmd) => (
            <div key={cmd.name} className="rounded-2xl border border-line bg-bgsoft p-5">
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded-lg bg-codebg px-3 py-1.5 font-mono text-sm font-bold text-codeink">.{cmd.name}</code>
                {cmd.aliases.map((a) => (
                  <code key={a} className="rounded-lg border border-line px-2.5 py-1.5 font-mono text-xs text-muted">.{a}</code>
                ))}
                <CopyTextButton
                  text={`.${cmd.name}`}
                  label="Salin perintah"
                  className="bg-gradient-brand ml-auto rounded-full px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                />
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted">Cara pakai</p>
                  <p className="mt-1 font-mono text-[13px]">{cmd.usage}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted">Contoh</p>
                  <p className="mt-1 font-mono text-[13px]">{cmd.example}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-line bg-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold">Kode sumber plugin</h2>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/plugins/download?path=${encodeURIComponent(plugin.path)}`}
              className="bg-gradient-brand rounded-full px-4 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              Unduh .js
            </a>
            <CopyTextButton
              text={plugin.content || ""}
              label="Salin semua kode"
              className="rounded-full border border-violet px-4 py-2 text-sm font-bold text-violet hover:bg-panel2"
            />
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">
          Cara pasang: simpan file ini ke folder <span className="font-mono">plugins/{plugin.category}/</span> di bot KANA kamu, lalu restart bot. Pemilik source code lain bisa mengambil update plugin terbaru dari halaman ini kapan saja.
        </p>
        <pre className="mt-5 max-h-[560px] overflow-auto rounded-2xl bg-codebg p-5 font-mono text-xs leading-5 text-codeink">
          {plugin.content || "Kode tidak tersedia saat ini. Coba lagi nanti ya."}
        </pre>
      </section>
    </div>
  );
}
