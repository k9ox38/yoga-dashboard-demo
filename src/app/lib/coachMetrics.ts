import type { ClassSession } from "../components/data";
import { localDate, weekRange } from "./dates";

/*
 * Coach numbers worked out from the schedule, the same way the real coach report does:
 * student visits (学员人次) count every booking in the coach's classes, so a member who comes
 * three times counts three times.
 */

export type CoachMetrics = {
  /** Classes this coach teaches this week (Monday to Sunday). */
  weekClasses: number;
  /** Bookings across all of this coach's classes. */
  studentVisits: number;
};

const inRange = (date: string, from: string, to: string) => date >= from && date <= to;

export function coachMetrics(name: string, sessions: ClassSession[], today: string = localDate()): CoachMetrics {
  const week = weekRange(today);
  const own = sessions.filter((session) => session.instructor === name);
  return {
    weekClasses: own.filter((session) => inRange(session.date, week.from, week.to)).length,
    studentVisits: own.reduce((sum, session) => sum + session.booked, 0),
  };
}

/** Totals for the coach page header, counting only coaches who are working. */
export function coachTeamTotals(names: Set<string>, sessions: ClassSession[], today: string = localDate()) {
  const week = weekRange(today);
  const month = today.slice(0, 7);
  const own = sessions.filter((session) => names.has(session.instructor));
  return {
    weekClasses: own.filter((session) => inRange(session.date, week.from, week.to)).length,
    monthVisits: own.filter((session) => session.date.startsWith(month)).reduce((sum, session) => sum + session.booked, 0),
  };
}
