"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/plugins", label: "Plugin" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function MobileNav({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  return (
    <div ref={rootRef} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="menu-mobile"
        aria-label={open ? "Tutup menu navigasi" : "Buka menu navigasi"}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel transition-colors hover:border-violet"
      >
        {open ? (
          <span aria-hidden="true" className="text-lg font-bold leading-none">✕</span>
        ) : (
          <span aria-hidden="true" className="flex flex-col items-center gap-[5px]">
            <span className="block h-[2px] w-5 rounded bg-current" />
            <span className="block h-[2px] w-5 rounded bg-current" />
            <span className="block h-[2px] w-5 rounded bg-current" />
          </span>
        )}
      </button>
      {open ? (
        <div
          id="menu-mobile"
          className="animate-menuDrop absolute right-0 top-[calc(100%+10px)] z-50 w-64 rounded-3xl border border-line bg-panel p-3 shadow-2xl shadow-violet/20"
        >
          <nav aria-label="Menu mobile" className="flex flex-col">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-panel2"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 border-t border-line px-1 pb-1 pt-3 [&>button]:w-full">
            {loggedIn ? (
              <LogoutButton />
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="bg-gradient-brand block rounded-full px-4 py-2.5 text-center text-sm font-bold text-white hover:opacity-90"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
