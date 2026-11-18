import { addDays, daysBetween, localDate, parseLocalDate } from "./dates";

/** A YYYY-MM-DD range; an empty string means "open" on that side. */
export type DateRangeValue = { from: string; to: string };

export const DATE_PRESETS = ["今天", "昨天", "近 7 天", "近 30 天", "本周", "下周", "本月", "上月"] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

/** For filters over records that already happened (orders, reconciliation, audit log). */
export const PAST_PRESETS: DatePreset[] = ["今天", "昨天", "近 7 天", "近 30 天", "本月", "上月"];
/** For filters over upcoming sessions. */
export const UPCOMING_PRESETS: DatePreset[] = ["今天", "本周", "下周", "本月"];

const monthEdge = (day: string, monthOffset: number, end: boolean) => {
  const date = parseLocalDate(day);
  return localDate(new Date(date.getFullYear(), date.getMonth() + monthOffset + (end ? 1 : 0), end ? 0 : 1, 12));
};

/** Inclusive calendar range for a preset (weeks start on Monday). */
export function presetRange(preset: DatePreset, today: string = localDate()): DateRangeValue {
  const monday = addDays(today, -((parseLocalDate(today).getDay() + 6) % 7));
  switch (preset) {
    case "今天": return { from: today, to: today };
    case "昨天": { const day = addDays(today, -1); return { from: day, to: day }; }
    case "近 7 天": return { from: addDays(today, -6), to: today };
    case "近 30 天": return { from: addDays(today, -29), to: today };
    case "本周": return { from: monday, to: addDays(monday, 6) };
    case "下周": return { from: addDays(monday, 7), to: addDays(monday, 13) };
    case "本月": return { from: monthEdge(today, 0, false), to: monthEdge(today, 0, true) };
    case "上月": return { from: monthEdge(today, -1, false), to: monthEdge(today, -1, true) };
  }
}

/**
 * Next draft after a day click: the first click starts a range, the second closes it
 * (in either direction), and a click after a complete range starts over.
 */
export function pickRangeDay(draft: DateRangeValue, day: string): DateRangeValue {
  if (!draft.from || draft.to) return { from: day, to: "" };
  return day < draft.from ? { from: day, to: draft.from } : { from: draft.from, to: day };
}

/** What a confirmed draft applies as: a lone start date means that single day. */
export function completeRange(draft: DateRangeValue): DateRangeValue {
  if (draft.from && !draft.to) return { from: draft.from, to: draft.from };
  if (!draft.from && draft.to) return { from: draft.to, to: draft.to };
  return draft;
}

export function formatRange(value: DateRangeValue, placeholder = "开始日期 → 结束日期"): string {
  if (!value.from && !value.to) return placeholder;
  if (value.from && value.from === value.to) return value.from;
  return `${value.from || "开始日期"} → ${value.to || "结束日期"}`;
}

export function rangeLength(value: DateRangeValue): number | undefined {
  return value.from && value.to ? daysBetween(value.from, value.to) + 1 : undefined;
}
