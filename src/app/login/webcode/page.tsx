"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginWebcodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function fail(message: string) {
    setError(message);
    setShakeKey((k) => k + 1);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-webcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        fail(data.error || "Kode tidak cocok atau sudah kedaluwarsa");
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 700);
    } catch {
      fail("Jaringan bermasalah, coba lagi ya");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[560px] px-6 py-14">
      <div key={shakeKey} className={error ? "animate-shake" : ""}>
        <div className="rounded-3xl border border-line bg-panel p-8">
          <h1 className="text-3xl font-black">Masuk dengan Kode .webcode</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Sudah chat bot dan ketik .webcode di WhatsApp? Masukkan kode 6 karakter dari bot di sini. Halaman ini tidak meminta nomor HP, karena kode itu sudah terikat ke nomor kamu.</p>

          {success ? (
            <div className="mt-8 text-center">
              <div className="animate-checkPop mx-auto bg-gradient-brand flex h-16 w-16 items-center justify-center rounded-full text-3xl font-black text-white">&#10003;</div>
              <p className="mt-4 font-bold">Berhasil masuk, mengalihkan ke dashboard...</p>
            </div>
          ) : (
            <form onSubmit={verifyCode} className="mt-8 space-y-4">
              <label className="block text-sm font-bold">Kode dari .webcode</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\s/g, "").slice(0, 6))}
                placeholder="aB3xYz"
                autoComplete="one-time-code"
                className="w-full rounded-2xl border border-line bg-bgsoft px-4 py-3 text-center font-mono text-2xl font-black tracking-[0.4em] text-ink outline-none placeholder:text-muted focus:border-violet"
                required
              />
              <p className="text-sm leading-6 text-muted">Kode berlaku 10 menit dan hanya bisa dipakai sekali. Huruf besar dan kecil berpengaruh, ketik persis seperti di chat ya.</p>
              {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
              <button disabled={loading} className="bg-gradient-brand w-full rounded-full py-3 font-bold text-white hover:opacity-90 disabled:opacity-60">
                {loading ? "Memeriksa kode..." : "Masuk dengan Kode"}
              </button>
              <p className="text-center text-sm font-semibold text-muted">
                Belum punya kode?{" "}
                <Link href="/login" className="text-violet hover:underline">Masuk dengan nomor WhatsApp</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
