import { getPlugins } from "@/lib/plugins";
import PluginCatalog from "@/components/PluginCatalog";

export const revalidate = 3600;

export default async function PluginsPage() {
  const plugins = await getPlugins();
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-12">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a3ff5e]">Katalog Publik</p>
      <h1 className="mt-3 text-5xl font-black tracking-tight">Plugin KANA</h1>
      <p className="mt-4 max-w-2xl text-[#9db8a4]">Total {plugins.length} plugin. Data diambil langsung dari GitHub OmmniDevv/kana-md dan diperbarui otomatis tiap jam.</p>
      <div className="mt-10">
        <PluginCatalog plugins={plugins} />
      </div>
    </div>
  );
}
