import type { BotStatus, DataAdapter, LoginRequestRecord, UserProfile } from "./types";
import { normalizeProfile } from "./types";
import { wibDateString } from "../profile";

type GlobalStore = {
  __kanaLoginRequests?: Map<string, LoginRequestRecord>;
  __kanaRateLimit?: Map<string, number>;
};

const g = globalThis as unknown as GlobalStore;
if (!g.__kanaLoginRequests) g.__kanaLoginRequests = new Map();
if (!g.__kanaRateLimit) g.__kanaRateLimit = new Map();

const loginRequests = g.__kanaLoginRequests;
const rateLimit = g.__kanaRateLimit;

function demoProfiles(): Record<string, UserProfile> {
  const today = wibDateString();
  return {
    "6281200000001": normalizeProfile({
      xp: 1250,
      balance: 5400,
      banned: false,
      registeredAt: "2026-10-01T08:00:00.000Z",
      name: "Rani Demo",
      limitDate: today,
      limitLeft: 22,
      inventory: { potion: 3, seed: 12, kayu: 7 },
      pet: { name: "Mochi", type: "kucing", level: 3 },
      job: "Petani",
      clanId: "DEMO",
      lastDaily: today,
      lastHourly: Date.now() - 3600000,
      lastWeekly: "2026-10-28",
    }),
    "6281200000002": normalizeProfile({
      xp: 3400,
      balance: 12100,
      banned: false,
      registeredAt: "2026-09-15T08:00:00.000Z",
      name: "Bima Demo",
      limitDate: today,
      limitLeft: 18,
      inventory: { pedang: 1, shield: 1, potion: 5 },
      pet: { name: "Kuro", type: "serigala", level: 5 },
      job: "Ksatria",
      clanId: "DEMO",
      lastDaily: today,
      lastHourly: Date.now() - 7200000,
      lastWeekly: "2026-10-27",
    }),
    "6281200000003": normalizeProfile({
      xp: 800,
      balance: 2300,
      banned: false,
      registeredAt: "2026-10-20T08:00:00.000Z",
      name: "Sinta Demo",
      limitDate: today,
      limitLeft: 27,
      inventory: { bunga: 9, potion: 2 },
      pet: null,
      job: "Penjelajah",
      clanId: "",
      lastDaily: "2026-11-02",
      lastHourly: 0,
      lastWeekly: "",
    }),
  };
}

export class DemoAdapter implements DataAdapter {
  mode = "demo" as const;

  async getLoginRequest(phone: string): Promise<LoginRequestRecord | null> {
    return loginRequests.get(phone) ?? null;
  }

  async putLoginRequest(phone: string, record: LoginRequestRecord): Promise<void> {
    loginRequests.set(phone, record);
  }

  async deleteLoginRequest(phone: string): Promise<void> {
    loginRequests.delete(phone);
  }

  async getUserProfile(phone: string): Promise<UserProfile | null> {
    const profiles = demoProfiles();
    if (profiles[phone]) return profiles[phone];
    // Samakan kontrak dengan adapter Supabase: nomor tanpa profil demo
    // mengembalikan null supaya dashboard menampilkan keadaan kosong.
    return null;
  }

  async listUserKeys(): Promise<string[]> {
    return Object.keys(demoProfiles());
  }

  async getBotStatus(): Promise<BotStatus | null> {
    return {
      startedAt: Date.now() - 86400000,
      totalUsers: 2,
      totalCommands: 12840,
      pluginCount: 176,
      updatedAt: Date.now(),
      topCommands: [
        { name: "menu", count: 2100 },
        { name: "ping", count: 1800 },
        { name: "spotify", count: 950 },
      ],
      scraperHealth: {
        spotify: "ok DEMO",
        youtube: "ok DEMO",
        tiktok: "ok DEMO",
      },
    };
  }

  async getDailyCount(phone: string, dateKey: string): Promise<number> {
    return rateLimit.get(`${phone}:${dateKey}`) ?? 0;
  }

  async bumpDailyCount(phone: string, dateKey: string): Promise<number> {
    const key = `${phone}:${dateKey}`;
    const next = (rateLimit.get(key) ?? 0) + 1;
    rateLimit.set(key, next);
    return next;
  }
}
