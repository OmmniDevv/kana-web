"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("kana-theme", next ? "dark" : "light");
    } catch {
      // penyimpanan lokal tidak tersedia, abaikan
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel text-base transition-colors hover:border-violet"
    >
      {dark ? "☾" : "☀"}
    </button>
  );
}
