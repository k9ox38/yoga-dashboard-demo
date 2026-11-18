import { describe, expect, it } from "vitest";
import { completeRange, formatRange, pickRangeDay, presetRange, rangeLength } from "../dateRange";

describe("date range presets", () => {
  const wed = "2026-11-18";

  it("covers inclusive calendar ranges with Monday-start weeks", () => {
    expect(presetRange("今天", wed)).toEqual({ from: wed, to: wed });
    expect(presetRange("昨天", wed)).toEqual({ from: "2026-11-17", to: "2026-11-17" });
    expect(presetRange("近 7 天", wed)).toEqual({ from: "2026-11-12", to: wed });
    expect(presetRange("近 30 天", wed)).toEqual({ from: "2026-10-20", to: wed });
    expect(presetRange("本周", wed)).toEqual({ from: "2026-11-16", to: "2026-11-22" });
    expect(presetRange("下周", wed)).toEqual({ from: "2026-11-23", to: "2026-11-29" });
    expect(presetRange("本月", wed)).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(presetRange("上月", wed)).toEqual({ from: "2026-10-01", to: "2026-10-31" });
  });

  it("handles Sundays and year boundaries", () => {
    expect(presetRange("本周", "2026-11-22")).toEqual({ from: "2026-11-16", to: "2026-11-22" });
    expect(presetRange("上月", "2027-01-05")).toEqual({ from: "2026-12-01", to: "2026-12-31" });
    expect(presetRange("本月", "2028-02-10")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
  });
});

describe("picking a range", () => {
  it("starts, closes in either direction, then starts over", () => {
    const first = pickRangeDay({ from: "", to: "" }, "2026-11-10");
    expect(first).toEqual({ from: "2026-11-10", to: "" });
    expect(pickRangeDay(first, "2026-11-14")).toEqual({ from: "2026-11-10", to: "2026-11-14" });
    expect(pickRangeDay(first, "2026-11-03")).toEqual({ from: "2026-11-03", to: "2026-11-10" });
    expect(pickRangeDay({ from: "2026-11-10", to: "2026-11-14" }, "2026-11-20")).toEqual({ from: "2026-11-20", to: "" });
  });

  it("applies a lone start date as a single day and labels ranges", () => {
    expect(completeRange({ from: "2026-11-10", to: "" })).toEqual({ from: "2026-11-10", to: "2026-11-10" });
    expect(completeRange({ from: "", to: "" })).toEqual({ from: "", to: "" });
    expect(formatRange({ from: "", to: "" })).toBe("开始日期 → 结束日期");
    expect(formatRange({ from: "2026-11-10", to: "2026-11-10" })).toBe("2026-11-10");
    expect(formatRange({ from: "2026-11-01", to: "2026-11-18" })).toBe("2026-11-01 → 2026-11-18");
    expect(rangeLength({ from: "2026-11-01", to: "2026-11-18" })).toBe(18);
    expect(rangeLength({ from: "2026-11-01", to: "" })).toBeUndefined();
  });
});
