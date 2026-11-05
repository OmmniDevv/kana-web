// Helper premium, sewa, dan limit untuk web. Semantiknya meniru service
// bot di kana-md (src/services/premium.js dan src/services/limit.js)
// supaya web dan bot membaca record yang sama dengan arti yang sama:
// - premium: namespace "premium", key digit, expiresAt epoch ms atau
//   null untuk permanen.
// - sewa: namespace "sewa_bot", key JID grup atau digit (jadibot).
// - limit: namespace "usage_limits", key "<digit>:<grup>:<tanggal WIB>".

export interface AccessRecord {
  expiresAt?: number | string | null;
  addedBy?: string;
  addedAt?: number;
  note?: string;
  type?: string;
}

export interface AccessStatus {
  exists: boolean;
  active: boolean;
  expired: boolean;
  permanent: boolean;
  expiresAt: number | null;
}

export function parseExpiresAtMs(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw === "string" && raw.trim()) {
    const asNumber = Number(raw);
    if (Number.isFinite(asNumber) && /^\d+$/.test(raw.trim())) return asNumber;
    return Date.parse(raw);
  }
  return NaN;
}

export function recordStatus(record: AccessRecord | null | undefined, nowMs: number = Date.now()): AccessStatus {
  if (!record) return { exists: false, active: false, expired: false, permanent: false, expiresAt: null };
  const raw = record.expiresAt;
  if (raw === null || raw === undefined) {
    return { exists: true, active: true, expired: false, permanent: true, expiresAt: null };
  }
  const expiresAt = parseExpiresAtMs(raw);
  if (!Number.isFinite(expiresAt)) {
    return { exists: true, active: false, expired: true, permanent: false, expiresAt: null };
  }
  const active = nowMs < expiresAt;
  return { exists: true, active, expired: !active, permanent: false, expiresAt };
}

// Perpanjangan menumpuk dari sisa aktif lama, sama seperti bot:
// permanen di salah satu sisi menghasilkan permanen.
export function nextExpiresAt(existing: AccessRecord | null | undefined, days: number | null, nowMs: number = Date.now()): number | null {
  if (days === null) return null;
  const status = recordStatus(existing, nowMs);
  if (status.permanent) return null;
  const base = status.active && status.expiresAt ? status.expiresAt : nowMs;
  return base + days * 24 * 60 * 60 * 1000;
}

export const LIMIT_GROUPS: Record<string, { free: number; paid: number; label: string }> = {
  download: { free: 5, paid: 50, label: "Download berat" },
  upscale: { free: 3, paid: 20, label: "Upscale" },
};

export function quotaFor(group: string, paidTier: boolean): number {
  const cfg = LIMIT_GROUPS[group];
  if (!cfg) return 0;
  return paidTier ? cfg.paid : cfg.free;
}

export function statusLabel(status: AccessStatus): string {
  if (!status.exists) return "Tidak aktif";
  if (status.permanent) return "Aktif, permanen";
  if (status.active) return "Aktif";
  return "Sudah berakhir";
}
