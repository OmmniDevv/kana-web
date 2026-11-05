import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";
import MobileNav from "@/components/MobileNav";
import ThemeToggle from "@/components/ThemeToggle";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

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

const themeScript = `(function(){try{var t=localStorage.getItem("kana-theme");if(t==="dark"){document.documentElement.classList.add("dark");}}catch(e){}})();`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  return (
    <html lang="id" className={`${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-bg font-sans text-ink antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Logo OmniDevv" width={609} height={386} priority className="h-8 w-auto sm:h-9" />
              <span className="whitespace-nowrap text-lg font-extrabold tracking-tight">KANA Web</span>
            </Link>
            <nav className="hidden items-center gap-1 text-sm font-semibold sm:gap-2 md:flex">
              <Link href="/" className="rounded-full px-3 py-2 hover:bg-panel2">Beranda</Link>
              <Link href="/plugins" className="rounded-full px-3 py-2 hover:bg-panel2">Plugin</Link>
              <Link href="/dashboard" className="rounded-full px-3 py-2 hover:bg-panel2">Dashboard</Link>
              <ThemeToggle />
              {session ? (
                <LogoutButton />
              ) : (
                <Link href="/login" className="bg-gradient-brand rounded-full px-4 py-2 font-bold text-white hover:opacity-90">Masuk</Link>
              )}
            </nav>
            <div className="flex items-center gap-1.5 md:hidden">
              <ThemeToggle />
              {session ? null : (
                <Link href="/login" className="bg-gradient-brand whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold text-white hover:opacity-90">Masuk</Link>
              )}
              <MobileNav loggedIn={Boolean(session)} />
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-line py-10">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-6 text-sm text-muted">
            <nav className="flex flex-wrap gap-2 font-semibold">
              <Link href="/premium" className="rounded-full border border-line px-4 py-2 hover:border-violet">💎 Premium dan Sewa</Link>
              <Link href="/leaderboard" className="rounded-full border border-line px-4 py-2 hover:border-violet">🏆 Leaderboard</Link>
              <Link href="/status" className="rounded-full border border-line px-4 py-2 hover:border-violet">Status Bot</Link>
              <Link href="/plugins" className="rounded-full border border-line px-4 py-2 hover:border-violet">Katalog Plugin</Link>
              <Link href="/dashboard" className="rounded-full border border-line px-4 py-2 hover:border-violet">Dashboard</Link>
            </nav>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>KANA, Bot WhatsApp Moe. Katalog plugin diambil langsung dari GitHub OmmniDevv/kana-md.</p>
              <p>Login aman dengan kode WhatsApp sekali pakai.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
