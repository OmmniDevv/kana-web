import { NextResponse } from "next/server";
import { getPlugins } from "@/lib/plugins";
import { catalogMeta, isTier, queryCatalog } from "@/lib/catalog-query";

export const dynamic = "force-dynamic";

// API katalog plugin: melayani irisan katalog dari sumber yang sama dengan
// halaman /plugins (getPlugins, cache ISR GitHub). Pencarian, filter
// kategori, dan filter tier diterapkan di server atas seluruh katalog.
// Contoh: /api/plugins?offset=48&limit=48&q=spotify&category=ai&filter=premium
export async function GET(req: Request) {
  const url = new URL(req.url);
  const offsetRaw = Number(url.searchParams.get("offset") ?? "0");
  const limitRaw = Number(url.searchParams.get("limit") ?? "48");
  const filterRaw = url.searchParams.get("filter");
  const plugins = await getPlugins();
  const slice = queryCatalog(plugins, {
    q: url.searchParams.get("q") || "",
    category: url.searchParams.get("category") || "semua",
    tier: isTier(filterRaw) ? filterRaw : "semua",
    offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
    limit: Number.isFinite(limitRaw) ? limitRaw : 48,
  });
  return NextResponse.json(
    { ...slice, meta: catalogMeta(plugins) },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=600, stale-while-revalidate=3600" } }
  );
}
