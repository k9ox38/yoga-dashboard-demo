import { describe, expect, it } from "vitest";
import type { ClassSession, ClassTemplate } from "../../components/data";
import { buildScheduleWeek, formatWeekRange, paletteIndex, scheduleImageFilename } from "../scheduleImage";

const templates: ClassTemplate[] = [
  { id: "t1", name: "晨间流动", description: "", level: "中级", format: "团课", capacity: 20 },
  { id: "t8", name: "一对一私教", description: "", level: "初级", format: "私教", capacity: 1 },
];

const session = (id: string, date: string, start: string, extra: Partial<ClassSession> = {}): ClassSession => ({
  id, classId: "t1", instructor: "吴安雅", room: "A 馆", date, start, end: "23:00", booked: 3, difficulty: 3, isVisible: true, ...extra,
});

const week = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"];

describe("schedule image", () => {
  it("lays the week out by day, in time order, leaving hidden and out-of-week classes off", () => {
    const result = buildScheduleWeek(week, [
      session("late", "2026-11-19", "18:30"),
      session("early", "2026-11-19", "07:00"),
      session("hidden", "2026-11-19", "09:00", { isVisible: false }),
      session("private", "2026-11-22", "14:00", { classId: "t8", booked: 1 }),
      session("next-week", "2026-11-23", "07:00"),
    ], templates);

    expect(result.days.map((day) => day.weekday)).toEqual(["周一", "周二", "周三", "周四", "周五", "周六", "周日"]);
    expect(result.days[3]).toMatchObject({ date: "2026-11-19", label: "11/19" });
    expect(result.days[3].items.map((item) => item.id)).toEqual(["early", "late"]);
    expect(result.days[6].items[0]).toMatchObject({ name: "一对一私教", format: "私教", booked: 1, capacity: 1 });
    expect(result.total).toBe(3);
    expect(result.hidden).toBe(1);
    expect(result.rangeLabel).toBe("2026 年 11 月 16 日 – 11 月 22 日");
    expect(scheduleImageFilename(result)).toBe("课程表-2026-11-16-2026-11-22.png");
  });

  it("names both years when the week crosses New Year", () => {
    expect(formatWeekRange("2026-12-28", "2027-01-03")).toBe("2026 年 12 月 28 日 – 2027 年 1 月 3 日");
  });

  it("gives a course the same colour every time", () => {
    expect(paletteIndex("t3")).toBe(paletteIndex("t3"));
    expect(paletteIndex("t1", 8)).toBeLessThan(8);
  });
});
