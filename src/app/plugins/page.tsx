import { countCommands, getPlugins } from "@/lib/plugins";
import PluginCatalog from "@/components/PluginCatalog";

export const revalidate = 3600;

export default async function PluginsPage() {
  const plugins = await getPlugins();
  const totalCommands = countCommands(plugins);
  const categoryCount = new Set(plugins.map((p) => p.category)).size;
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-12">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-fuchsia">Katalog Publik</p>
      <h1 className="mt-3 text-5xl font-black tracking-tight">Plugin <span className="text-gradient">KANA</span></h1>
      <p className="mt-4 max-w-2xl text-muted">
        Total {plugins.length} plugin dan {totalCommands} perintah dari {categoryCount} kategori. Data diambil langsung dari GitHub OmmniDevv/kana-md dan diperbarui otomatis tiap jam. Buka detail plugin untuk melihat daftar perintah, menyalin perintah, atau mengambil kode sumber terbarunya.
      </p>
      <div className="mt-10">
        <PluginCatalog plugins={plugins} />
      </div>
    </div>
  );
}
