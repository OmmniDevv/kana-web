import { Pool } from "pg";
import type { AccessRecord, BotStatus, DataAdapter, LoginRequestRecord, TopUser, UserProfile, WebLoginCodeRecord } from "./types";
import { normalizeProfile } from "./types";

type GlobalPool = { __kanaPgPool?: Pool };
const g = globalThis as unknown as GlobalPool;

function getPool(): Pool {
  if (!g.__kanaPgPool) {
    const url = process.env.KANA_DATABASE_URL || "";
    const needsSsl = url.includes("supabase") || url.includes("pooler") || url.includes("sslmode");
    g.__kanaPgPool = new Pool({
      connectionString: url,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      max: 5,
    });
  }
  return g.__kanaPgPool;
}

async function kvGet<T>(ns: string, key: string): Promise<T | null> {
  const pool = getPool();
  const res = await pool.query("SELECT value FROM bot.kv WHERE ns = $1 AND key = $2 LIMIT 1", [ns, key]);
  if (res.rows.length === 0) return null;
  const value = res.rows[0].value;
  return (typeof value === "string" ? JSON.parse(value) : value) as T;
}

async function kvSet(ns: string, key: string, value: unknown, expiresAt: string | null): Promise<void> {
  const pool = getPool();
  await pool.query(
    "INSERT INTO bot.kv (ns, key, value, expires_at) VALUES ($1, $2, $3::jsonb, $4) ON CONFLICT (ns, key) DO UPDATE SET value = EXCLUDED.value, expires_at = EXCLUDED.expires_at",
    [ns, key, JSON.stringify(value), expiresAt]
  );
}

async function kvDelete(ns: string, key: string): Promise<void> {
  const pool = getPool();
  await pool.query("DELETE FROM bot.kv WHERE ns = $1 AND key = $2", [ns, key]);
}

async function kvKeys(ns: string): Promise<string[]> {
  const pool = getPool();
  const res = await pool.query("SELECT key FROM bot.kv WHERE ns = $1", [ns]);
  return res.rows.map((r: { key: string }) => r.key);
}

async function kvList(ns: string): Promise<Array<{ key: string; value: unknown }>> {
  const pool = getPool();
  const res = await pool.query("SELECT key, value FROM bot.kv WHERE ns = $1 ORDER BY key", [ns]);
  return res.rows.map((r: { key: string; value: unknown }) => ({
    key: r.key,
    value: typeof r.value === "string" ? JSON.parse(r.value) : r.value,
  }));
}

export class SupabaseAdapter implements DataAdapter {
  mode = "supabase" as const;

  async getLoginRequest(phone: string): Promise<LoginRequestRecord | null> {
    return kvGet<LoginRequestRecord>("web_login_requests", phone);
  }

  async putLoginRequest(phone: string, record: LoginRequestRecord): Promise<void> {
    await kvSet("web_login_requests", phone, record, record.expiresAt || null);
  }

  async deleteLoginRequest(phone: string): Promise<void> {
    await kvDelete("web_login_requests", phone);
  }

  // Jalur .webcode: bot menulis namespace web_login (satu record per nomor,
  // hanya hash kode). Verifikasi kode-saja harus memindai daftar ini karena
  // kode tidak membawa petunjuk nomor sama sekali.
  async listWebLoginCodes(): Promise<Array<{ phone: string; record: WebLoginCodeRecord }>> {
    const rows = await kvList("web_login");
    return rows
      .filter((r) => r.value && typeof r.value === "object" && typeof (r.value as WebLoginCodeRecord).codeHash === "string")
      .map((r) => ({ phone: r.key, record: r.value as WebLoginCodeRecord }));
  }

  async deleteWebLoginCode(phone: string): Promise<void> {
    await kvDelete("web_login", phone);
  }

  async getUserProfile(phone: string): Promise<UserProfile | null> {
    const raw = await kvGet<Record<string, unknown>>("users", phone);
    if (!raw) return null;
    return normalizeProfile(raw);
  }

  async listUserKeys(): Promise<string[]> {
    return kvKeys("users");
  }

  async getBotStatus(): Promise<BotStatus | null> {
    // Kontrak utama docs/WEB.md kana-md: bot menulis statistik ke namespace
    // kv dengan key bot_stats. Namespace bot_status key heartbeat hanya
    // cadangan lama bila bot_stats belum ada.
    const stats = await kvGet<BotStatus>("kv", "bot_stats");
    if (stats) return stats;
    return kvGet<BotStatus>("bot_status", "heartbeat");
  }

  async getDailyCount(phone: string, dateKey: string): Promise<number> {
    const rec = await kvGet<{ count: number }>("web_login_ratelimit", `${phone}:${dateKey}`);
    return rec?.count ?? 0;
  }

  async bumpDailyCount(phone: string, dateKey: string): Promise<number> {
    const key = `${phone}:${dateKey}`;
    const current = await this.getDailyCount(phone, dateKey);
    const next = current + 1;
    await kvSet("web_login_ratelimit", key, { count: next }, null);
    return next;
  }

  // Premium, sewa, dan limit: namespace yang sama dengan bot
  // ("premium", "sewa_bot", "usage_limits" di bot.kv). Bot mengaksesnya
  // lewat jembatan REST, web lewat adapter ini, datanya satu.
  async getPremiumRecord(phone: string): Promise<AccessRecord | null> {
    return kvGet<AccessRecord>("premium", phone);
  }

  async listPremium(): Promise<Array<{ key: string; record: AccessRecord }>> {
    const rows = await kvList("premium");
    return rows.map((r) => ({ key: r.key, record: (r.value ?? {}) as AccessRecord }));
  }

  async putPremium(phone: string, record: AccessRecord): Promise<void> {
    await kvSet("premium", phone, record, null);
  }

  async deletePremium(phone: string): Promise<void> {
    await kvDelete("premium", phone);
  }

  async getSewaRecord(key: string): Promise<AccessRecord | null> {
    return kvGet<AccessRecord>("sewa_bot", key);
  }

  async listSewa(): Promise<Array<{ key: string; record: AccessRecord }>> {
    const rows = await kvList("sewa_bot");
    return rows.map((r) => ({ key: r.key, record: (r.value ?? {}) as AccessRecord }));
  }

  async putSewa(key: string, record: AccessRecord): Promise<void> {
    await kvSet("sewa_bot", key, record, null);
  }

  async deleteSewa(key: string): Promise<void> {
    await kvDelete("sewa_bot", key);
  }

  async getUsageCount(phone: string, group: string, dateKey: string): Promise<number> {
    const rec = await kvGet<{ count: number }>("usage_limits", `${phone}:${group}:${dateKey}`);
    return Math.max(0, Number(rec?.count) || 0);
  }

  async getTopUsers(): Promise<TopUser[]> {
    const rows = await kvGet<unknown>("kv", "top_users");
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
      .map((r) => ({
        name: String(r.name ?? ""),
        xp: Math.max(0, Number(r.xp) || 0),
        level: Math.max(1, Number(r.level) || 1),
      }))
      .slice(0, 10);
  }
}
