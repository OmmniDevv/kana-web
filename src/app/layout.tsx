import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";
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
          <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-3">
              <span className="bg-gradient-brand flex h-9 w-9 items-center justify-center rounded-xl text-lg font-black text-white">K</span>
              <span className="text-lg font-extrabold tracking-tight">KANA Web</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
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
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-line py-10">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>KANA, Bot WhatsApp Moe. Katalog plugin diambil langsung dari GitHub OmmniDevv/kana-md.</p>
            <p>Login aman dengan kode WhatsApp sekali pakai.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
