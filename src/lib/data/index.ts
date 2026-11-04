import type { DataAdapter } from "./types";
import { DemoAdapter } from "./demo";
import { SupabaseAdapter } from "./supabase";

export type { DataAdapter, UserProfile, LoginRequestRecord, BotStatus } from "./types";
export { defaultProfile, normalizeProfile } from "./types";

let cached: DataAdapter | null = null;

export function getAdapter(): DataAdapter {
  if (cached) return cached;
  const mode = (process.env.DATA_MODE || "").toLowerCase();
  if (mode === "demo") {
    cached = new DemoAdapter();
    return cached;
  }
  if (mode === "supabase") {
    cached = new SupabaseAdapter();
    return cached;
  }
  if (process.env.KANA_DATABASE_URL) {
    cached = new SupabaseAdapter();
  } else {
    cached = new DemoAdapter();
  }
  return cached;
}

export function isDemoMode(): boolean {
  return getAdapter().mode === "demo";
}
