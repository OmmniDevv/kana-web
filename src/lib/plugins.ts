export interface PluginCommand {
  name: string;
  aliases: string[];
  usage: string;
  example: string;
}

export interface PluginInfo {
  name: string;
  category: string;
  path: string;
  slug: string;
  description: string;
  descriptionEn: string;
  metaSource: "config" | "fallback";
  updatedAt?: string;
  sha?: string;
  size?: number;
  rawUrl: string;
  commands: PluginCommand[];
  commandCount: number;
  premium: boolean;
  limitGroup: string | null;
}

export interface PluginDetail extends PluginInfo {
  content: string;
}

const REPO = "OmmniDevv/kana-md";
const BRANCH = "main";

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

interface TreeItem {
  path: string;
  type: string;
  size?: number;
  sha?: string;
}

export function pluginSlug(filePath: string): string {
  return filePath.replace(/^plugins\//, "").replace(/\.js$/, "").replace(/\//g, "-");
}

function extractQuotedStrings(raw: string): string[] {
  const out: string[] = [];
  const re = /['"`]([^'"`]+)['"`]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) out.push(m[1]);
  return out;
}

interface ParsedMeta {
  name: string;
  aliases: string[];
  category: string;
  description: string;
  descriptionEn: string;
  usage: string;
  example: string;
  metaSource: "config" | "fallback";
  premium: boolean;
  limitGroup: string | null;
}

function parsePluginMeta(content: string, filePath: string): ParsedMeta {
  const fallbackCategory = filePath.split("/")[1] || "main";
  const basename = filePath.split("/").pop() || "plugin";
  const fallbackName = basename.replace(/\.js$/, "");

  const configIdx = content.indexOf("export const config");
  const slice = configIdx >= 0 ? content.slice(configIdx, configIdx + 3000) : content.slice(0, 3000);

  const nameMatch = slice.match(/\bname\s*:\s*['"`]([^'"`]+)['"`]/);
  const categoryMatch = slice.match(/\bcategory\s*:\s*['"`]([^'"`]+)['"`]/);

  let aliases: string[] = [];
  const aliasMatch = slice.match(/\balias\s*:\s*\[([^\]]*)\]/);
  if (aliasMatch) aliases = extractQuotedStrings(aliasMatch[1]);

  let description: string | null = null;
  let descriptionEn = "";
  const descObjMatch = slice.match(/\bdescription\s*:\s*\{([\s\S]*?)\}/);
  if (descObjMatch) {
    const idM = descObjMatch[1].match(/\bid\s*:\s*['"`]([^'"`]+)['"`]/);
    const enM = descObjMatch[1].match(/\ben\s*:\s*['"`]([^'"`]+)['"`]/);
    if (idM) description = idM[1];
    if (enM) descriptionEn = enM[1];
  }
  if (!description) {
    const descPlainMatch = slice.match(/\bdescription\s*:\s*['"`]([^'"`]+)['"`]/);
    if (descPlainMatch) description = descPlainMatch[1];
  }

  const usageMatch = slice.match(/\busage\s*:\s*['"`]([^'"`]+)['"`]/);
  const exampleMatch = slice.match(/\bexample\s*:\s*['"`]([^'"`]+)['"`]/);

  // Tanda berbayar dari config bot: premium: true dan limitGroup: 'download'.
  const premium = /\bpremium\s*:\s*true\b/.test(slice);
  const limitGroupMatch = slice.match(/\blimitGroup\s*:\s*['"`]([^'"`]+)['"`]/);
  const limitGroup = limitGroupMatch ? limitGroupMatch[1] : null;

  const name = nameMatch ? nameMatch[1] : fallbackName;
  return {
    name,
    aliases,
    category: categoryMatch ? categoryMatch[1] : fallbackCategory,
    description: description || `Plugin kategori ${fallbackCategory} dari repo KANA.`,
    descriptionEn,
    usage: usageMatch ? usageMatch[1] : `.${name}`,
    example: exampleMatch ? exampleMatch[1] : `.${name}`,
    metaSource: description && nameMatch ? "config" : "fallback",
    premium,
    limitGroup,
  };
}

// Tanggal perubahan terakhir per berkas plugin, diambil dari 20 commit
// repo paling baru (satu panggilan daftar commit + detail per commit,
// semuanya kena cache ISR 3600). Berkas yang tidak tersentuh 20 commit
// terakhir tidak punya tanggal di daftar ini; tanggal persisnya tetap
// tersedia di halaman detail lewat fetchCommitInfo. Dipakai filter
// "Baru ditambahkan" di katalog dengan kriteria jujur ini.
async function fetchRecentFileDates(): Promise<Map<string, string>> {
  const dates = new Map<string, string>();
  try {
    const listRes = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=20`, {
      headers: githubHeaders(),
      next: { revalidate: 3600 },
    });
    if (!listRes.ok) return dates;
    const commits = (await listRes.json()) as Array<{ sha?: string; commit?: { author?: { date?: string } } }>;
    if (!Array.isArray(commits)) return dates;
    await Promise.all(
      commits.map(async (c) => {
        if (!c.sha) return;
        try {
          const res = await fetch(`https://api.github.com/repos/${REPO}/commits/${c.sha}`, {
            headers: githubHeaders(),
            next: { revalidate: 3600 },
          });
          if (!res.ok) return;
          const detail = (await res.json()) as { files?: Array<{ filename?: string }> };
          const date = c.commit?.author?.date;
          if (!date || !Array.isArray(detail.files)) return;
          for (const f of detail.files) {
            if (f.filename && f.filename.startsWith("plugins/") && !dates.has(f.filename)) {
              dates.set(f.filename, date);
            }
          }
        } catch {
          // abaikan commit yang gagal dibaca
        }
      })
    );
  } catch {
    return dates;
  }
  return dates;
}

async function fetchCommitInfo(filePath: string): Promise<{ updatedAt?: string; sha?: string }> {
  try {
    const url = `https://api.github.com/repos/${REPO}/commits?path=${encodeURIComponent(filePath)}&per_page=1`;
    const res = await fetch(url, { headers: githubHeaders(), next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const data = (await res.json()) as Array<{ sha?: string; commit?: { author?: { date?: string } } }>;
    if (!Array.isArray(data) || data.length === 0) return {};
    const first = data[0];
    return {
      updatedAt: first.commit?.author?.date,
      sha: first.sha ? first.sha.slice(0, 7) : undefined,
    };
  } catch {
    return {};
  }
}

export async function getPlugins(): Promise<PluginInfo[]> {
  try {
    const treeUrl = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;
    const treeRes = await fetch(treeUrl, { headers: githubHeaders(), next: { revalidate: 3600 } });
    if (!treeRes.ok) return [];
    const treeData = (await treeRes.json()) as { tree?: TreeItem[] };
    const files = (treeData.tree || []).filter(
      (item) => item.type === "blob" && item.path.startsWith("plugins/") && item.path.endsWith(".js")
    );

    // Ambil tanggal commit terbaru secara paralel dengan konten plugin
    // supaya tidak menambah waktu tunggu pengambilan katalog.
    const recentDatesPromise = fetchRecentFileDates();

    const plugins = await Promise.all(
      files.map(async (file) => {
        const rawUrl = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${file.path}`;
        let content = "";
        try {
          const rawRes = await fetch(rawUrl, { next: { revalidate: 3600 } });
          if (rawRes.ok) content = await rawRes.text();
        } catch {
          content = "";
        }
        const meta = parsePluginMeta(content, file.path);
        const category = file.path.split("/")[1] || meta.category;
        const commands: PluginCommand[] = [
          { name: meta.name, aliases: meta.aliases, usage: meta.usage, example: meta.example },
        ];
        const info: PluginInfo = {
          name: meta.name,
          category,
          path: file.path,
          slug: pluginSlug(file.path),
          description: meta.description,
          descriptionEn: meta.descriptionEn,
          metaSource: meta.metaSource,
          sha: file.sha ? file.sha.slice(0, 7) : undefined,
          size: file.size,
          rawUrl,
          commands,
          commandCount: 1 + meta.aliases.length,
          premium: meta.premium,
          limitGroup: meta.limitGroup,
        };
        return info;
      })
    );

    const recentDates = await recentDatesPromise;
    for (const p of plugins) {
      const d = recentDates.get(p.path);
      if (d) p.updatedAt = d;
    }

    plugins.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return plugins;
  } catch {
    return [];
  }
}

export async function getPluginBySlug(slug: string): Promise<PluginDetail | null> {
  const plugins = await getPlugins();
  const found = plugins.find((p) => p.slug === slug);
  if (!found) return null;
  let content = "";
  try {
    const rawRes = await fetch(found.rawUrl, { next: { revalidate: 3600 } });
    if (rawRes.ok) content = await rawRes.text();
  } catch {
    content = "";
  }
  const commit = await fetchCommitInfo(found.path);
  return { ...found, content, updatedAt: commit.updatedAt, sha: commit.sha || found.sha };
}

export async function getPluginCount(): Promise<number> {
  const plugins = await getPlugins();
  return plugins.length;
}

export function countCommands(plugins: PluginInfo[]): number {
  return plugins.reduce((acc, p) => acc + p.commandCount, 0);
}

export async function getCategories(plugins: PluginInfo[]): Promise<string[]> {
  return Array.from(new Set(plugins.map((p) => p.category))).sort();
}
