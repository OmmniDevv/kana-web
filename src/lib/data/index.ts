import type { DataAdapter } from "./types";
import { SupabaseAdapter } from "./supabase";

export type { DataAdapter, UserProfile, LoginRequestRecord, WebLoginCodeRecord, BotStatus, AccessRecord, TopUser } from "./types";
export { defaultProfile, normalizeProfile } from "./types";

let cached: DataAdapter | null = null;

export function getAdapter(): DataAdapter {
  if (cached) return cached;
  cached = new SupabaseAdapter();
  return cached;
}
