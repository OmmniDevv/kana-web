import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kana.omnicorp.web.id"),
  title: "KANA, Bot WhatsApp Moe",
  description: "KANA Web, katalog plugin dan dashboard member bot WhatsApp KANA. Masuk dengan kode WhatsApp yang diminta dari web.",
  openGraph: {
    title: "KANA, Bot WhatsApp Moe",
    description: "Katalog plugin dan dashboard member bot WhatsApp KANA.",
    images: ["/banner.jpg"],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  return (
    <html lang="id" className={plusJakarta.variable}>
      <body className="min-h-screen bg-[#06090a] text-[#e8f5ea] antialiased">
        <header className="sticky top-0 z-40 border-b border-[#1d2b20] bg-[#06090a]/90 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3dff5e] text-lg font-black text-black">K</span>
              <span className="text-lg font-extrabold tracking-tight">KANA Web</span>
            </Link>
            <nav className="flex items-center gap-2 text-sm font-semibold sm:gap-4">
              <Link href="/" className="rounded-full px-3 py-2 hover:bg-[#101a13]">Beranda</Link>
              <Link href="/plugins" className="rounded-full px-3 py-2 hover:bg-[#101a13]">Plugin</Link>
              <Link href="/dashboard" className="rounded-full px-3 py-2 hover:bg-[#101a13]">Dashboard</Link>
              {session ? (
                <LogoutButton />
              ) : (
                <Link href="/login" className="rounded-full bg-[#3dff5e] px-4 py-2 font-bold text-black hover:bg-[#a3ff5e]">Masuk</Link>
              )}
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-[#1d2b20] py-10">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-6 text-sm text-[#9db8a4] sm:flex-row sm:items-center sm:justify-between">
            <p>KANA, Bot WhatsApp Moe. Katalog plugin diambil langsung dari GitHub OmmniDevv/kana-md.</p>
            <p>Login aman dengan kode WhatsApp sekali pakai.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
