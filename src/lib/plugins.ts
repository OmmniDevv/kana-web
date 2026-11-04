export interface PluginInfo {
  name: string;
  category: string;
  path: string;
  description: string;
  metaSource: "config" | "fallback";
  updatedAt?: string;
  sha?: string;
  size?: number;
  rawUrl: string;
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
}

function parsePluginMeta(content: string, filePath: string): { name: string; category: string; description: string; metaSource: "config" | "fallback" } {
  const fallbackCategory = filePath.split("/").slice(1, -1)[0] || filePath.split("/")[1] || "main";
  const basename = filePath.split("/").pop() || "plugin";
  const fallbackName = basename.replace(/\.js$/, "");

  const configIdx = content.indexOf("config");
  const slice = configIdx >= 0 ? content.slice(configIdx, configIdx + 2500) : content.slice(0, 2500);

  const nameMatch = slice.match(/\bname\s*:\s*['"`]([^'"`]+)['"`]/);
  const categoryMatch = slice.match(/\bcategory\s*:\s*['"`]([^'"`]+)['"`]/);

  let description: string | null = null;
  const descObjectMatch = slice.match(/description\s*:\s*\{[^}]*?\bid\s*:\s*['"`]([^'"`]+)['"`]/);
  if (descObjectMatch) {
    description = descObjectMatch[1];
  } else {
    const descPlainMatch = slice.match(/description\s*:\s*['"`]([^'"`]+)['"`]/);
    if (descPlainMatch) description = descPlainMatch[1];
  }

  if (nameMatch || categoryMatch || description) {
    return {
      name: nameMatch ? nameMatch[1] : fallbackName,
      category: categoryMatch ? categoryMatch[1] : fallbackCategory,
      description: description || `Plugin kategori ${fallbackCategory} dari repo KANA.`,
      metaSource: description && nameMatch ? "config" : "fallback",
    };
  }

  return {
    name: fallbackName,
    category: fallbackCategory,
    description: `Plugin kategori ${fallbackCategory} dari repo KANA.`,
    metaSource: "fallback",
  };
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
        const commit = await fetchCommitInfo(file.path);
        const info: PluginInfo = {
          name: meta.name,
          category,
          path: file.path,
          description: meta.description,
          metaSource: meta.metaSource,
          updatedAt: commit.updatedAt,
          sha: commit.sha,
          size: file.size,
          rawUrl,
          content,
        };
        return info;
      })
    );

    plugins.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return plugins;
  } catch {
    return [];
  }
}

export async function getPluginCount(): Promise<number> {
  const plugins = await getPlugins();
  return plugins.length;
}

export async function getCategories(plugins: PluginInfo[]): Promise<string[]> {
  return Array.from(new Set(plugins.map((p) => p.category))).sort();
}
