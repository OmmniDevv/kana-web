"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "phone" | "code" | "success";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function fail(message: string) {
    setError(message);
    setShakeKey((k) => k + 1);
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (step !== "code" || !phone) return;
    const digits = phone.replace(/\D/g, "");
    const poll = async () => {
      try {
        const res = await fetch(`/api/auth/status?phone=${encodeURIComponent(digits)}`);
        const data = await res.json();
        if (data.status === "pending") setStatusText("Kode sedang disiapkan");
        else if (data.status === "sent") setStatusText("Kode terkirim, cek WhatsApp kamu");
        else if (data.status === "used") setStatusText("Kode sudah dipakai");
        else if (data.status === "expired") setStatusText("Kode kedaluwarsa, minta kode baru ya");
        else if (data.status === "none") setStatusText("Belum ada permintaan kode");
        else setStatusText(`Status kode: ${data.status}`);
      } catch {
        // abaikan error polling sesaat
      }
    };
    poll();
    pollRef.current = setInterval(poll, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, phone]);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        fail(data.error || "Gagal meminta kode");
        return;
      }
      if (data.demo) {
        setIsDemo(true);
        setDemoCode(data.demoCode || null);
      }
      setStatusText("Kode sedang disiapkan");
      setStep("code");
    } catch {
      fail("Jaringan bermasalah, coba lagi ya");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        fail(data.error || "Kode salah atau kedaluwarsa");
        return;
      }
      setStep("success");
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
      <div className="mb-6 rounded-3xl border border-warn bg-warnbg p-4 text-sm text-warn">
        <strong>MODE DEMO bila database belum terhubung:</strong> kode demo akan tampil di halaman ini dalam kotak DEMO. Di mode produksi, kode hanya dikirim lewat WhatsApp oleh bot.
      </div>

      <div key={shakeKey} className={error ? "animate-shake" : ""}>
        <div className="rounded-3xl border border-line bg-panel p-8">
          <h1 className="text-3xl font-black">Masuk KANA Web</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Masukkan nomor WhatsApp kamu. Kode login diminta dari web ini, lalu bot mengirimnya ke WhatsApp kamu.</p>

          {step === "success" ? (
            <div className="mt-8 text-center">
              <div className="animate-checkPop mx-auto bg-gradient-brand flex h-16 w-16 items-center justify-center rounded-full text-3xl font-black text-white">&#10003;</div>
              <p className="mt-4 font-bold">Berhasil masuk, mengalihkan ke dashboard...</p>
            </div>
          ) : step === "phone" ? (
            <form onSubmit={requestCode} className="mt-8 space-y-4">
              <label className="block text-sm font-bold">Nomor WhatsApp</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812xxxxxxx atau 62812xxxxxxx"
                inputMode="tel"
                className="w-full rounded-2xl border border-line bg-bgsoft px-4 py-3 text-ink outline-none placeholder:text-muted focus:border-violet"
                required
              />
              {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
              <button disabled={loading} className="bg-gradient-brand w-full rounded-full py-3 font-bold text-white hover:opacity-90 disabled:opacity-60">
                {loading ? "Meminta kode..." : "Minta Kode via WhatsApp"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="mt-8 space-y-4">
              <p className="rounded-2xl bg-bgsoft px-4 py-3 text-sm">{statusText || "Kode sedang disiapkan"}</p>
              {isDemo && demoCode ? (
                <div className="rounded-2xl border border-warn bg-warnbg p-4 text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-warn">Peringatan DEMO, kode contoh</p>
                  <p className="animate-popIn mt-2 text-4xl font-black tracking-[0.3em]">{demoCode}</p>
                  <p className="mt-2 text-xs text-warn">Kode ini hanya tampil di mode demo karena tidak ada bot yang mengirim WhatsApp.</p>
                </div>
              ) : null}
              <label className="block text-sm font-bold">Kode 6 digit</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                className="w-full rounded-2xl border border-line bg-bgsoft px-4 py-3 text-center font-mono text-2xl font-black tracking-[0.4em] text-ink outline-none placeholder:text-muted focus:border-violet"
                required
              />
              {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
              <button disabled={loading} className="bg-gradient-brand w-full rounded-full py-3 font-bold text-white hover:opacity-90 disabled:opacity-60">
                {loading ? "Memeriksa kode..." : "Verifikasi dan Masuk"}
              </button>
              <button type="button" onClick={() => { setStep("phone"); setCode(""); setError(""); }} className="w-full text-sm font-semibold text-muted hover:text-ink">Ganti nomor atau minta kode baru</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
