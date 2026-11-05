import { getPlugins } from "@/lib/plugins";
import { catalogMeta, queryCatalog } from "@/lib/catalog-query";
import PluginCatalog from "@/components/PluginCatalog";

export const revalidate = 3600;

const PAGE_SIZE = 48;

export default async function PluginsPage() {
  const plugins = await getPlugins();
  const meta = catalogMeta(plugins);
  // Hanya irisan pertama yang dirender di server. Irisan berikutnya,
  // pencarian, dan filter diambil dari /api/plugins supaya muatan awal
  // halaman tetap kecil walau katalog berisi ribuan plugin.
  const first = queryCatalog(plugins, { offset: 0, limit: PAGE_SIZE });
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1200px] px-4 py-10 sm:px-6 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-fuchsia">Katalog Publik</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Plugin <span className="text-gradient">KANA</span></h1>
      <p className="mt-4 max-w-2xl text-muted">
        Total {meta.totalPlugins} plugin dan {meta.totalCommands} perintah dari {meta.categories.length} kategori. Data diambil langsung dari GitHub OmmniDevv/kana-md dan diperbarui otomatis tiap jam. Buka detail plugin untuk melihat daftar perintah, menyalin perintah, atau mengambil kode sumber terbarunya.
      </p>
      <div className="mt-8 min-w-0">
        <PluginCatalog
          initialItems={first.items}
          initialTotal={first.total}
          initialTotalCommands={first.totalCommands}
          categories={meta.categories}
          tierCounts={meta.tierCounts}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
}
