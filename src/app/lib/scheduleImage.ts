import type { ClassSession, ClassTemplate } from "../components/data";
import { parseLocalDate } from "./dates";
import { difficultyLabel } from "./difficulty";

/** The week's classes as they appear on the exported timetable image. */

export const WEEKDAY_NAMES = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

/** How many colours the schedule cycles through; the week view and the image share the order. */
export const PALETTE_COUNT = 8;

/** A course keeps the same colour everywhere it appears. */
export function paletteIndex(classId: string, count = PALETTE_COUNT): number {
  const hash = classId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return hash % count;
}

export type ScheduleImageItem = {
  id: string;
  start: string;
  end: string;
  name: string;
  format: string;
  /** The class's own difficulty, as a word (入门 … 高级). */
  difficulty: string;
  instructor: string;
  room: string;
  booked: number;
  capacity: number;
  palette: number;
};

export type ScheduleImageDay = { date: string; weekday: string; label: string; items: ScheduleImageItem[] };

export type ScheduleImageWeek = {
  from: string;
  to: string;
  rangeLabel: string;
  days: ScheduleImageDay[];
  /** Classes shown on the image. */
  total: number;
  /** Classes left off because they are hidden from members. */
  hidden: number;
};

const monthDay = (date: Date) => `${date.getMonth() + 1} 月 ${date.getDate()} 日`;

export function formatWeekRange(from: string, to: string): string {
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  const tail = start.getFullYear() === end.getFullYear() ? monthDay(end) : `${end.getFullYear()} 年 ${monthDay(end)}`;
  return `${start.getFullYear()} 年 ${monthDay(start)} – ${tail}`;
}

/**
 * Builds the image's content for the given seven days (Monday first). Only classes members can
 * see are included, so the picture matches what the mini-program shows.
 */
export function buildScheduleWeek(dates: string[], sessions: ClassSession[], templates: ClassTemplate[]): ScheduleImageWeek {
  const inWeek = sessions.filter((session) => dates.includes(session.date));
  const days = dates.map((date, index) => {
    const day = parseLocalDate(date);
    const items = inWeek
      .filter((session) => session.date === date && session.isVisible)
      .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end))
      .map((session) => {
        const template = templates.find((item) => item.id === session.classId);
        return {
          id: session.id,
          start: session.start,
          end: session.end,
          name: template?.name ?? "未关联课程",
          format: template?.format ?? "",
          difficulty: difficultyLabel(session.difficulty),
          instructor: session.instructor,
          room: session.room,
          booked: session.booked,
          capacity: template?.capacity ?? 0,
          palette: paletteIndex(session.classId),
        };
      });
    return { date, weekday: WEEKDAY_NAMES[index] ?? "", label: `${day.getMonth() + 1}/${day.getDate()}`, items };
  });
  const total = days.reduce((sum, day) => sum + day.items.length, 0);
  return {
    from: dates[0],
    to: dates[dates.length - 1],
    rangeLabel: formatWeekRange(dates[0], dates[dates.length - 1]),
    days,
    total,
    hidden: inWeek.length - total,
  };
}

export function scheduleImageFilename(week: Pick<ScheduleImageWeek, "from" | "to">): string {
  return `课程表-${week.from}-${week.to}.png`;
}
