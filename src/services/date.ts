const DAY_MS = 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toDayKey(input: Date | string | number = new Date()): string {
  const date = typeof input === "object" ? input : new Date(input);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDayKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function endOfToday(): Date {
  return new Date(startOfToday().getTime() + DAY_MS - 1);
}

export function formatDateShort(key: string): string {
  const date = parseDayKey(key);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatReviewTime(iso: string | null): string {
  if (!iso) return "待安排";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "待安排";
  const sameDay = toDayKey(date) === toDayKey();
  const clock = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
  if (sameDay) return `今天 ${clock}`;
  const tomorrow = addDays(startOfToday(), 1);
  if (date >= tomorrow && date < addDays(tomorrow, 1)) return `明天 ${clock}`;
  return `${date.getMonth() + 1}月${date.getDate()}日 ${clock}`;
}
