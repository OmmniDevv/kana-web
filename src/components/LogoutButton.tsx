"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  return (
    <button
      onClick={onLogout}
      className="rounded-full bg-[#3dff5e] px-4 py-2 text-sm font-bold text-black hover:bg-[#a3ff5e]"
    >
      Keluar
    </button>
  );
}
