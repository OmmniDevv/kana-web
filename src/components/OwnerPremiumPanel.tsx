"use client";

import { useState } from "react";

export interface AccessEntry {
  key: string;
  active: boolean;
  expired: boolean;
  permanent: boolean;
  expiresAt: number | null;
  record: { type?: string; addedBy?: string; addedAt?: number; note?: string };
}

function fmtDate(ms: number | null): string {
  if (!ms) return "permanen";
  try {
    return new Date(ms).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  } catch {
    return String(ms);
  }
}

function StatusPill({ e }: { e: AccessEntry }) {
  const text = e.permanent && e.active ? "Aktif permanen" : e.active ? `Aktif s.d. ${fmtDate(e.expiresAt)}` : "Sudah berakhir";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${e.active ? "bg-gradient-brand text-white" : "border border-line text-muted"}`}>{text}</span>
  );
}

export default function OwnerPremiumPanel({ initialPremium, initialSewa }: { initialPremium: AccessEntry[]; initialSewa: AccessEntry[] }) {
  const [premium, setPremium] = useState<AccessEntry[]>(initialPremium);
  const [sewa, setSewa] = useState<AccessEntry[]>(initialSewa);
  const [premPhone, setPremPhone] = useState("");
  const [premDays, setPremDays] = useState("30");
  const [premPermanent, setPremPermanent] = useState(false);
  const [sewaTarget, setSewaTarget] = useState("");
  const [sewaKind, setSewaKind] = useState<"group" | "jadibot">("group");
  const [sewaDays, setSewaDays] = useState("30");
  const [sewaPermanent, setSewaPermanent] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const res = await fetch("/api/owner/premium");
      const data = await res.json();
      if (data.ok) {
        setPremium(data.premium || []);
        setSewa(data.sewa || []);
      }
    } catch {
      // abaikan, pesan aksi terakhir tetap tampil
    }
  }

  async function send(payload: Record<string, unknown>, okText: string) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/owner/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.error || "Gagal menyimpan perubahan");
        return;
      }
      setMessage(okText);
      await refresh();
    } catch {
      setMessage("Jaringan bermasalah, coba lagi ya");
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "w-full rounded-2xl border border-line bg-bgsoft px-4 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-violet";
  const btnCls = "bg-gradient-brand rounded-full px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60";

  return (
    <section className="mt-12">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-fuchsia">Panel Owner</p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Premium dan Sewa</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
        Perubahan di panel ini menulis data yang sama dengan perintah bot .addprem dan .addsewa, jadi langsung terbaca bot.
        Menambah durasi ke nomor yang masih aktif akan menumpuk dari sisa masa aktifnya, sama seperti di bot.
      </p>
      {message ? <p className="mt-4 rounded-2xl bg-bgsoft px-4 py-3 text-sm font-semibold">{message}</p> : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-panel p-6">
          <h3 className="font-bold">💎 Tambah Premium Personal</h3>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              send({ action: "addPremium", phone: premPhone, days: Number(premDays) || 30, permanent: premPermanent }, "Premium tersimpan");
            }}
          >
            <input value={premPhone} onChange={(e) => setPremPhone(e.target.value)} placeholder="Nomor WhatsApp, contoh 62812xxxx" className={inputCls} required />
            <div className="flex items-center gap-3">
              <input value={premDays} onChange={(e) => setPremDays(e.target.value)} type="number" min={1} max={3650} disabled={premPermanent} className={inputCls} placeholder="Durasi hari" />
              <label className="flex shrink-0 items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={premPermanent} onChange={(e) => setPremPermanent(e.target.checked)} /> Permanen
              </label>
            </div>
            <button disabled={busy} className={btnCls}>Simpan Premium</button>
          </form>

          <h4 className="mt-7 font-bold">Daftar premium ({premium.length})</h4>
          {premium.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Belum ada premium yang tercatat.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {premium.map((e) => (
                <li key={e.key} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-bgsoft px-4 py-3">
                  <span className="font-mono font-semibold">{e.key}</span>
                  <span className="flex items-center gap-2">
                    <StatusPill e={e} />
                    <button disabled={busy} onClick={() => send({ action: "deletePremium", phone: e.key }, "Premium dihapus")} className="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-violet disabled:opacity-60">Hapus</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-line bg-panel p-6">
          <h3 className="font-bold">🏠 Tambah Sewa</h3>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              send({ action: "addSewa", target: sewaTarget, kind: sewaKind, days: Number(sewaDays) || 30, permanent: sewaPermanent }, "Sewa tersimpan");
            }}
          >
            <input value={sewaTarget} onChange={(e) => setSewaTarget(e.target.value)} placeholder={sewaKind === "group" ? "JID grup, contoh 120363xxxx@g.us" : "Nomor jadibot, contoh 62812xxxx"} className={inputCls} required />
            <div className="flex flex-wrap items-center gap-3">
              <select value={sewaKind} onChange={(e) => setSewaKind(e.target.value as "group" | "jadibot")} className={inputCls}>
                <option value="group">Sewa grup</option>
                <option value="jadibot">Sewa jadibot</option>
              </select>
              <input value={sewaDays} onChange={(e) => setSewaDays(e.target.value)} type="number" min={1} max={3650} disabled={sewaPermanent} className={inputCls} placeholder="Durasi hari" />
              <label className="flex shrink-0 items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={sewaPermanent} onChange={(e) => setSewaPermanent(e.target.checked)} /> Permanen
              </label>
            </div>
            <button disabled={busy} className={btnCls}>Simpan Sewa</button>
          </form>

          <h4 className="mt-7 font-bold">Daftar sewa ({sewa.length})</h4>
          {sewa.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Belum ada sewa yang tercatat.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {sewa.map((e) => (
                <li key={e.key} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-bgsoft px-4 py-3">
                  <span className="font-mono font-semibold">{e.key} <span className="font-sans text-xs text-muted">({e.record.type === "jadibot" ? "jadibot" : "grup"})</span></span>
                  <span className="flex items-center gap-2">
                    <StatusPill e={e} />
                    <button disabled={busy} onClick={() => send({ action: "deleteSewa", target: e.key, kind: e.record.type === "jadibot" ? "jadibot" : "group" }, "Sewa dihapus")} className="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-violet disabled:opacity-60">Hapus</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
