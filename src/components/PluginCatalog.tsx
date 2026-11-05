"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PluginInfo } from "@/lib/plugins";

type Tier = "semua" | "gratis" | "premium" | "limit" | "baru";

const TIERS: Array<{ id: Tier; label: string }> = [
  { id: "semua", label: "Semua" },
  { id: "gratis", label: "Gratis" },
  { id: "premium", label: "💎 Premium" },
  { id: "limit", label: "⏳ Limit" },
  { id: "baru", label: "Baru ditambahkan" },
];

function tierMatch(p: PluginInfo, tier: Tier): boolean {
  if (tier === "gratis") return !p.premium && !p.limitGroup;
  if (tier === "premium") return p.premium;
  if (tier === "limit") return Boolean(p.limitGroup);
  if (tier === "baru") return Boolean(p.updatedAt);
  return true;
}

export default function PluginCatalog({ plugins }: { plugins: PluginInfo[] }) {
  const categories = useMemo(() => ["semua", ...Array.from(new Set(plugins.map((p) => p.category))).sort()], [plugins]);
  const [active, setActive] = useState("semua");
  const [tier, setTier] = useState<Tier>("semua");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null);

  const tierCounts = useMemo(() => {
    const counts = new Map<Tier, number>();
    for (const t of TIERS) counts.set(t.id, plugins.filter((p) => tierMatch(p, t.id)).length);
    return counts;
  }, [plugins]);

  const filtered = plugins.filter((p) => {
    const okCat = active === "semua" || p.category === active;
    const okTier = tierMatch(p, tier);
    const q = query.toLowerCase();
    const cmdHit = p.commands.some((c) => c.name.toLowerCase().includes(q) || c.aliases.some((a) => a.toLowerCase().includes(q)));
    const okQ = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || cmdHit;
    return okCat && okTier && okQ;
  });
  if (tier === "baru") {
    filtered.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  }

  const filteredCommands = filtered.reduce((acc, p) => acc + p.commandCount, 0);

  async function copySource(plugin: PluginInfo) {
    setCopying(plugin.path);
    try {
      const res = await fetch(`/api/plugins/download?path=${encodeURIComponent(plugin.path)}`);
      if (!res.ok) throw new Error("gagal");
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(plugin.path);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    } finally {
      setCopying(null);
    }
  }

  async function copyCommand(cmd: string) {
    try {
      await navigator.clipboard.writeText(`.${cmd}`);
      setCopied(`cmd:${cmd}`);
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
          placeholder="Cari plugin atau perintah, contoh spotify atau ping"
          className="w-full rounded-full border border-line bg-panel px-5 py-3 text-ink outline-none placeholder:text-muted focus:border-violet"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 ${active === cat ? "bg-gradient-brand text-white shadow-lg shadow-fuchsia/25" : "border border-line bg-panel text-ink hover:border-violet"}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {TIERS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTier(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 ${tier === t.id ? "bg-gradient-brand text-white shadow-lg shadow-fuchsia/25" : "border border-line bg-panel text-ink hover:border-violet"}`}
            >
              {t.label} ({tierCounts.get(t.id) ?? 0})
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">Menampilkan {filtered.length} plugin dan {filteredCommands} perintah</p>
        {tier === "baru" ? (
          <p className="text-xs leading-5 text-muted">Filter baru menampilkan plugin yang berubah dalam 20 commit repo terakhir, diurutkan dari yang paling baru. Tanggal perubahan persis tiap plugin ada di halaman detailnya.</p>
        ) : null}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((plugin) => (
          <article key={plugin.path} className="card-hover flex flex-col rounded-3xl border border-line bg-panel p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia">{plugin.category}</p>
              <span className="rounded-full bg-panel2 px-2.5 py-1 font-mono text-[11px] font-bold text-violet">{plugin.commandCount} perintah</span>
            </div>
            <h3 className="mt-2 break-words text-3xl font-black tracking-tight">{plugin.name}</h3>
            {plugin.premium || plugin.limitGroup || plugin.updatedAt ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {plugin.premium ? (
                  <span className="bg-gradient-brand rounded-full px-2.5 py-1 text-[11px] font-bold text-white">💎 Premium</span>
                ) : null}
                {plugin.limitGroup ? (
                  <span className="rounded-full border border-violet px-2.5 py-1 text-[11px] font-bold text-violet">⏳ Limit {plugin.limitGroup}</span>
                ) : null}
                {plugin.updatedAt ? (
                  <span className="rounded-full border border-line px-2.5 py-1 text-[11px] font-bold text-muted">Baru, {new Date(plugin.updatedAt).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}</span>
                ) : null}
              </div>
            ) : null}
            <p className="mt-3 flex-1 text-sm leading-6 text-muted">{plugin.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {plugin.commands.map((cmd) => (
                <span key={cmd.name} className="inline-flex items-center gap-1">
                  <button
                    onClick={() => copyCommand(cmd.name)}
                    title="Salin perintah"
                    className="rounded-lg bg-codebg px-2.5 py-1 font-mono text-xs font-bold text-codeink hover:opacity-85"
                  >
                    .{cmd.name}
                  </button>
                  {cmd.aliases.slice(0, 2).map((a) => (
                    <button
                      key={a}
                      onClick={() => copyCommand(a)}
                      title="Salin alias"
                      className="rounded-lg border border-line px-2 py-1 font-mono text-[11px] text-muted hover:border-violet"
                    >
                      .{a}
                    </button>
                  ))}
                </span>
              ))}
              {copied && copied.startsWith("cmd:") ? <span className="text-xs font-bold text-violet">Perintah tersalin</span> : null}
            </div>
            <p className="mt-4 font-mono text-[11px] text-muted">{plugin.path}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/plugins/${plugin.slug}`} className="bg-gradient-brand rounded-full px-4 py-2 text-sm font-bold text-white hover:opacity-90">Detail Plugin</Link>
              <a href={`/api/plugins/download?path=${encodeURIComponent(plugin.path)}`} className="rounded-full border border-violet px-4 py-2 text-sm font-bold text-violet hover:bg-panel2">Unduh .js</a>
              <button onClick={() => copySource(plugin)} disabled={copying === plugin.path} className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink hover:border-violet disabled:opacity-60">
                {copied === plugin.path ? "Kode Tersalin" : copying === plugin.path ? "Mengambil..." : "Salin Kode"}
              </button>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 ? <p className="mt-10 text-center text-muted">Tidak ada plugin yang cocok dengan pencarian kamu.</p> : null}
    </div>
  );
}
