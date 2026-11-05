import type { PluginInfo } from "@/lib/plugins";
import { countCommands } from "@/lib/plugins";

// Logika filter katalog dipakai bersama oleh halaman /plugins (irisan awal)
// dan route API /api/plugins (irisan berikutnya), supaya hasil pencarian
// dan filter selalu konsisten atas seluruh katalog, bukan per irisan.

export type Tier = "semua" | "gratis" | "premium" | "limit" | "baru";

export const TIERS: Array<{ id: Tier; label: string }> = [
  { id: "semua", label: "Semua" },
  { id: "gratis", label: "Gratis" },
  { id: "premium", label: "💎 Premium" },
  { id: "limit", label: "⏳ Limit" },
  { id: "baru", label: "Baru ditambahkan" },
];

export function isTier(value: string | null | undefined): value is Tier {
  return TIERS.some((t) => t.id === value);
}

export function tierMatch(p: PluginInfo, tier: Tier): boolean {
  if (tier === "gratis") return !p.premium && !p.limitGroup;
  if (tier === "premium") return p.premium;
  if (tier === "limit") return Boolean(p.limitGroup);
  if (tier === "baru") return Boolean(p.updatedAt);
  return true;
}

export function pluginMatchesQuery(p: PluginInfo, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  const cmdHit = p.commands.some(
    (c) => c.name.toLowerCase().includes(needle) || c.aliases.some((a) => a.toLowerCase().includes(needle))
  );
  return (
    p.name.toLowerCase().includes(needle) ||
    p.description.toLowerCase().includes(needle) ||
    p.category.toLowerCase().includes(needle) ||
    cmdHit
  );
}

export interface CatalogMeta {
  totalPlugins: number;
  totalCommands: number;
  categories: string[];
  tierCounts: Record<Tier, number>;
}

export function catalogMeta(plugins: PluginInfo[]): CatalogMeta {
  const tierCounts = {} as Record<Tier, number>;
  for (const t of TIERS) tierCounts[t.id] = plugins.filter((p) => tierMatch(p, t.id)).length;
  return {
    totalPlugins: plugins.length,
    totalCommands: countCommands(plugins),
    categories: Array.from(new Set(plugins.map((p) => p.category))).sort(),
    tierCounts,
  };
}

export interface CatalogQuery {
  q?: string;
  category?: string;
  tier?: Tier;
  offset?: number;
  limit?: number;
}

export interface CatalogSlice {
  items: PluginInfo[];
  total: number;
  totalCommands: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export function queryCatalog(plugins: PluginInfo[], query: CatalogQuery): CatalogSlice {
  const q = (query.q || "").trim().toLowerCase();
  const category = query.category || "semua";
  const tier: Tier = query.tier && isTier(query.tier) ? query.tier : "semua";
  const offset = Math.max(0, Math.floor(query.offset ?? 0) || 0);
  const limit = Math.min(96, Math.max(1, Math.floor(query.limit ?? 48) || 48));

  const filtered = plugins.filter((p) => {
    const okCat = category === "semua" || p.category === category;
    return okCat && tierMatch(p, tier) && pluginMatchesQuery(p, q);
  });
  if (tier === "baru") {
    filtered.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  }

  const items = filtered.slice(offset, offset + limit);
  return {
    items,
    total: filtered.length,
    totalCommands: countCommands(filtered),
    offset,
    limit,
    hasMore: offset + items.length < filtered.length,
  };
}
