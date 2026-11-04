import { Pool } from "pg";
import type { BotStatus, DataAdapter, LoginRequestRecord, UserProfile } from "./types";
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
}
