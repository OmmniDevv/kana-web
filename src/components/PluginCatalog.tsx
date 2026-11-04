"use client";

import { useMemo, useState } from "react";
import type { PluginInfo } from "@/lib/plugins";

export default function PluginCatalog({ plugins }: { plugins: PluginInfo[] }) {
  const categories = useMemo(() => ["semua", ...Array.from(new Set(plugins.map((p) => p.category))).sort()], [plugins]);
  const [active, setActive] = useState("semua");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = plugins.filter((p) => {
    const okCat = active === "semua" || p.category === active;
    const q = query.toLowerCase();
    const okQ = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return okCat && okQ;
  });

  async function copyCode(plugin: PluginInfo) {
    try {
      await navigator.clipboard.writeText(plugin.content || "");
      setCopied(plugin.path);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari plugin, contoh spotify atau ping"
          className="w-full rounded-full border border-[#1d2b20] bg-[#0b120e] px-5 py-3 text-white outline-none placeholder:text-[#9db8a4] focus:border-[#3dff5e]"
        />
        <div className="relative flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 ${active === cat ? "bg-[#3dff5e] text-black" : "border border-[#1d2b20] bg-[#0b120e] text-[#e8f5ea] hover:border-[#3dff5e]"}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <p className="text-sm text-[#9db8a4]">Menampilkan {filtered.length} dari {plugins.length} plugin</p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((plugin) => (
          <article key={plugin.path} className="card-hover flex flex-col rounded-[20px] border border-[#1d2b20] bg-[#0b120e] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a3ff5e]">{plugin.category}</p>
            <h3 className="mt-2 break-words text-3xl font-black tracking-tight">{plugin.name}</h3>
            <p className="mt-3 flex-1 text-sm leading-6 text-[#9db8a4]">{plugin.description}</p>
            <p className="mt-4 text-xs text-[#9db8a4]">
              {plugin.updatedAt ? `Update ${new Date(plugin.updatedAt).toLocaleDateString("id-ID")}` : "Tanggal update belum tersedia"}
              {plugin.sha ? `, sha ${plugin.sha}` : ""}
              {plugin.metaSource === "fallback" ? ", metadata fallback" : ""}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={`/api/plugins/download?path=${encodeURIComponent(plugin.path)}`} className="rounded-full bg-[#3dff5e] px-4 py-2 text-sm font-bold text-black hover:bg-[#a3ff5e]">Unduh .js</a>
              <button onClick={() => copyCode(plugin)} className="rounded-full border border-[#3dff5e] px-4 py-2 text-sm font-bold text-[#3dff5e] hover:bg-[#101a13]">
                {copied === plugin.path ? "Tersalin" : "Salin Kode"}
              </button>
            </div>
            <details className="mt-5">
              <summary className="cursor-pointer text-sm font-bold text-[#a3ff5e]">Pratinjau kode dan cara pasang</summary>
              <p className="mt-3 text-xs leading-5 text-[#9db8a4]">Cara pasang: salin file ke folder plugins/{plugin.category}/ di bot KANA lalu restart bot.</p>
              <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-black/60 p-4 text-xs leading-5 text-[#cfe8d4]">{(plugin.content || "Kode tidak tersedia saat ini.").slice(0, 4000)}</pre>
            </details>
          </article>
        ))}
      </div>
      {filtered.length === 0 ? <p className="mt-10 text-center text-[#9db8a4]">Tidak ada plugin yang cocok dengan pencarian kamu.</p> : null}
    </div>
  );
}
