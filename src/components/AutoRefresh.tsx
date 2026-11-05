"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Segarkan data server component halaman ini berkala tanpa reload penuh.
export default function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), Math.max(15, seconds) * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
