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
      className="bg-gradient-brand rounded-full px-4 py-2 text-sm font-bold text-white hover:opacity-90"
    >
      Keluar
    </button>
  );
}
