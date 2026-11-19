/** Helpers for "HH:mm" clock times within one day. */

export const DAY_MINUTES = 24 * 60;
/** The latest time the pickers offer. */
export const LAST_MINUTE = DAY_MINUTES - 5;

export function toMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function fromMinutes(total: number): string {
  const clamped = Math.min(Math.max(Math.round(total), 0), DAY_MINUTES - 1);
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

/** Adds minutes to a time, staying within the same day. */
export function addMinutes(time: string, minutes: number): string {
  const start = toMinutes(time);
  return start === null ? time : fromMinutes(Math.min(start + minutes, LAST_MINUTE));
}

/** Minutes from start to end, or null when either time is invalid or end is not later. */
export function durationMinutes(start: string, end: string): number | null {
  const from = toMinutes(start);
  const to = toMinutes(end);
  if (from === null || to === null || to <= from) return null;
  return to - from;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} 分钟`;
  return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`;
}

/**
 * When the start time moves, move the end with it so the class keeps its length.
 * An end that was not after the old start is left alone.
 */
export function shiftEnd(oldStart: string, oldEnd: string, newStart: string): string {
  const length = durationMinutes(oldStart, oldEnd);
  return length === null ? oldEnd : addMinutes(newStart, length);
}

/** Minute choices for a picker: every `step` minutes, plus the current minute if it falls between. */
export function minuteOptions(step: number, current?: number | null): number[] {
  const options = Array.from({ length: Math.ceil(60 / step) }, (_, index) => index * step);
  if (current != null && !options.includes(current)) options.push(current);
  return options.sort((a, b) => a - b);
}
