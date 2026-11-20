import { describe, expect, it } from "vitest";
import type { ClassSession } from "../../components/data";
import { weekRange } from "../dates";
import { coachMetrics, coachTeamTotals } from "../coachMetrics";

const session = (id: string, instructor: string, date: string, booked: number): ClassSession => ({
  id, classId: "t1", instructor, room: "A 馆", date, start: "07:00", end: "08:00", booked, difficulty: 3, isVisible: true,
});

// Friday 20 November 2026; its week runs Monday 16 to Sunday 22.
const today = "2026-11-20";
const sessions = [
  session("a", "吴安雅", "2026-11-16", 18),
  session("b", "吴安雅", "2026-11-22", 20),
  session("c", "吴安雅", "2026-11-24", 0),
  session("d", "陈丽", "2026-11-20", 12),
  session("e", "陈丽", "2026-12-01", 5),
];

describe("coach metrics", () => {
  it("finds the Monday-to-Sunday week", () => {
    expect(weekRange("2026-11-20")).toEqual({ from: "2026-11-16", to: "2026-11-22" });
    expect(weekRange("2026-11-22")).toEqual({ from: "2026-11-16", to: "2026-11-22" });
    expect(weekRange("2026-11-16")).toEqual({ from: "2026-11-16", to: "2026-11-22" });
  });

  it("counts this week's classes and every booking for one coach", () => {
    expect(coachMetrics("吴安雅", sessions, today)).toEqual({ weekClasses: 2, studentVisits: 38 });
    expect(coachMetrics("拉吉", sessions, today)).toEqual({ weekClasses: 0, studentVisits: 0 });
  });

  it("totals the working coaches for the header", () => {
    expect(coachTeamTotals(new Set(["吴安雅", "陈丽"]), sessions, today)).toEqual({ weekClasses: 3, monthVisits: 50 });
    expect(coachTeamTotals(new Set(["陈丽"]), sessions, today)).toEqual({ weekClasses: 1, monthVisits: 12 });
  });
});
