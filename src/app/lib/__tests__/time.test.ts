import { describe, expect, it } from "vitest";
import { addMinutes, durationMinutes, formatDuration, fromMinutes, minuteOptions, shiftEnd, toMinutes } from "../time";

describe("clock times", () => {
  it("parses and formats HH:mm", () => {
    expect(toMinutes("09:30")).toBe(570);
    expect(toMinutes("9:05")).toBe(545);
    expect(toMinutes("24:00")).toBeNull();
    expect(toMinutes("")).toBeNull();
    expect(fromMinutes(570)).toBe("09:30");
    expect(fromMinutes(-10)).toBe("00:00");
  });

  it("adds minutes without leaving the day", () => {
    expect(addMinutes("09:30", 75)).toBe("10:45");
    expect(addMinutes("23:30", 60)).toBe("23:55");
  });

  it("measures and labels a class length", () => {
    expect(durationMinutes("09:30", "10:45")).toBe(75);
    expect(durationMinutes("10:00", "10:00")).toBeNull();
    expect(durationMinutes("10:00", "09:00")).toBeNull();
    expect(formatDuration(45)).toBe("45 分钟");
    expect(formatDuration(60)).toBe("1 小时");
    expect(formatDuration(75)).toBe("1 小时 15 分钟");
  });

  it("moves the end time with the start time", () => {
    expect(shiftEnd("09:00", "10:00", "18:30")).toBe("19:30");
    expect(shiftEnd("09:30", "10:45", "09:00")).toBe("10:15");
    // An end that wasn't after the start has no length to keep.
    expect(shiftEnd("10:00", "09:00", "11:00")).toBe("09:00");
  });

  it("offers 5-minute steps and keeps an off-step current minute", () => {
    expect(minuteOptions(5)).toHaveLength(12);
    expect(minuteOptions(15, 40)).toEqual([0, 15, 30, 40, 45]);
  });
});
