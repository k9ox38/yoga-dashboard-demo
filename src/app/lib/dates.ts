/** Local-calendar date helpers. Never use Date#toISOString for calendar days (UTC shift in UTC+8). */

export function localDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Parse YYYY-MM-DD as a local calendar day at noon (avoids DST/midnight edge cases). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) throw new Error(`Invalid local date: ${dateStr}`);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDays(dateStr: string, days: number): string {
  const next = parseLocalDate(dateStr);
  next.setDate(next.getDate() + days);
  return localDate(next);
}

export function addDaysFromToday(days: number, today: Date = new Date()): string {
  return addDays(localDate(today), days);
}

/** Inclusive day difference: expiry - from. 0 means same calendar day. */
export function daysBetween(fromDate: string, toDate: string): number {
  const from = parseLocalDate(fromDate);
  const to = parseLocalDate(toDate);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export function daysUntil(dateStr: string, from: string = localDate()): number {
  return daysBetween(from, dateStr);
}

/** Format local datetime for demo records without UTC shift. */
export function localDateTime(date: Date = new Date()): string {
  const day = localDate(date);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${day} ${hh}:${mm}:${ss}`;
}

export function shiftLocalDateTime(days: number, time = "10:00:00", today: Date = new Date()): string {
  return `${addDaysFromToday(days, today)} ${time}`;
}

export function monthLabel(date: Date): string {
  return `${date.getMonth() + 1}月`;
}

/** Last `count` calendar months ending at `anchor` (inclusive), oldest first. */
export function recentMonthKeys(count: number, anchor: Date = new Date()): Array<{ key: string; label: string; year: number; month: number }> {
  const out: Array<{ key: string; label: string; year: number; month: number }> = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1, 12, 0, 0, 0);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    out.push({
      key: `${year}-${String(month).padStart(2, "0")}`,
      label: monthLabel(d),
      year,
      month,
    });
  }
  return out;
}
