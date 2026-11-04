export const DEFAULT_DAILY_LIMIT = 30;

export function levelFromXp(xp: number): number {
  const n = Math.max(0, Math.floor(Number(xp) || 0));
  return Math.floor(Math.sqrt(n / 50)) + 1;
}

export function xpForLevel(level: number): number {
  const l = Math.max(1, Math.floor(Number(level) || 1));
  return 50 * (l - 1) * (l - 1);
}

export function wibDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export interface XpProgress {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpInLevel: number;
  xpNeeded: number;
  percent: number;
}

export function xpProgress(xp: number): XpProgress {
  const level = levelFromXp(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpInLevel = Math.max(0, (Number(xp) || 0) - currentLevelXp);
  const xpNeeded = Math.max(1, nextLevelXp - currentLevelXp);
  const percent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
  return { level, currentLevelXp, nextLevelXp, xpInLevel, xpNeeded, percent };
}

export function limitLeftToday(profile: { limitDate?: string; limitLeft?: number }): number {
  const today = wibDateString();
  if (!profile || profile.limitDate !== today) return DEFAULT_DAILY_LIMIT;
  return Math.max(0, profile.limitLeft ?? DEFAULT_DAILY_LIMIT);
}

export function formatDateValue(value: unknown): string {
  if (value === null || value === undefined || value === "" || value === 0) return "Belum pernah";
  if (typeof value === "number") {
    try {
      return new Date(value).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    } catch {
      return String(value);
    }
  }
  return String(value);
}
