export interface UserProfile {
  xp: number;
  balance: number;
  banned: boolean;
  registered: boolean;
  registeredAt: string | number | null;
  name: string;
  limitDate: string;
  limitLeft: number;
  inventory: Record<string, number>;
  pet: unknown;
  job: string;
  clanId: string;
  lastDaily: string;
  lastHourly: number | string;
  lastWeekly: string;
  lastSeen?: number | null;
}

export interface LoginRequestRecord {
  codeHash: string;
  codePlain?: string;
  expiresAt: string;
  status: "pending" | "sent" | "used" | "expired";
  attempts: number;
  createdAt: string;
}

export interface WebLoginCodeRecord {
  // Kontrak docs/WEB.md kana-md jalur .webcode: namespace web_login,
  // value { codeHash, expiresAt } dan expiresAt epoch ms (string ISO juga
  // diterima pembaca supaya tahan format lama).
  codeHash: string;
  expiresAt: number | string;
}

export interface BotStatus {
  // Kontrak docs/WEB.md kana-md: namespace kv, key bot_stats.
  startedAt?: number;
  totalUsers?: number;
  totalCommands?: number;
  pluginCount?: number;
  updatedAt?: number;
  // Field lama dari heartbeat bot_status, dipertahankan sebagai cadangan.
  onlineSince?: string | number;
  lastSeen?: string | number;
  commandsTotal?: number;
  topCommands?: Array<{ name: string; count: number } | string>;
  scraperHealth?: Record<string, unknown> | Array<unknown>;
  [key: string]: unknown;
}

export interface AccessRecord {
  expiresAt?: number | string | null;
  addedBy?: string;
  addedAt?: number;
  note?: string;
  type?: string;
}

export interface TopUser {
  name: string;
  xp: number;
  level: number;
}

export interface DataAdapter {
  mode: "supabase";
  getLoginRequest(phone: string): Promise<LoginRequestRecord | null>;
  putLoginRequest(phone: string, record: LoginRequestRecord): Promise<void>;
  deleteLoginRequest(phone: string): Promise<void>;
  listWebLoginCodes(): Promise<Array<{ phone: string; record: WebLoginCodeRecord }>>;
  deleteWebLoginCode(phone: string): Promise<void>;
  getUserProfile(phone: string): Promise<UserProfile | null>;
  listUserKeys(): Promise<string[]>;
  getBotStatus(): Promise<BotStatus | null>;
  getDailyCount(phone: string, dateKey: string): Promise<number>;
  bumpDailyCount(phone: string, dateKey: string): Promise<number>;
  getPremiumRecord(phone: string): Promise<AccessRecord | null>;
  listPremium(): Promise<Array<{ key: string; record: AccessRecord }>>;
  putPremium(phone: string, record: AccessRecord): Promise<void>;
  deletePremium(phone: string): Promise<void>;
  getSewaRecord(key: string): Promise<AccessRecord | null>;
  listSewa(): Promise<Array<{ key: string; record: AccessRecord }>>;
  putSewa(key: string, record: AccessRecord): Promise<void>;
  deleteSewa(key: string): Promise<void>;
  getUsageCount(phone: string, group: string, dateKey: string): Promise<number>;
  getTopUsers(): Promise<TopUser[]>;
}

export function defaultProfile(): UserProfile {
  return {
    xp: 0,
    balance: 0,
    banned: false,
    registered: false,
    registeredAt: null,
    name: "",
    limitDate: "",
    limitLeft: 30,
    inventory: {},
    pet: null,
    job: "",
    clanId: "",
    lastDaily: "",
    lastHourly: 0,
    lastWeekly: "",
  };
}

export function normalizeProfile(raw: Record<string, unknown> | null | undefined): UserProfile {
  const base = defaultProfile();
  if (!raw) return base;
  return {
    ...base,
    xp: Number(raw.xp ?? 0) || 0,
    balance: Number(raw.balance ?? 0) || 0,
    banned: Boolean(raw.banned ?? false),
    registered: Boolean(raw.registered ?? false),
    registeredAt: (raw.registeredAt as string | number | null) ?? null,
    name: String(raw.name ?? raw.regName ?? ""),
    limitDate: String(raw.limitDate ?? ""),
    limitLeft: Number(raw.limitLeft ?? 30) || 0,
    inventory: (raw.inventory as Record<string, number>) ?? {},
    pet: raw.pet ?? null,
    job: String(raw.job ?? ""),
    clanId: String(raw.clanId ?? ""),
    lastDaily: String(raw.lastDaily ?? ""),
    lastHourly: (raw.lastHourly as number | string) ?? 0,
    lastWeekly: String(raw.lastWeekly ?? ""),
    lastSeen: (raw.lastSeen as number | null) ?? null,
  };
}
