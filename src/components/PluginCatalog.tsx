"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PluginInfo } from "@/lib/plugins";
import type { Tier } from "@/lib/catalog-query";

const TIERS: Array<{ id: Tier; label: string }> = [
  { id: "semua", label: "Semua" },
  { id: "gratis", label: "Gratis" },
  { id: "premium", label: "💎 Premium" },
  { id: "limit", label: "⏳ Limit" },
  { id: "baru", label: "Baru ditambahkan" },
];

interface SliceResponse {
  items: PluginInfo[];
  total: number;
  totalCommands: number;
  hasMore: boolean;
}

interface PluginCatalogProps {
  initialItems: PluginInfo[];
  initialTotal: number;
  initialTotalCommands: number;
  categories: string[];
  tierCounts: Record<Tier, number>;
  pageSize: number;
}

export default function PluginCatalog({
  initialItems,
  initialTotal,
  initialTotalCommands,
  categories,
  tierCounts,
  pageSize,
}: PluginCatalogProps) {
  const [items, setItems] = useState<PluginInfo[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [totalCommands, setTotalCommands] = useState(initialTotalCommands);
  const [active, setActive] = useState("semua");
  const [tier, setTier] = useState<Tier>("semua");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null);

  const didMount = useRef(false);
  const lastQuery = useRef("");
  const requestSeq = useRef(0);

  const hasMore = items.length < total;

  function buildParams(offset: number): URLSearchParams {
    const params = new URLSearchParams({ offset: String(offset), limit: String(pageSize) });
    if (query.trim()) params.set("q", query.trim());
    if (active !== "semua") params.set("category", active);
    if (tier !== "semua") params.set("filter", tier);
    return params;
  }

  async function fetchSlice(offset: number, append: boolean) {
    const seq = ++requestSeq.current;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/plugins?${buildParams(offset).toString()}`);
      if (!res.ok) throw new Error("gagal");
      const data = (await res.json()) as SliceResponse;
      if (seq !== requestSeq.current) return;
      setTotal(data.total);
      setTotalCommands(data.totalCommands);
      if (append) {
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.path));
          return [...prev, ...data.items.filter((p) => !seen.has(p.path))];
        });
      } else {
        setItems(data.items);
      }
    } catch {
      if (seq === requestSeq.current) setFailed(true);
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }

  // Perubahan filter atau pencarian mengambil ulang irisan pertama dari
  // server. Pencarian diberi jeda singkat supaya tidak memanggil API
  // pada setiap ketikan.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      lastQuery.current = query;
      return;
    }
    const delay = query !== lastQuery.current ? 300 : 0;
    lastQuery.current = query;
    const timer = setTimeout(() => {
      void fetchSlice(0, false);
    }, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, active, tier]);

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

  async function copyCommand(plugin: PluginInfo, cmd: string) {
    try {
      await navigator.clipboard.writeText(`.${cmd}`);
      setCopied(`cmd:${plugin.path}:${cmd}`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  const chipBase = "rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-300";
  const chipOn = "bg-gradient-brand text-white shadow-lg shadow-fuchsia/25";
  const chipOff = "border border-line bg-panel text-ink hover:border-violet";

  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari plugin atau perintah, contoh spotify atau ping"
          className="w-full min-w-0 rounded-full border border-line bg-panel px-4 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-violet"
        />
        <div className="flex flex-wrap gap-1.5">
          {["semua", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`${chipBase} ${active === cat ? chipOn : chipOff}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TIERS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTier(t.id)}
              className={`${chipBase} ${tier === t.id ? chipOn : chipOff}`}
            >
              {t.label} ({tierCounts[t.id] ?? 0})
            </button>
          ))}
        </div>
        <p className="text-sm text-muted" aria-live="polite">
          {loading
            ? "Memuat plugin..."
            : `Menampilkan ${items.length} dari ${total} plugin dan ${totalCommands} perintah`}
        </p>
        {tier === "baru" ? (
          <p className="text-xs leading-5 text-muted">Filter baru menampilkan plugin yang berubah dalam 20 commit repo terakhir, diurutkan dari yang paling baru. Tanggal perubahan persis tiap plugin ada di halaman detailnya.</p>
        ) : null}
        {failed ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3">
            <p className="text-sm text-muted">Gagal memuat data plugin dari server.</p>
            <button
              onClick={() => void fetchSlice(0, false)}
              className="rounded-full border border-violet px-3 py-1.5 text-xs font-bold text-violet hover:bg-panel2"
            >
              Coba lagi
            </button>
          </div>
        ) : null}
      </div>

      <div
        aria-busy={loading || loadingMore}
        className={`mt-6 grid min-w-0 grid-cols-1 gap-3 min-[560px]:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}
      >
        {items.map((plugin) => (
          <article key={plugin.path} className="card-hover flex min-w-0 flex-col rounded-2xl border border-line bg-panel p-3.5">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <p className="min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.18em] text-fuchsia">{plugin.category}</p>
              <span className="shrink-0 rounded-full bg-panel2 px-2 py-0.5 font-mono text-[10px] font-bold text-violet">{plugin.commandCount} perintah</span>
            </div>
            <h3 className="mt-1 break-words text-lg font-extrabold leading-snug tracking-tight">{plugin.name}</h3>
            {plugin.premium || plugin.limitGroup || plugin.updatedAt ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {plugin.premium ? (
                  <span className="bg-gradient-brand rounded-full px-2 py-0.5 text-[10px] font-bold text-white">💎 Premium</span>
                ) : null}
                {plugin.limitGroup ? (
                  <span className="rounded-full border border-violet px-2 py-0.5 text-[10px] font-bold text-violet">⏳ Limit {plugin.limitGroup}</span>
                ) : null}
                {plugin.updatedAt ? (
                  <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-bold text-muted">Baru, {new Date(plugin.updatedAt).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}</span>
                ) : null}
              </div>
            ) : null}
            <p className="mt-1.5 line-clamp-3 flex-1 break-words text-xs leading-5 text-muted">{plugin.description}</p>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {plugin.commands.map((cmd) => (
                <span key={cmd.name} className="inline-flex max-w-full flex-wrap items-center gap-1">
                  <button
                    onClick={() => copyCommand(plugin, cmd.name)}
                    title="Salin perintah"
                    className="max-w-full truncate rounded-md bg-codebg px-2 py-0.5 font-mono text-[11px] font-bold text-codeink hover:opacity-85"
                  >
                    .{cmd.name}
                  </button>
                  {cmd.aliases.slice(0, 2).map((a) => (
                    <button
                      key={a}
                      onClick={() => copyCommand(plugin, a)}
                      title="Salin alias"
                      className="max-w-full truncate rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted hover:border-violet"
                    >
                      .{a}
                    </button>
                  ))}
                </span>
              ))}
              {copied && copied.startsWith(`cmd:${plugin.path}:`) ? <span className="text-[11px] font-bold text-violet">Perintah tersalin</span> : null}
            </div>
            <p className="mt-2 truncate font-mono text-[10px] text-muted" title={plugin.path}>{plugin.path}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Link href={`/plugins/${plugin.slug}`} className="bg-gradient-brand rounded-full px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">Detail Plugin</Link>
              <a href={`/api/plugins/download?path=${encodeURIComponent(plugin.path)}`} className="rounded-full border border-violet px-3 py-1.5 text-xs font-bold text-violet hover:bg-panel2">Unduh .js</a>
              <button onClick={() => copySource(plugin)} disabled={copying === plugin.path} className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-ink hover:border-violet disabled:opacity-60">
                {copied === plugin.path ? "Kode Tersalin" : copying === plugin.path ? "Mengambil..." : "Salin Kode"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {!loading && items.length === 0 && !failed ? (
        <p className="mt-10 text-center text-muted">Tidak ada plugin yang cocok dengan pencarian kamu.</p>
      ) : null}

      {hasMore ? (
        <div className="mt-8 text-center">
          <button
            onClick={() => void fetchSlice(items.length, true)}
            disabled={loadingMore || loading}
            className="bg-gradient-brand rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-fuchsia/25 hover:opacity-90 disabled:opacity-60"
          >
            {loadingMore ? "Memuat..." : `Muat lagi (${total - items.length} plugin tersisa)`}
          </button>
        </div>
      ) : items.length > 0 ? (
        <p className="mt-8 text-center text-xs text-muted">Semua {total} plugin sudah ditampilkan.</p>
      ) : null}
    </div>
  );
}
