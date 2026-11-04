export function normalizePhone(input: string): string | null {
  if (!input) return null;
  let digits = String(input).replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("8")) digits = "62" + digits;
  if (!/^62\d{8,13}$/.test(digits)) return null;
  return digits;
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}
