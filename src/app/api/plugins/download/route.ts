import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "";
  if (
    !path.startsWith("plugins/") ||
    !path.endsWith(".js") ||
    path.includes("..") ||
    path.includes("\\")
  ) {
    return NextResponse.json({ ok: false, error: "Path tidak valid" }, { status: 400 });
  }
  const rawUrl = `https://raw.githubusercontent.com/OmmniDevv/kana-md/main/${path}`;
  try {
    const res = await fetch(rawUrl, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "File tidak ditemukan di GitHub" }, { status: 404 });
    }
    const content = await res.text();
    const basename = path.split("/").pop() || "plugin.js";
    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Content-Disposition": `attachment; filename="${basename}"`,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Gagal mengambil file dari GitHub" }, { status: 502 });
  }
}
